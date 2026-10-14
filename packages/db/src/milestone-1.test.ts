import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL ?? "";
const local =
  databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");

describe.skipIf(!local)("milestone 1 local schema", () => {
  const sportId = "m1-sport";
  const seasonId = "m1-season";
  const userA = "m1-user-a";
  const userB = "m1-user-b";
  const eventId = "m1-event";

  afterAll(async () => {
    const { adminDb } = await import("./client");
    const { bracketEntriesTable, bracketEventsTable } = await import(
      "./schema"
    );
    await adminDb
      .delete(bracketEntriesTable)
      .where(eq(bracketEntriesTable.eventId, eventId));
    await adminDb
      .delete(bracketEventsTable)
      .where(eq(bracketEventsTable.id, eventId));
  });

  it("rejects a second bracket event for the same sport, division, and season", async () => {
    const { adminDb } = await import("./client");
    const {
      bracketEventsTable,
      bracketFormatsTable,
      seasonsTable,
      sportsTable,
    } = await import("./schema");

    await adminDb
      .insert(sportsTable)
      .values({ id: sportId, slug: "m1-football", name: "M1 Football" })
      .onConflictDoNothing();
    await adminDb
      .insert(seasonsTable)
      .values({
        id: seasonId,
        year: 2026,
        startDate: new Date("2026-08-01T00:00:00Z"),
        endDate: new Date("2027-01-01T00:00:00Z"),
        sportId,
      })
      .onConflictDoNothing();
    await adminDb
      .insert(bracketFormatsTable)
      .values({
        code: "fcs24",
        name: "FCS 24",
        sportId,
        teamCount: 24,
        gameCount: 23,
        rounds: 5,
        definition: { games: 23 },
      })
      .onConflictDoNothing();

    await adminDb
      .insert(bracketEventsTable)
      .values({
        id: eventId,
        sportId,
        division: "fcs",
        seasonId,
        year: 2026,
        formatCode: "fcs24",
        name: "2026 FCS",
        lockAt: new Date("2026-11-28T00:00:00Z"),
      })
      .onConflictDoNothing();

    await expect(
      adminDb.insert(bracketEventsTable).values({
        id: "m1-event-duplicate",
        sportId,
        division: "fcs",
        seasonId,
        year: 2026,
        formatCode: "fcs24",
        name: "Duplicate",
        lockAt: new Date("2026-11-28T00:00:00Z"),
      }),
    ).rejects.toThrow();
  });

  it("does not let user A read user B's bracket entry", async () => {
    const { adminDb, withRls } = await import("./client");
    const { bracketEntriesTable, usersTable } = await import("./schema");

    await adminDb
      .insert(usersTable)
      .values([
        { id: userA, firstName: "Example", lastName: "Voter A", isVoter: true },
        { id: userB, firstName: "Example", lastName: "Voter B", isVoter: true },
      ])
      .onConflictDoNothing();

    await adminDb
      .insert(bracketEntriesTable)
      .values([
        { id: "m1-entry-a", eventId, userId: userA, name: "A" },
        { id: "m1-entry-b", eventId, userId: userB, name: "B" },
      ])
      .onConflictDoNothing();

    const visible = await withRls({ sub: userA }, (tx) =>
      tx.select({ id: bracketEntriesTable.id }).from(bracketEntriesTable),
    );

    expect(visible.map((row) => row.id)).toEqual(["m1-entry-a"]);
  });
});
