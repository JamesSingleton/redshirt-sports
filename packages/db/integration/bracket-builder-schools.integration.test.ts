import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { listBracketBuilderSchools } from "../src/queries/brackets";
import { FCS_FOOTBALL_DEFAULTS } from "../src/ratings/engine/config";
import {
  conferencesTable,
  divisionSportsTable,
  divisionsTable,
  ratingPoolMembersTable,
  ratingPoolsTable,
  schoolConferenceAffiliationsTable,
  seasonsTable,
} from "../src/schema";
import {
  createPollWeekFixture,
  db,
  FIXTURE_YEAR,
  type PollWeekFixture,
  resetDatabase,
} from "./fixtures";

let fixture: PollWeekFixture;

/**
 * Schools 1-3 are in the FCS rating pool. Schools 1-6 play in a Division I
 * conference and school 7 in a Division II one.
 */
beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture();
  const [season] = await db
    .select({ id: seasonsTable.id })
    .from(seasonsTable)
    .where(eq(seasonsTable.sportId, fixture.sportId));

  const [d1, d2, fcs] = await db
    .insert(divisionsTable)
    .values([
      { name: "NCAA DI", slug: "d1" },
      { name: "NCAA DII", slug: "d2" },
      { name: "FCS", slug: "fcs" },
    ])
    .returning();
  const [divisionSport] = await db
    .insert(divisionSportsTable)
    .values({ sportId: fixture.sportId, divisionId: fcs!.id })
    .returning();
  const [pool] = await db
    .insert(ratingPoolsTable)
    .values({
      divisionSportId: divisionSport!.id,
      sportId: fixture.sportId,
      slug: "fcs",
      name: "FCS",
      membership: { type: "espn_group", groupId: "81" },
      source: {
        espnLeague: "football/college-football",
        scoreboardGroups: "81",
        regulationPeriods: 4,
        ncaaPath: null,
      },
      schedule: { cadence: "weekly", freezeAfterHours: 10, windows: [] },
      config: FCS_FOOTBALL_DEFAULTS,
      methodVersion: 1,
    })
    .returning();
  await db.insert(ratingPoolMembersTable).values(
    fixture.schoolIds.slice(0, 3).map((schoolId) => ({
      poolId: pool!.id,
      seasonId: season!.id,
      schoolId,
      conferenceName: "Big Sky",
    })),
  );

  const [bigTen, gliac] = await db
    .insert(conferencesTable)
    .values([
      { name: "Big Ten Conference", shortName: "Big Ten", divisionId: d1!.id },
      { name: "GLIAC", divisionId: d2!.id },
    ])
    .returning();
  await db.insert(schoolConferenceAffiliationsTable).values([
    ...fixture.schoolIds.slice(0, 6).map((schoolId) => ({
      schoolId,
      sportId: fixture.sportId,
      conferenceId: bigTen!.id,
    })),
    {
      schoolId: fixture.schoolIds[6]!,
      sportId: fixture.sportId,
      conferenceId: gliac!.id,
    },
  ]);
});

describe("listBracketBuilderSchools", () => {
  it("lists the division's rating-pool members for the newest season", async () => {
    const schools = await listBracketBuilderSchools({
      sportSlug: fixture.sportSlug,
      divisionSlug: "fcs",
      year: FIXTURE_YEAR + 1,
    });
    expect(schools.map((school) => school.schoolId).sort()).toEqual(
      fixture.schoolIds.slice(0, 3).sort(),
    );
    expect(schools[0]).toMatchObject({
      name: expect.stringMatching(/^School \d$/),
      conference: "Big Sky",
      image: null,
    });
  });

  it("gives a subdivision without a pool the Division I schools in no pool", async () => {
    const schools = await listBracketBuilderSchools({
      sportSlug: fixture.sportSlug,
      divisionSlug: "fbs",
      year: FIXTURE_YEAR,
    });
    expect(schools.map((school) => school.schoolId).sort()).toEqual(
      fixture.schoolIds.slice(3, 6).sort(),
    );
    expect(schools.every((school) => school.conference === "Big Ten")).toBe(
      true,
    );
  });

  it("is empty for a sport with no schools", async () => {
    await expect(
      listBracketBuilderSchools({
        sportSlug: "no-such-sport",
        divisionSlug: "fbs",
        year: FIXTURE_YEAR,
      }),
    ).resolves.toEqual([]);
  });
});
