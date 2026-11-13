import { randomUUID } from "node:crypto";
import { eq, isNull } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { PortalWriteError } from "../src/queries/players";
import {
  createPortalPlayer,
  getPortalPlayer,
  listPortalPlayers,
  listPortalSports,
  resolvePortalActor,
  searchPortalSchools,
  updatePlayerBio,
  updatePlayerSport,
} from "../src/queries/portal-admin";
import { pushPortal } from "../src/queries/portal-publish";
import {
  recordRecruitmentEvent,
  voidRecruitmentEvent,
} from "../src/queries/recruitments";
import {
  playerAuditLogTable,
  playerDuplicateDismissalsTable,
  playersTable,
  schoolsTable,
  sportsTable,
  usersTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const day = (n: number) => new Date(Date.UTC(2027, 0, n));

let footballId: string;
let montana: string;
let boiseState: string;

const entry = (overrides: Record<string, unknown> = {}) => ({
  sportId: footballId,
  cycleYear: 2027,
  origin: { schoolId: montana },
  enteredAt: day(2),
  classAtEntry: "RS-SO" as const,
  attributes: { position: "QB" },
  ...overrides,
});

beforeEach(async () => {
  await resetDatabase();
  footballId = randomUUID();
  await db.insert(sportsTable).values([
    { id: footballId, slug: "football", name: "Football" },
    { id: randomUUID(), slug: "womens-basketball", name: "Women's Basketball" },
    { id: randomUUID(), slug: "baseball", name: "Baseball" },
  ]);
  const schools = await db
    .insert(schoolsTable)
    .values([
      { name: "Montana", sanityId: "sanity-montana" },
      { name: "Boise State", sanityId: "sanity-boise-state" },
    ])
    .returning({ id: schoolsTable.id });
  montana = schools[0]!.id;
  boiseState = schools[1]!.id;
});

describe("portal admin queries", () => {
  it("lists only the tracker's sports", async () => {
    expect((await listPortalSports()).map((sport) => sport.slug)).toEqual([
      "football",
      "womens-basketball",
    ]);
  });

  it("uses an actor id only when the user has a row", async () => {
    await db
      .insert(usersTable)
      .values({ id: "user_admin", firstName: "A", lastName: "B" });
    expect(await resolvePortalActor("user_admin")).toBe("user_admin");
    expect(await resolvePortalActor("user_unknown")).toBeNull();
    expect(await resolvePortalActor(null)).toBeNull();
  });

  it("creates a player and their entry together", async () => {
    const created = await createPortalPlayer({
      firstName: " Jalen ",
      lastName: "Brooks",
      entry: entry(),
    });
    const player = await getPortalPlayer(created.id);
    expect(player).toMatchObject({
      firstName: "Jalen",
      slug: "jalen-brooks",
      pendingSince: expect.any(Date),
    });
    expect(player?.sports).toHaveLength(1);
    const [football] = player!.sports;
    expect(football).toMatchObject({ sportSlug: "football", position: "QB" });
    expect(football!.enrollments).toEqual([
      expect.objectContaining({ schoolName: "Montana", endYear: null }),
    ]);
    expect(football!.recruitments).toEqual([
      expect.objectContaining({
        status: "entered",
        originName: "Montana",
        destinationName: null,
        events: [expect.objectContaining({ type: "entered" })],
      }),
    ]);
  });

  it("leaves no player behind when the entry is refused", async () => {
    await expect(
      createPortalPlayer({
        firstName: "Jalen",
        lastName: "Brooks",
        entry: entry({ attributes: { position: "PG" } }),
      }),
    ).rejects.toBeInstanceOf(PortalWriteError);
    expect(await db.select({ id: playersTable.id }).from(playersTable)).toEqual(
      [],
    );
  });

  it("shows destinations, school names, sources, and voided events", async () => {
    const { id } = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
      entry: entry({ sourceNote: "coach" }),
    });
    const [recruitment] = (await getPortalPlayer(id))!.sports[0]!.recruitments;
    await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "offered",
      occurredAt: day(3),
      school: { schoolName: "Carroll College" },
    });
    const { recruitment: committed } = await recordRecruitmentEvent({
      recruitmentId: recruitment!.id,
      type: "committed",
      occurredAt: day(4),
      school: { schoolId: boiseState },
    });
    const commit = (await getPortalPlayer(id))!.sports[0]!.recruitments[0]!
      .events[2]!;
    expect(committed.status).toBe("committed");
    await voidRecruitmentEvent({ eventId: commit.id, reason: "typo" });

    const after = (await getPortalPlayer(id))!.sports[0]!.recruitments[0]!;
    expect(after.status).toBe("entered");
    expect(after.events.map((event) => event.schoolName)).toEqual([
      null,
      "Carroll College",
      "Boise State",
    ]);
    expect(after.events[0]).toMatchObject({ sourceNote: "coach" });
    expect(after.events[2]).toMatchObject({
      voidedAt: expect.any(Date),
      voidReason: "typo",
    });
  });

  it("remembers the similar players the admin said were different people", async () => {
    const first = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
    });
    const second = await createPortalPlayer({
      firstName: "Jaylen",
      lastName: "Brooks",
      notDuplicateOf: [first.id],
    });
    const third = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brookes",
      // A repeat, an unknown id, and its own id are skipped.
      notDuplicateOf: [second.id, first.id, first.id, 99_999_999],
    });
    const pairs = await db
      .select({
        a: playerDuplicateDismissalsTable.playerAId,
        b: playerDuplicateDismissalsTable.playerBId,
      })
      .from(playerDuplicateDismissalsTable)
      .orderBy(
        playerDuplicateDismissalsTable.playerAId,
        playerDuplicateDismissalsTable.playerBId,
      );
    expect(pairs).toEqual([
      { a: first.id, b: second.id },
      { a: first.id, b: third.id },
      { a: second.id, b: third.id },
    ]);
  });

  it("returns null for an unknown player", async () => {
    expect(await getPortalPlayer(1)).toBeNull();
  });

  it("pages players newest first and filters to pending", async () => {
    const ids: number[] = [];
    for (const lastName of ["One", "Two", "Three"]) {
      ids.push((await createPortalPlayer({ firstName: "A", lastName })).id);
    }
    await pushPortal({ trigger: "admin" });
    await updatePlayerBio({
      playerId: ids[0]!,
      firstName: "B",
      lastName: "One",
    });

    const first = await listPortalPlayers({ limit: 2 });
    expect(first.map((player) => player.id)).toEqual([ids[2], ids[1]]);
    const next = await listPortalPlayers({ beforeId: ids[1], limit: 2 });
    expect(next.map((player) => player.id)).toEqual([ids[0]]);
    expect(
      (await listPortalPlayers({ pendingOnly: true })).map((p) => p.id),
    ).toEqual([ids[0]]);
  });

  it("shows each sport's latest recruitment in the list", async () => {
    const { id } = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
      entry: entry(),
    });
    const [listed] = await listPortalPlayers();
    expect(listed).toMatchObject({
      id,
      latest: [
        expect.objectContaining({
          sportSlug: "football",
          status: "entered",
          originName: "Montana",
        }),
      ],
    });
  });

  it("renames a player, re-slugs, audits, and marks them pending", async () => {
    const { id } = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
    });
    await pushPortal({ trigger: "admin" });
    const updated = await updatePlayerBio({
      playerId: id,
      firstName: "Jaylen",
      lastName: "Brooks",
      suffix: "Jr.",
      hometownState: "MT",
    });
    expect(updated).toMatchObject({
      slug: "jaylen-brooks-jr",
      hometownState: "MT",
    });
    const [row] = await db
      .select({
        pendingSince: playersTable.pendingSince,
        nameSearch: playersTable.nameSearch,
      })
      .from(playersTable)
      .where(eq(playersTable.id, id));
    expect(row?.pendingSince).not.toBeNull();
    expect(row?.nameSearch).toBe("jaylen brooks jr");
    const pending = await db
      .select({ action: playerAuditLogTable.action })
      .from(playerAuditLogTable)
      .where(isNull(playerAuditLogTable.pushId));
    expect(pending).toEqual([{ action: "update" }]);
  });

  it("updates a sport's attributes and rejects a wrong position", async () => {
    const { id } = await createPortalPlayer({
      firstName: "Jalen",
      lastName: "Brooks",
    });
    await updatePlayerSport({
      playerId: id,
      sportId: footballId,
      attributes: { position: "WR", heightIn: 72 },
    });
    expect((await getPortalPlayer(id))!.sports[0]).toMatchObject({
      position: "WR",
      heightIn: 72,
    });
    await expect(
      updatePlayerSport({
        playerId: id,
        sportId: footballId,
        attributes: { position: "C" },
      }),
    ).rejects.toMatchObject({ code: "invalid_position" });
  });

  it("finds schools by name or short name", async () => {
    await db
      .update(schoolsTable)
      .set({ shortName: "BSU" })
      .where(eq(schoolsTable.id, boiseState));
    expect((await searchPortalSchools("bsu")).map((s) => s.id)).toEqual([
      boiseState,
    ]);
    expect((await searchPortalSchools("mon")).map((s) => s.id)).toEqual([
      montana,
    ]);
    expect(await searchPortalSchools("m")).toEqual([]);
    expect(await searchPortalSchools("%")).toEqual([]);
  });
});
