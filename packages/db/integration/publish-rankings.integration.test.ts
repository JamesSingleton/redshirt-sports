import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { publishPollRankingsForWeek } from "../src/queries/publish-rankings";
import { replacePollRankings } from "../src/queries/rankings";
import type { SportParam } from "../src/queries/sports";
import {
  PollWeekLockedError,
  submitBallot,
  updateBallot,
} from "../src/queries/voting";
import { pollRankingsTable, SEASON_TYPE_CODES } from "../src/schema";
import {
  ballotEntries,
  createPollWeekFixture,
  createVoter,
  db,
  FIXTURE_POLL_SLUG,
  FIXTURE_YEAR,
  heldAdvisoryLocks,
  holdPollWeekLock,
  type PollWeekFixture,
  releaseLockHolders,
  resetDatabase,
  settledWithin,
  waitForAdvisoryLockWaiter,
} from "./fixtures";

let fixture: PollWeekFixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture({ weekCount: 15 });
});

afterEach(releaseLockHolders);

function publish(weekIndex = 0) {
  return publishPollRankingsForWeek({
    // Fixture sports use a random slug so files can't collide.
    sport: fixture.sportSlug as SportParam,
    division: FIXTURE_POLL_SLUG,
    year: FIXTURE_YEAR,
    seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
    weekNumber: weekIndex + 1,
  });
}

function submit(userId: string, weekIndex = 0) {
  return submitBallot({
    pollId: fixture.pollId,
    userId,
    weekId: fixture.weekIds[weekIndex]!,
    entries: ballotEntries(fixture),
  });
}

async function publishedRankings(weekIndex = 0) {
  return db
    .select({
      schoolId: pollRankingsTable.schoolId,
      points: pollRankingsTable.points,
    })
    .from(pollRankingsTable)
    .where(
      and(
        eq(pollRankingsTable.pollId, fixture.pollId),
        eq(pollRankingsTable.weekId, fixture.weekIds[weekIndex]!),
      ),
    );
}

describe("publishPollRankingsForWeek", () => {
  it("tallies every ballot and then closes the week", async () => {
    const voters = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    for (const voter of voters) await submit(voter.id);

    await expect(publish()).resolves.toMatchObject({ ballots: 2, teams: 25 });

    const late = await createVoter(fixture);
    await expect(submit(late.id)).rejects.toBeInstanceOf(PollWeekLockedError);
    await expect(
      updateBallot({
        pollId: fixture.pollId,
        userId: voters[0]!.id,
        weekId: fixture.weekIds[0]!,
        entries: ballotEntries(fixture, 1),
      }),
    ).rejects.toBeInstanceOf(PollWeekLockedError);
    expect(await heldAdvisoryLocks()).toBe(0);
  });

  it("waits for an in-flight ballot write before tallying", async () => {
    const voter = await createVoter(fixture);
    await submit(voter.id);

    const holder = holdPollWeekLock(fixture.pollId, fixture.weekIds[0]!);
    await holder.ready;

    const pending = publish();
    await waitForAdvisoryLockWaiter();
    expect(await settledWithin(pending, 300)).toBe("pending");
    expect(await publishedRankings()).toHaveLength(0);

    holder.release();
    await holder.done;
    await expect(pending).resolves.toMatchObject({ ballots: 1 });
  });

  it("never publishes without a ballot that was accepted", async () => {
    // Race a late ballot against publish on many weeks. Either the ballot
    // lands first and is counted, or publish wins and the ballot is refused.
    // A ballot that is saved but missing from the published tally is the bug.
    const outcomes = { counted: 0, refused: 0 };
    for (let weekIndex = 0; weekIndex < fixture.weekIds.length; weekIndex++) {
      const early = await createVoter(fixture);
      const late = await createVoter(fixture);
      await submit(early.id, weekIndex);

      const [published, lateBallot] = await Promise.allSettled([
        publish(weekIndex),
        submit(late.id, weekIndex),
      ]);

      expect(published.status).toBe("fulfilled");
      const ballots = (published as PromiseFulfilledResult<{ ballots: number }>)
        .value.ballots;
      if (lateBallot.status === "fulfilled") {
        expect(ballots).toBe(2);
        outcomes.counted++;
      } else {
        expect(lateBallot.reason).toBeInstanceOf(PollWeekLockedError);
        expect(ballots).toBe(1);
        outcomes.refused++;
      }
    }
    expect(outcomes.counted + outcomes.refused).toBe(fixture.weekIds.length);
    expect(await heldAdvisoryLocks()).toBe(0);
  });

  it("releases the lock when there is nothing to publish", async () => {
    await expect(publish()).rejects.toThrow("No ballots found for this week");
    expect(await heldAdvisoryLocks()).toBe(0);

    const voter = await createVoter(fixture);
    await expect(submit(voter.id)).resolves.toBeDefined();
  });
});

describe("replacePollRankings", () => {
  const firstPlace = (schoolId: string, points: number) => ({
    schoolId,
    rank: 1,
    points,
    firstPlaceVotes: 1,
    isTie: false,
  });

  it("keeps the previous rankings when the new write fails", async () => {
    await replacePollRankings({
      pollId: fixture.pollId,
      weekId: fixture.weekIds[0]!,
      rankings: [firstPlace(fixture.schoolIds[0]!, 25)],
    });

    // An unknown school fails the foreign key after the delete has run.
    await expect(
      replacePollRankings({
        pollId: fixture.pollId,
        weekId: fixture.weekIds[0]!,
        rankings: [firstPlace("missing-school", 30)],
      }),
    ).rejects.toThrow();

    expect(await publishedRankings()).toEqual([
      { schoolId: fixture.schoolIds[0]!, points: 25 },
    ]);
  });

  it("rolls back with the caller's transaction", async () => {
    await replacePollRankings({
      pollId: fixture.pollId,
      weekId: fixture.weekIds[0]!,
      rankings: [firstPlace(fixture.schoolIds[0]!, 25)],
    });

    await expect(
      db.transaction(async (tx) => {
        await replacePollRankings(
          {
            pollId: fixture.pollId,
            weekId: fixture.weekIds[0]!,
            rankings: [firstPlace(fixture.schoolIds[1]!, 30)],
          },
          tx,
        );
        throw new Error("publish failed after writing rankings");
      }),
    ).rejects.toThrow("publish failed after writing rankings");

    expect(await publishedRankings()).toEqual([
      { schoolId: fixture.schoolIds[0]!, points: 25 },
    ]);
  });
});
