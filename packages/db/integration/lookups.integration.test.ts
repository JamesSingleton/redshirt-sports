import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getPollBySportSlugAndPollSlug,
  resolvePollWeekBySlugs,
} from "../src/queries/polls";
import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getSchoolRankingHistory,
  replacePollRankings,
} from "../src/queries/rankings";
import {
  clearSportIdCache,
  getSportIdBySlug,
  type SportParam,
} from "../src/queries/sports";
import {
  getVotesForWeekAndYearByVoter,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  submitBallot,
} from "../src/queries/voting";
import {
  SEASON_TYPE_CODES,
  schoolsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../src/schema";
import {
  ballotEntries,
  createPollWeekFixture,
  createVoter,
  db,
  FIXTURE_POLL_SLUG,
  FIXTURE_YEAR,
  type PollWeekFixture,
  resetDatabase,
} from "./fixtures";

let fixture: PollWeekFixture;
const sport = () => fixture.sportSlug as SportParam;

beforeEach(async () => {
  await resetDatabase();
  clearSportIdCache();
  fixture = await createPollWeekFixture({ weekCount: 2 });
});

describe("resolvePollWeekBySlugs", () => {
  it("resolves the poll and its week in one query", async () => {
    await expect(
      resolvePollWeekBySlugs({
        sport: sport(),
        division: FIXTURE_POLL_SLUG,
        year: FIXTURE_YEAR,
        legacyWeek: 2,
      }),
    ).resolves.toMatchObject({
      sportId: fixture.sportId,
      poll: { id: fixture.pollId, slug: FIXTURE_POLL_SLUG },
      weekId: fixture.weekIds[1],
    });
  });

  it("returns the poll with no week when the week is missing or not asked for", async () => {
    const missingWeek = await resolvePollWeekBySlugs({
      sport: sport(),
      division: FIXTURE_POLL_SLUG,
      year: FIXTURE_YEAR,
      legacyWeek: 9,
    });
    expect(missingWeek?.poll.id).toBe(fixture.pollId);
    expect(missingWeek?.weekId).toBeNull();

    const noWeek = await resolvePollWeekBySlugs({
      sport: sport(),
      division: FIXTURE_POLL_SLUG,
    });
    expect(noWeek?.weekId).toBeNull();
    expect(
      (
        await getPollBySportSlugAndPollSlug({
          sportSlug: sport(),
          pollSlug: FIXTURE_POLL_SLUG,
        })
      )?.id,
    ).toBe(fixture.pollId);
  });

  it("returns null for an unknown poll or sport", async () => {
    await expect(
      resolvePollWeekBySlugs({ sport: sport(), division: "nope" }),
    ).resolves.toBeNull();
    await expect(
      getPollBySportSlugAndPollSlug({
        sportSlug: "no-sport" as SportParam,
        pollSlug: FIXTURE_POLL_SLUG,
      }),
    ).resolves.toBeNull();
  });
});

describe("getVotesForWeekAndYearByVoter", () => {
  it("groups each voter's ballot with their name", async () => {
    const voter = await createVoter(fixture, {
      firstName: "Pat",
      lastName: "Voter",
    });
    await submitBallot({
      pollId: fixture.pollId,
      userId: voter.id,
      weekId: fixture.weekIds[0]!,
      entries: ballotEntries(fixture),
    });

    const byVoter = await getVotesForWeekAndYearByVoter({
      year: FIXTURE_YEAR,
      week: 1,
      division: FIXTURE_POLL_SLUG,
      sportId: fixture.sportId,
    });
    expect(Object.keys(byVoter)).toEqual([voter.id]);
    expect(byVoter[voter.id]?.userData).toMatchObject({
      firstName: "Pat",
      lastName: "Voter",
    });
    expect(byVoter[voter.id]?.votes).toHaveLength(25);
    // Only what the ballots pages read: who, the rank, and the team.
    expect(byVoter[voter.id]?.votes[0]).toEqual({
      userId: voter.id,
      rank: 1,
      teamId: expect.any(String),
    });

    await expect(
      getVotesForWeekAndYearByVoter({
        year: FIXTURE_YEAR,
        week: 9,
        division: FIXTURE_POLL_SLUG,
        sportId: fixture.sportId,
      }),
    ).resolves.toEqual({});
  });
});

describe("getSportIdBySlug", () => {
  it("remembers found ids and looks misses up again", async () => {
    expect(await getSportIdBySlug(sport())).toBe(fixture.sportId);
    // Renaming the sport doesn't change a remembered id.
    await db
      .update(sportsTable)
      .set({ slug: `${fixture.sportSlug}-renamed` })
      .where(eq(sportsTable.id, fixture.sportId));
    expect(await getSportIdBySlug(sport())).toBe(fixture.sportId);

    const later = `${fixture.sportSlug}-later` as SportParam;
    expect(await getSportIdBySlug(later)).toBeNull();
    await db
      .update(sportsTable)
      .set({ slug: later })
      .where(eq(sportsTable.id, fixture.sportId));
    expect(await getSportIdBySlug(later)).toBe(fixture.sportId);
  });
});

describe("published-week lookups", () => {
  async function publishWeek(weekIndex: number) {
    await replacePollRankings({
      pollId: fixture.pollId,
      weekId: fixture.weekIds[weekIndex]!,
      rankings: fixture.schoolIds.slice(0, 3).map((schoolId, index) => ({
        schoolId,
        rank: index + 1,
        points: 75 - index * 25,
        firstPlaceVotes: index === 0 ? 3 : 0,
        isTie: false,
      })),
    });
  }

  it("finds the latest week, the years and weeks, a week's Top 25, and a school's history", async () => {
    expect(
      await getLatestFinalRankings({
        division: FIXTURE_POLL_SLUG,
        sport: sport(),
      }),
    ).toBeUndefined();
    await expect(
      getYearsThatHaveVotes({ division: FIXTURE_POLL_SLUG }),
    ).resolves.toEqual([]);

    await publishWeek(0);
    await publishWeek(1);

    await expect(
      getLatestFinalRankings({ division: FIXTURE_POLL_SLUG, sport: sport() }),
    ).resolves.toMatchObject({
      division: FIXTURE_POLL_SLUG,
      week: 2,
      year: FIXTURE_YEAR,
    });
    await expect(
      getYearsThatHaveVotes({ division: FIXTURE_POLL_SLUG }),
    ).resolves.toEqual([{ year: FIXTURE_YEAR, division: FIXTURE_POLL_SLUG }]);
    await expect(
      getWeeksThatHaveVotes({
        division: FIXTURE_POLL_SLUG,
        year: FIXTURE_YEAR,
      }),
    ).resolves.toEqual([{ week: 1 }, { week: 2 }]);
    await expect(
      getWeeksThatHaveVotes({
        division: FIXTURE_POLL_SLUG,
        year: FIXTURE_YEAR - 1,
      }),
    ).resolves.toEqual([]);

    const top = await getFinalRankingsForWeekAndYear({
      year: FIXTURE_YEAR,
      week: 1,
      division: FIXTURE_POLL_SLUG,
      sport: sport(),
    });
    expect(top.rankings.map((row) => [row.rank, row._points])).toEqual([
      [1, 75],
      [2, 50],
      [3, 25],
    ]);
    await expect(
      getFinalRankingsForWeekAndYear({
        year: FIXTURE_YEAR,
        week: 7,
        division: FIXTURE_POLL_SLUG,
        sport: sport(),
      }),
    ).rejects.toThrow("Rankings not found");

    const [school] = await db
      .select({ sanityId: schoolsTable.sanityId })
      .from(schoolsTable)
      .where(eq(schoolsTable.id, fixture.schoolIds[0]!));
    const history = await getSchoolRankingHistory(school!.sanityId!);
    expect(history.polls).toHaveLength(1);
    expect(JSON.stringify(history)).toContain(FIXTURE_POLL_SLUG);
  });

  it("ranks a postseason week above the regular season", async () => {
    await publishWeek(1);
    // Add a postseason week 1 to the same season and publish it.
    const [regular] = await db
      .select({ seasonId: seasonTypesTable.seasonId })
      .from(seasonTypesTable)
      .innerJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
      .where(eq(weeksTable.id, fixture.weekIds[0]!));
    const [post] = await db
      .insert(seasonTypesTable)
      .values({
        type: SEASON_TYPE_CODES.POSTSEASON,
        seasonId: regular!.seasonId,
        startDate: new Date(`${FIXTURE_YEAR}-12-02T00:00:00Z`),
        endDate: new Date(`${FIXTURE_YEAR + 1}-01-15T00:00:00Z`),
      })
      .returning();
    const [postWeek] = await db
      .insert(weeksTable)
      .values({
        number: 1,
        seasonTypeId: post!.id,
        startDate: new Date(`${FIXTURE_YEAR}-12-02T00:00:00Z`),
        endDate: new Date(`${FIXTURE_YEAR + 1}-01-15T00:00:00Z`),
      })
      .returning();
    await replacePollRankings({
      pollId: fixture.pollId,
      weekId: postWeek!.id,
      rankings: [
        {
          schoolId: fixture.schoolIds[0]!,
          rank: 1,
          points: 25,
          firstPlaceVotes: 1,
          isTie: false,
        },
      ],
    });

    await expect(
      getLatestFinalRankings({ division: FIXTURE_POLL_SLUG }),
    ).resolves.toMatchObject({ week: 999, year: FIXTURE_YEAR });
  });
});
