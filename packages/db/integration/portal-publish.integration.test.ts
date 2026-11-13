import { randomUUID } from "node:crypto";
import { asc, eq, isNull, type SQL, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  publishedPlayerDocSchema,
  publishedRedirectDocSchema,
  publishedWireRowSchema,
} from "../src/portal/published";
import { reduceRecruitment } from "../src/portal/reduce-recruitment";
import { createPlayer, PORTAL_PUSH_LOCK_SQL } from "../src/queries/players";
import {
  expirePendingPortalPushes,
  getPortalPendingSummary,
  pushPortal,
} from "../src/queries/portal-publish";
import {
  getRecruitmentEvents,
  openRecruitment,
  recordRecruitmentEvent,
  voidRecruitmentEvent,
} from "../src/queries/recruitments";
import {
  playerAuditLogTable,
  playersTable,
  portalPushesTable,
  publishedPlayersTable,
  publishedWireEventsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import {
  db,
  heldAdvisoryLocks,
  resetDatabase,
  settledWithin,
  waitForAdvisoryLockWaiter,
} from "./fixtures";

const day = (n: number, year = 2027) => new Date(Date.UTC(year, 0, n));

let sportId: string;
const school = { montana: "", sacState: "", boiseState: "", idaho: "" };

async function newPlayer(firstName = "Jalen", lastName = "Brooks") {
  return db.transaction((tx) => createPlayer(tx, { firstName, lastName }));
}

async function enter(
  playerId: number,
  overrides: Record<string, unknown> = {},
) {
  return openRecruitment({
    playerId,
    sportId,
    cycleYear: 2027,
    origin: { schoolId: school.montana },
    originStartYear: 2025,
    enteredAt: day(2),
    classAtEntry: "RS-SO",
    attributes: { position: "QB", heightIn: 74, weightLb: 205 },
    sourceType: "social",
    sourceUrl: "https://example.com/private-source",
    sourceNote: "DM from the player's coach",
    ...overrides,
  });
}

const move = (
  recruitmentId: number,
  type: Parameters<typeof recordRecruitmentEvent>[0]["type"],
  at: number,
  schoolId?: string,
) =>
  recordRecruitmentEvent({
    recruitmentId,
    type,
    occurredAt: day(at),
    school: schoolId ? { schoolId } : null,
    sourceNote: "private",
  });

const publishedPlayer = async (playerId: number) => {
  const [row] = await db
    .select()
    .from(publishedPlayersTable)
    .where(eq(publishedPlayersTable.playerId, playerId));
  return row;
};

const wireRows = (playerId: number) =>
  db
    .select()
    .from(publishedWireEventsTable)
    .where(eq(publishedWireEventsTable.playerId, playerId))
    .orderBy(
      asc(publishedWireEventsTable.occurredAt),
      asc(publishedWireEventsTable.eventId),
    );

/** Hold a lock in an open transaction until released, like an in-flight save or push. */
async function holdLock(statement: SQL) {
  let release!: () => void;
  let held!: () => void;
  const acquired = new Promise<void>((resolve) => {
    held = resolve;
  });
  const done = db.transaction(async (tx) => {
    await tx.execute(statement);
    held();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  });
  await acquired;
  return { release: () => release(), done };
}

beforeEach(async () => {
  await resetDatabase();
  sportId = randomUUID();
  await db
    .insert(sportsTable)
    .values({ id: sportId, slug: "football", name: "Football" });
  const schools = await db
    .insert(schoolsTable)
    .values([
      { name: "Montana", sanityId: "sanity-montana" },
      { name: "Sacramento State", sanityId: "sanity-sac-state" },
      { name: "Boise State", sanityId: "sanity-boise-state" },
      { name: "Idaho", sanityId: "sanity-idaho" },
    ])
    .returning();
  school.montana = schools[0]!.id;
  school.sacState = schools[1]!.id;
  school.boiseState = schools[2]!.id;
  school.idaho = schools[3]!.id;
});

afterEach(async () => {
  expect(await heldAdvisoryLocks()).toBe(0);
});

describe("pushPortal", () => {
  it("does nothing when nothing is pending", async () => {
    expect(await pushPortal({ trigger: "admin" })).toBeNull();
    expect(await db.select().from(portalPushesTable)).toEqual([]);
  });

  it("publishes a full window: one profile, one wire row per move", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await move(recruitment.id, "offered", 3, school.idaho);
    const { event: firstCommit } = await move(
      recruitment.id,
      "committed",
      5,
      school.sacState,
    );
    await move(recruitment.id, "decommitted", 7, school.sacState);
    await move(recruitment.id, "committed", 9, school.boiseState);
    await move(recruitment.id, "enrolled", 14, school.boiseState);

    const result = await pushPortal({ trigger: "admin" });
    expect(result).toMatchObject({ playerCount: 1 });
    expect(result!.tags.sort()).toEqual(
      ["portal:players", "portal:football:2027", `player:${player.id}`].sort(),
    );

    // Profile
    const published = await publishedPlayer(player.id);
    expect(published).toMatchObject({
      slug: "jalen-brooks",
      indexable: true,
      redirectToPlayerId: null,
      pushId: result!.pushId,
    });
    const doc = publishedPlayerDocSchema.parse(published!.doc);
    const [sport] = doc.sports;
    expect(sport).toMatchObject({
      sportSlug: "football",
      position: "QB",
      heightIn: 74,
    });
    expect(
      sport!.enrollments.map((row) => [
        row.schoolId,
        row.startYear,
        row.endYear,
      ]),
    ).toEqual([
      [school.montana, 2025, 2026],
      [school.boiseState, 2027, undefined],
    ]);
    const [published2027] = sport!.recruitments;
    expect(published2027).toMatchObject({
      status: "enrolled",
      classAtEntry: "RS-SO",
      origin: { schoolId: school.montana },
      destination: { schoolId: school.boiseState },
    });
    expect(published2027!.events.map((event) => event.type)).toEqual([
      "entered",
      "committed",
      "decommitted",
      "committed",
      "enrolled",
    ]);
    expect(published2027!.offers.map((offer) => offer.schoolId)).toEqual([
      school.idaho,
    ]);

    // Wire: offers aren't moves; the dropped commitment stays, marked.
    const wire = await wireRows(player.id);
    expect(wire.map((row) => row.type)).toEqual([
      "entered",
      "committed",
      "decommitted",
      "committed",
      "enrolled",
    ]);
    for (const row of wire) publishedWireRowSchema.parse(row.row);
    expect(
      wire.filter((row) => row.superseded).map((row) => row.eventId),
    ).toEqual([firstCommit.id]);
    expect(publishedWireRowSchema.parse(wire[0]!.row)).toMatchObject({
      firstName: "Jalen",
      position: "QB",
      status: "enrolled",
      origin: { schoolId: school.montana },
    });

    // Everything that was pending is now accounted for.
    expect(await getPortalPendingSummary()).toEqual({
      players: 0,
      changes: 0,
      oldestPendingSince: null,
    });
  });

  it("marks the same commitments superseded as the reducer", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await move(recruitment.id, "committed", 3, school.sacState);
    await move(recruitment.id, "signed", 4, school.sacState);
    await move(recruitment.id, "decommitted", 5, school.sacState);
    await move(recruitment.id, "committed", 6, school.idaho);
    await move(recruitment.id, "withdrew", 8);
    await pushPortal({ trigger: "admin" });

    const events = await getRecruitmentEvents(recruitment.id);
    const expected = reduceRecruitment(
      events.map((event) => ({ ...event, type: event.type as never })),
    ).supersededEventIds;
    const wire = await wireRows(player.id);
    expect(
      wire
        .filter((row) => row.superseded)
        .map((row) => row.eventId)
        .sort(),
    ).toEqual([...expected].sort());
    expect(expected).toHaveLength(3);
  });

  it("never publishes source fields", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await move(recruitment.id, "committed", 5, school.sacState);
    await pushPortal({ trigger: "admin" });

    const text = JSON.stringify([
      (await publishedPlayer(player.id))!.doc,
      ...(await wireRows(player.id)).map((row) => row.row),
    ]);
    expect(text).not.toMatch(/source|private|example\.com|coach/i);
  });

  it("keeps entered-only players out of search until they commit", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await pushPortal({ trigger: "admin" });
    expect((await publishedPlayer(player.id))!.indexable).toBe(false);

    await move(recruitment.id, "committed", 5, school.boiseState);
    await pushPortal({ trigger: "admin" });
    expect((await publishedPlayer(player.id))!.indexable).toBe(true);
  });

  it("publishes only what was pushed, and only the players that changed", async () => {
    const jalen = await newPlayer();
    const marcus = await newPlayer("Marcus", "Whitfield");
    const { recruitment } = await enter(jalen.id);
    await enter(marcus.id);
    await pushPortal({ trigger: "admin" });
    const marcusBefore = await publishedPlayer(marcus.id);

    // A save waits for the next push.
    await move(recruitment.id, "committed", 5, school.sacState);
    expect(await wireRows(jalen.id)).toHaveLength(1);
    expect(await getPortalPendingSummary()).toMatchObject({
      players: 1,
      changes: 1,
    });

    const second = await pushPortal({ trigger: "admin" });
    expect(second).toMatchObject({ playerCount: 1 });
    expect(second!.tags).toContain(`player:${jalen.id}`);
    expect(second!.tags).not.toContain(`player:${marcus.id}`);
    expect(await wireRows(jalen.id)).toHaveLength(2);
    expect(await publishedPlayer(marcus.id)).toEqual(marcusBefore);
  });

  it("drops a voided move from the site on the next push", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    const { event } = await move(
      recruitment.id,
      "committed",
      5,
      school.sacState,
    );
    await pushPortal({ trigger: "admin" });
    await voidRecruitmentEvent({ eventId: event.id, reason: "Wrong player" });
    await pushPortal({ trigger: "admin" });

    expect((await wireRows(player.id)).map((row) => row.type)).toEqual([
      "entered",
    ]);
    const doc = publishedPlayerDocSchema.parse(
      (await publishedPlayer(player.id))!.doc,
    );
    expect(doc.sports[0]!.recruitments[0]!.status).toBe("entered");
  });

  it("takes hidden players off the site", async () => {
    const player = await newPlayer();
    await enter(player.id);
    await pushPortal({ trigger: "admin" });

    await db
      .update(playersTable)
      .set({ hiddenAt: new Date(), pendingSince: new Date() })
      .where(eq(playersTable.id, player.id));
    const result = await pushPortal({ trigger: "admin" });

    expect(await publishedPlayer(player.id)).toBeUndefined();
    expect(await wireRows(player.id)).toEqual([]);
    expect(result!.tags).toContain("portal:football:2027");
  });

  it("publishes a merged player as a redirect with no wire rows", async () => {
    const loser = await newPlayer("Jaylen", "Brooks");
    const survivor = await newPlayer();
    await enter(loser.id);
    await pushPortal({ trigger: "admin" });

    await db
      .update(playersTable)
      .set({ mergedIntoId: survivor.id, pendingSince: new Date() })
      .where(eq(playersTable.id, loser.id));
    await pushPortal({ trigger: "admin" });

    const published = await publishedPlayer(loser.id);
    expect(published).toMatchObject({
      redirectToPlayerId: survivor.id,
      indexable: false,
    });
    expect(publishedRedirectDocSchema.parse(published!.doc)).toEqual({
      v: 1,
      redirectToPlayerId: survivor.id,
    });
    expect(await wireRows(loser.id)).toEqual([]);
  });

  it("stamps every pending change with the push that published it", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await move(recruitment.id, "committed", 5, school.sacState);
    const result = await pushPortal({ trigger: "cron" });

    const audit = await db
      .select({ pushId: playerAuditLogTable.pushId })
      .from(playerAuditLogTable);
    expect(audit).toHaveLength(3);
    expect(audit.every((row) => row.pushId === result!.pushId)).toBe(true);
    const [push] = await db.select().from(portalPushesTable);
    expect(push).toMatchObject({
      trigger: "cron",
      actorUserId: null,
      playerCount: 1,
      revalidatedAt: null,
    });
    expect(push!.tags).toEqual(result!.tags);
  });
});

describe("push and save locking", () => {
  it("a save waits while a push runs", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    const push = await holdLock(
      sql`select pg_advisory_xact_lock(${PORTAL_PUSH_LOCK_SQL})`,
    );

    const save = move(recruitment.id, "committed", 5, school.sacState);
    await waitForAdvisoryLockWaiter();
    expect(await settledWithin(save, 200)).toBe("pending");

    push.release();
    await push.done;
    await expect(save).resolves.toBeDefined();
  });

  it("a push waits for an in-flight save", async () => {
    const player = await newPlayer();
    await enter(player.id);
    const save = await holdLock(
      sql`select pg_advisory_xact_lock_shared(${PORTAL_PUSH_LOCK_SQL})`,
    );

    const push = pushPortal({ trigger: "admin" });
    await waitForAdvisoryLockWaiter();
    expect(await settledWithin(push, 200)).toBe("pending");

    save.release();
    await save.done;
    await expect(push).resolves.toMatchObject({ playerCount: 1 });
  });

  it("two pushes run one after the other", async () => {
    const player = await newPlayer();
    await enter(player.id);
    const [first, second] = await Promise.all([
      pushPortal({ trigger: "admin" }),
      pushPortal({ trigger: "cron" }),
    ]);
    // One publishes; the other finds nothing left.
    expect([first, second].filter(Boolean)).toHaveLength(1);
  });
});

describe("expirePendingPortalPushes", () => {
  it("expires each push once and retries the ones that failed", async () => {
    const player = await newPlayer();
    await enter(player.id);
    const result = await pushPortal({ trigger: "admin" });

    const failing = await expirePendingPortalPushes(() => {
      throw new Error("revalidate endpoint returned 500");
    });
    expect(failing).toEqual({
      expired: 0,
      failed: [
        { pushId: result!.pushId, error: "revalidate endpoint returned 500" },
      ],
    });

    const expired: string[][] = [];
    const retry = await expirePendingPortalPushes((tags) => {
      expired.push(tags);
    });
    expect(retry).toEqual({ expired: 1, failed: [] });
    expect(expired).toEqual([result!.tags]);
    const [push] = await db
      .select()
      .from(portalPushesTable)
      .where(isNull(portalPushesTable.revalidatedAt));
    expect(push).toBeUndefined();

    expect(await expirePendingPortalPushes(() => {})).toEqual({
      expired: 0,
      failed: [],
    });
  });
});
