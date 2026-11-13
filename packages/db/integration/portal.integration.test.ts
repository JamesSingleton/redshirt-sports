import { randomUUID } from "node:crypto";
import { asc, eq, isNull, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { reduceRecruitment } from "../src/portal/reduce-recruitment";
import {
  createPlayer,
  findSimilarPlayers,
  PortalWriteError,
} from "../src/queries/players";
import {
  getRecruitmentEvents,
  openRecruitment,
  recordRecruitmentEvent,
  voidRecruitmentEvent,
} from "../src/queries/recruitments";
import {
  conferencesTable,
  divisionsTable,
  playerAuditLogTable,
  playerEnrollmentsTable,
  playersTable,
  publishedPlayersTable,
  publishedWireEventsTable,
  recruitmentEventsTable,
  recruitmentsTable,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  sportsTable,
} from "../src/schema";
import { db, resetDatabase } from "./fixtures";

const day = (n: number, year = 2027) => new Date(Date.UTC(year, 0, n));

let sportId: string;
const school = { montana: "", sacState: "", boiseState: "", idaho: "" };
let bigSkyId: string;
let fcsId: string;

async function newPlayer(firstName = "Jalen", lastName = "Brooks") {
  return db.transaction((tx) => createPlayer(tx, { firstName, lastName }));
}

function enter(playerId: number, overrides: Record<string, unknown> = {}) {
  return openRecruitment({
    playerId,
    sportId,
    cycleYear: 2027,
    origin: { schoolId: school.montana },
    originStartYear: 2025,
    enteredAt: day(2),
    classAtEntry: "RS-SO",
    ...overrides,
  });
}

const enrollmentsOf = (playerSportId: number) =>
  db
    .select()
    .from(playerEnrollmentsTable)
    .where(eq(playerEnrollmentsTable.playerSportId, playerSportId))
    .orderBy(
      asc(playerEnrollmentsTable.startYear),
      asc(playerEnrollmentsTable.id),
    );

const recruitmentById = async (id: number) => {
  const [row] = await db
    .select()
    .from(recruitmentsTable)
    .where(eq(recruitmentsTable.id, id));
  return row!;
};

/** Run a statement that the database itself should refuse, and name the constraint that did. */
async function expectConstraint(run: () => Promise<unknown>, name: string) {
  let caught: unknown;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${name} to reject the write`).toBeDefined();
  const cause = (caught as { cause?: unknown }).cause as
    | { message?: string; constraint_name?: string }
    | undefined;
  expect(
    `${(caught as Error).message} ${cause?.message ?? ""} ${cause?.constraint_name ?? ""}`,
  ).toContain(name);
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

  const [division] = await db
    .insert(divisionsTable)
    .values({ name: "FCS", sanityId: "sanity-fcs" })
    .returning();
  fcsId = division!.id;
  const [conference] = await db
    .insert(conferencesTable)
    .values({ name: "Big Sky", sanityId: "sanity-big-sky", divisionId: fcsId })
    .returning();
  bigSkyId = conference!.id;
  await db.insert(schoolConferenceAffiliationsTable).values({
    schoolId: school.montana,
    sportId,
    conferenceId: bigSkyId,
  });
});

describe("players", () => {
  it("numbers players from 100000 and derives slug and search name", async () => {
    const player = await db.transaction((tx) =>
      createPlayer(tx, {
        firstName: "José",
        lastName: "Peña-Ruiz",
        suffix: "Jr.",
      }),
    );
    expect(player.id).toBe(100_000);
    expect(player.slug).toBe("jose-pena-ruiz-jr");
    expect(player.nameSearch).toBe("jose pena ruiz jr");
    expect(player.pendingSince).not.toBeNull();
  });

  it("finds likely duplicates by name and shows where they play", async () => {
    const jalen = await newPlayer("Jalen", "Brooks");
    await newPlayer("Marcus", "Whitfield");
    await enter(jalen.id);

    const matches = await findSimilarPlayers("Jaylen Brooks");
    expect(matches.map((match) => match.id)).toEqual([jalen.id]);
    expect(matches[0]!.currentSchools).toEqual(["Montana (football)"]);
    expect(await findSimilarPlayers("Zz")).toEqual([]);
  });

  it("rejects a position from another sport", async () => {
    const player = await newPlayer();
    await expect(
      enter(player.id, { attributes: { position: "PG" } }),
    ).rejects.toMatchObject({ code: "invalid_position" });
  });
});

describe("one window: enter, commit, re-enter, commit, enroll", () => {
  it("is one recruitment that stays open until the player enrolls", async () => {
    const player = await newPlayer();
    const { recruitment, playerSport } = await enter(player.id, {
      attributes: { position: "QB", heightIn: 74, weightLb: 205 },
    });
    const statuses = [recruitment.status];
    const steps = [
      { type: "committed", at: 5, schoolId: school.sacState },
      { type: "decommitted", at: 7, schoolId: school.sacState },
      { type: "committed", at: 9, schoolId: school.boiseState },
      { type: "enrolled", at: 14, schoolId: school.boiseState },
    ] as const;
    for (const step of steps) {
      const result = await recordRecruitmentEvent({
        recruitmentId: recruitment.id,
        type: step.type,
        occurredAt: day(step.at),
        school: { schoolId: step.schoolId },
      });
      statuses.push(result.recruitment.status);
    }
    expect(statuses).toEqual([
      "entered",
      "committed",
      "entered",
      "committed",
      "enrolled",
    ]);

    const all = await db.select().from(recruitmentsTable);
    expect(all).toHaveLength(1);
    const stored = all[0]!;
    expect(stored.closedAt).toEqual(day(14));
    expect(stored.destinationSchoolId).toBe(school.boiseState);
    expect(stored.enteredAt).toEqual(day(2));
    expect(stored.classAtEntry).toBe("RS-SO");

    const enrollments = await enrollmentsOf(playerSport.id);
    expect(
      enrollments.map((row) => [row.schoolId, row.startYear, row.endYear]),
    ).toEqual([
      [school.montana, 2025, 2026],
      [school.boiseState, 2027, null],
    ]);
    expect(enrollments[1]!.viaRecruitmentId).toBe(recruitment.id);
  });

  it("keeps the player at their old school while committed", async () => {
    const player = await newPlayer();
    const { recruitment, playerSport } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: school.sacState },
    });
    const enrollments = await enrollmentsOf(playerSport.id);
    expect(enrollments).toHaveLength(1);
    expect(enrollments[0]).toMatchObject({
      schoolId: school.montana,
      endYear: null,
    });
  });

  it("stores exactly what the reducer says the events add up to", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "offered",
      occurredAt: day(3),
      school: { schoolId: school.idaho },
    });
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: school.sacState },
    });

    const events = await getRecruitmentEvents(recruitment.id);
    const expected = reduceRecruitment(
      events.map((event) => ({ ...event, type: event.type as never })),
    );
    const stored = await recruitmentById(recruitment.id);
    expect({
      status: stored.status,
      statusAt: stored.statusAt,
      enteredAt: stored.enteredAt,
      destinationSchoolId: stored.destinationSchoolId,
      closedAt: stored.closedAt,
    }).toEqual({
      status: expected.status,
      statusAt: expected.statusAt,
      enteredAt: expected.enteredAt,
      destinationSchoolId: expected.destination?.schoolId ?? null,
      closedAt: expected.closedAt,
    });
  });
});

describe("transfer, play, transfer again", () => {
  it("is two recruitments, the second starting from the first one's enrollment", async () => {
    const player = await newPlayer();
    const first = await enter(player.id, {
      cycleYear: 2025,
      originStartYear: 2023,
      enteredAt: day(2, 2025),
    });
    await recordRecruitmentEvent({
      recruitmentId: first.recruitment.id,
      type: "enrolled",
      occurredAt: day(14, 2025),
      school: { schoolId: school.sacState },
    });

    const second = await enter(player.id, {
      origin: { schoolId: school.sacState },
    });
    await recordRecruitmentEvent({
      recruitmentId: second.recruitment.id,
      type: "enrolled",
      occurredAt: day(14),
      school: { schoolId: school.boiseState },
    });

    const enrollments = await enrollmentsOf(first.playerSport.id);
    expect(
      enrollments.map((row) => [row.schoolId, row.startYear, row.endYear]),
    ).toEqual([
      [school.montana, 2023, 2024],
      [school.sacState, 2025, 2026],
      [school.boiseState, 2027, null],
    ]);
    expect(second.recruitment.originEnrollmentId).toBe(enrollments[1]!.id);
    expect(second.recruitment.originSchoolId).toBe(school.sacState);
    expect(await db.select().from(recruitmentsTable)).toHaveLength(2);
  });

  it("allows a second entry in the same cycle once the first has closed", async () => {
    const player = await newPlayer();
    const winter = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: winter.recruitment.id,
      type: "enrolled",
      occurredAt: day(14),
      school: { schoolId: school.sacState },
    });
    const spring = await enter(player.id, {
      origin: { schoolId: school.sacState },
      enteredAt: new Date(Date.UTC(2027, 3, 16)),
    });
    await recordRecruitmentEvent({
      recruitmentId: spring.recruitment.id,
      type: "enrolled",
      occurredAt: new Date(Date.UTC(2027, 4, 20)),
      school: { schoolId: school.boiseState },
    });
    const enrollments = await enrollmentsOf(winter.playerSport.id);
    expect(
      enrollments.map((row) => [row.schoolId, row.startYear, row.endYear]),
    ).toEqual([
      [school.montana, 2025, 2026],
      // Arrived in January, left in the spring: never earlier than they came.
      [school.sacState, 2027, 2027],
      [school.boiseState, 2027, null],
    ]);
  });

  it("refuses a second open recruitment, in code and in the database", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await expect(enter(player.id)).rejects.toMatchObject({
      code: "recruitment_open",
    });

    await expectConstraint(
      () =>
        db.insert(recruitmentsTable).values({
          playerSportId: recruitment.playerSportId,
          cycleYear: 2028,
          originSchoolId: school.montana,
          statusAt: day(2, 2028),
          enteredAt: day(2, 2028),
        }),
      "recruitments_one_open_per_player_sport",
    );
  });

  it("refuses an entry from a school the player is not at", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "withdrew",
      occurredAt: day(6),
    });
    await expect(
      enter(player.id, { origin: { schoolId: school.idaho } }),
    ).rejects.toMatchObject({ code: "current_school_mismatch" });
  });
});

describe("withdrawals, offers and corrections", () => {
  it("a withdrawal closes the recruitment and leaves the player where they were", async () => {
    const player = await newPlayer();
    const { recruitment, playerSport } = await enter(player.id);
    const { recruitment: closed } = await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "withdrew",
      occurredAt: day(6),
    });
    expect(closed).toMatchObject({
      status: "withdrawn",
      destinationSchoolId: null,
    });
    expect(closed.closedAt).toEqual(day(6));
    expect(await enrollmentsOf(playerSport.id)).toMatchObject([
      { schoolId: school.montana, endYear: null },
    ]);
    // Free to enter again next cycle.
    await expect(
      enter(player.id, { cycleYear: 2028, enteredAt: day(2, 2028) }),
    ).resolves.toBeDefined();
  });

  it("offers are recorded without changing status, one per school", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    const offer = (ref: { schoolId?: string; schoolName?: string }) =>
      recordRecruitmentEvent({
        recruitmentId: recruitment.id,
        type: "offered",
        occurredAt: day(3),
        school: ref,
        sourceType: "social",
      });
    const first = await offer({ schoolId: school.idaho });
    await offer({ schoolName: "Carroll College" });
    expect(first.recruitment.status).toBe("entered");
    expect(first.state.offers).toHaveLength(1);

    await expect(offer({ schoolId: school.idaho })).rejects.toMatchObject({
      code: "invalid_transition",
    });
    const event = (ref: { schoolId?: string; schoolName?: string }) => ({
      recruitmentId: recruitment.id,
      type: "offered",
      occurredAt: day(4),
      ...ref,
    });
    await expectConstraint(
      () =>
        db
          .insert(recruitmentEventsTable)
          .values(event({ schoolId: school.idaho })),
      "recruitment_events_one_live_offer_per_school",
    );
    await expectConstraint(
      () =>
        db
          .insert(recruitmentEventsTable)
          .values(event({ schoolName: "CARROLL COLLEGE" })),
      "recruitment_events_one_live_offer_per_school_name",
    );
  });

  it("an impossible move writes nothing", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: school.sacState },
    });
    await expect(
      recordRecruitmentEvent({
        recruitmentId: recruitment.id,
        type: "committed",
        occurredAt: day(6),
        school: { schoolId: school.boiseState },
      }),
    ).rejects.toBeInstanceOf(PortalWriteError);
    expect(await getRecruitmentEvents(recruitment.id)).toHaveLength(2);
    expect((await recruitmentById(recruitment.id)).destinationSchoolId).toBe(
      school.sacState,
    );
  });

  it("voiding an enrollment reopens the recruitment and puts the player back", async () => {
    const player = await newPlayer();
    const { recruitment, playerSport } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "committed",
      occurredAt: day(9),
      school: { schoolId: school.boiseState },
    });
    const { event: enrolled } = await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "enrolled",
      occurredAt: day(14),
      school: { schoolId: school.boiseState },
    });

    const { recruitment: reopened } = await voidRecruitmentEvent({
      eventId: enrolled.id,
      reason: "Entered on the wrong player",
    });
    expect(reopened).toMatchObject({ status: "committed", closedAt: null });
    expect(await enrollmentsOf(playerSport.id)).toMatchObject([
      { schoolId: school.montana, endYear: null },
    ]);
    const events = await getRecruitmentEvents(recruitment.id);
    expect(events).toHaveLength(3);
    expect(events[2]!.voidedAt).not.toBeNull();
    await expect(
      voidRecruitmentEvent({ eventId: enrolled.id }),
    ).rejects.toMatchObject({ code: "event_already_voided" });
  });

  it("refuses to undo an enrollment a later entry depends on", async () => {
    const player = await newPlayer();
    const first = await enter(player.id, {
      cycleYear: 2025,
      originStartYear: 2023,
      enteredAt: day(2, 2025),
    });
    const { event: enrolled } = await recordRecruitmentEvent({
      recruitmentId: first.recruitment.id,
      type: "enrolled",
      occurredAt: day(14, 2025),
      school: { schoolId: school.sacState },
    });
    await enter(player.id, { origin: { schoolId: school.sacState } });
    await expect(
      voidRecruitmentEvent({ eventId: enrolled.id }),
    ).rejects.toMatchObject({ code: "later_recruitment_exists" });
  });

  it("the entry event cannot be voided out from under a recruitment", async () => {
    const player = await newPlayer();
    const { event } = await enter(player.id);
    await expect(
      voidRecruitmentEvent({ eventId: event.id }),
    ).rejects.toMatchObject({ code: "invalid_transition" });
  });
});

describe("snapshots, audit and pending state", () => {
  it("snapshots the origin school's conference and division at entry", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    expect(recruitment).toMatchObject({
      originSchoolId: school.montana,
      originConferenceId: bigSkyId,
      originDivisionId: fcsId,
    });
    // A later realignment must not rewrite the move.
    await db.delete(schoolConferenceAffiliationsTable);
    expect(await recruitmentById(recruitment.id)).toMatchObject({
      originConferenceId: bigSkyId,
      originDivisionId: fcsId,
    });
  });

  it("accepts a free-text school we have no row for", async () => {
    const player = await newPlayer();
    const { recruitment, playerSport } = await enter(player.id);
    const { recruitment: enrolled } = await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "enrolled",
      occurredAt: day(14),
      school: { schoolName: "Carroll College" },
    });
    expect(enrolled).toMatchObject({
      destinationSchoolId: null,
      destinationSchoolName: "Carroll College",
      destinationDivisionId: null,
    });
    const enrollments = await enrollmentsOf(playerSport.id);
    expect(enrollments[1]).toMatchObject({
      schoolId: null,
      schoolName: "Carroll College",
      endYear: null,
    });
  });

  it("marks the player pending and audits every change, publishing nothing", async () => {
    const player = await newPlayer();
    await db
      .update(playersTable)
      .set({ pendingSince: null })
      .where(eq(playersTable.id, player.id));
    const { recruitment } = await enter(player.id);
    await recordRecruitmentEvent({
      recruitmentId: recruitment.id,
      type: "committed",
      occurredAt: day(5),
      school: { schoolId: school.sacState },
    });

    const [stored] = await db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, player.id));
    expect(stored!.pendingSince).not.toBeNull();
    const pending = await db
      .select({ action: playerAuditLogTable.action })
      .from(playerAuditLogTable)
      .where(isNull(playerAuditLogTable.pushId))
      .orderBy(asc(playerAuditLogTable.id));
    expect(pending.map((row) => row.action)).toEqual([
      "create",
      "entered",
      "committed",
    ]);
    expect(await db.select().from(publishedPlayersTable)).toEqual([]);
    expect(await db.select().from(publishedWireEventsTable)).toEqual([]);
  });
});

describe("database constraints", () => {
  it("rejects malformed events regardless of what the app sends", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    const base = { recruitmentId: recruitment.id, occurredAt: day(5) };

    await expectConstraint(
      () =>
        db
          .insert(recruitmentEventsTable)
          .values({ ...base, type: "committed" }),
      "recruitment_events_school_check",
    );
    await expectConstraint(
      () =>
        db.insert(recruitmentEventsTable).values({
          ...base,
          type: "withdrew",
          schoolId: school.idaho,
        }),
      "recruitment_events_school_check",
    );
    await expectConstraint(
      () =>
        db.insert(recruitmentEventsTable).values({
          ...base,
          type: "committed",
          schoolId: school.idaho,
          sourceUrl: "http://example.com/post",
        }),
      "recruitment_events_source_url_check",
    );
    await expectConstraint(
      () =>
        db.insert(recruitmentEventsTable).values({ ...base, type: "expected" }),
      "recruitment_events_type_check",
    );
    await expectConstraint(
      () =>
        db.insert(recruitmentEventsTable).values({ ...base, type: "entered" }),
      "recruitment_events_one_live_entered",
    );
  });

  it("rejects recruitments whose status and closure disagree", async () => {
    const player = await newPlayer();
    const { recruitment } = await enter(player.id);
    const update = (set: Record<string, unknown>) => () =>
      db
        .update(recruitmentsTable)
        .set(set)
        .where(eq(recruitmentsTable.id, recruitment.id));

    await expectConstraint(
      update({ status: "enrolled", destinationSchoolId: school.idaho }),
      "recruitments_closed_check",
    );
    await expectConstraint(
      update({ status: "committed" }),
      "recruitments_destination_check",
    );
    await expectConstraint(
      update({ classAtEntry: "SOPH" }),
      "recruitments_class_at_entry_check",
    );
  });

  it("has row level security on every public table", async () => {
    const open = await db.execute<{ relname: string }>(sql`
      select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
      order by c.relname
    `);
    expect(open.map((row) => row.relname)).toEqual([]);
  });
});
