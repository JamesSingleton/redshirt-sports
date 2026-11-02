import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getPollBySportSlugAndPollSlug,
  resolvePollWeekBySlugs,
} from "../src/queries/polls";
import {
  clearSportIdCache,
  getSportIdBySlug,
  type SportParam,
} from "../src/queries/sports";
import {
  getVotesForWeekAndYearByVoter,
  submitBallot,
} from "../src/queries/voting";
import { sportsTable } from "../src/schema";
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
    expect(byVoter[voter.id]?.votes[0]).toMatchObject({ rank: 1, week: 1 });

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
