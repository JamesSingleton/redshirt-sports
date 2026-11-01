import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { replacePollRankings } from "../src/queries/rankings";
import {
  PollWeekLockedError,
  reassignBallotWeek,
  submitBallot,
  updateBallot,
} from "../src/queries/voting";
import { ballotsTable } from "../src/schema";
import {
  ballotEntries,
  countBallots,
  createPollWeekFixture,
  createVoter,
  db,
  heldAdvisoryLocks,
  holdPollWeekLock,
  type PollWeekFixture,
  releaseLockHolders,
  resetDatabase,
  settledWithin,
  waitForAdvisoryLockWaiter,
} from "./fixtures";

function submit(fixture: PollWeekFixture, userId: string, weekIndex = 0) {
  return submitBallot({
    pollId: fixture.pollId,
    userId,
    weekId: fixture.weekIds[weekIndex]!,
    entries: ballotEntries(fixture),
  });
}

/** The check the vote route's isUniqueViolation makes: the error or its cause. */
function routeSeesUniqueViolation(error: unknown) {
  const err = error as { code?: unknown; cause?: { code?: unknown } };
  return err.code === "23505" || err.cause?.code === "23505";
}

let fixture: PollWeekFixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture({ weekCount: 2 });
});

afterEach(releaseLockHolders);

describe("poll/week advisory lock", () => {
  it("makes a ballot submit wait until the lock holder commits", async () => {
    const voter = await createVoter(fixture);
    const holder = holdPollWeekLock(fixture.pollId, fixture.weekIds[0]!);
    await holder.ready;

    const pending = submit(fixture, voter.id);
    await waitForAdvisoryLockWaiter();
    expect(await settledWithin(pending, 300)).toBe("pending");
    expect(await countBallots()).toBe(0);

    holder.release();
    await holder.done;
    await expect(pending).resolves.toMatchObject({ userId: voter.id });
    expect(await heldAdvisoryLocks()).toBe(0);
  });

  it("only blocks the same poll week", async () => {
    const voter = await createVoter(fixture);
    const holder = holdPollWeekLock(fixture.pollId, fixture.weekIds[0]!);
    await holder.ready;

    // A different week of the same poll goes straight through.
    await expect(
      settledWithin(submit(fixture, voter.id, 1), 2_000),
    ).resolves.toBe("settled");

    // So does the same week of another sport's poll.
    const other = await createPollWeekFixture();
    const otherVoter = await createVoter(other);
    await expect(
      settledWithin(submit(other, otherVoter.id), 2_000),
    ).resolves.toBe("settled");

    holder.release();
    await holder.done;
  });

  it("is released when a write fails, so the next voter isn't stuck", async () => {
    const first = await createVoter(fixture);
    const second = await createVoter(fixture);
    await submit(fixture, first.id);

    // A duplicate ballot fails on the unique constraint inside the locked transaction.
    const duplicate = await submit(fixture, first.id).catch((error) => error);
    expect(duplicate).toBeInstanceOf(Error);
    expect(routeSeesUniqueViolation(duplicate)).toBe(true);
    expect(await heldAdvisoryLocks()).toBe(0);

    await expect(
      settledWithin(submit(fixture, second.id), 2_000),
    ).resolves.toBe("settled");
    expect(await countBallots()).toBe(2);
  });

  it("is released when voting is closed by a published week", async () => {
    const voter = await createVoter(fixture);
    await replacePollRankings({
      pollId: fixture.pollId,
      weekId: fixture.weekIds[0]!,
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

    await expect(submit(fixture, voter.id)).rejects.toBeInstanceOf(
      PollWeekLockedError,
    );
    expect(await heldAdvisoryLocks()).toBe(0);
    // The next week is still open.
    await expect(submit(fixture, voter.id, 1)).resolves.toBeDefined();
  });
});

describe("concurrent ballot writes", () => {
  it("accepts every voter's ballot when many submit at once", async () => {
    const voters = await Promise.all(
      Array.from({ length: 12 }, () => createVoter(fixture)),
    );

    const results = await Promise.allSettled(
      voters.map((voter) => submit(fixture, voter.id)),
    );

    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
    expect(await countBallots()).toBe(12);
    expect(await heldAdvisoryLocks()).toBe(0);
  });

  it("keeps one ballot when the same voter double-submits", async () => {
    const voter = await createVoter(fixture);

    const results = await Promise.allSettled([
      submit(fixture, voter.id),
      submit(fixture, voter.id),
    ]);

    const rejected = results.filter((result) => result.status === "rejected");
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    // The vote route turns this into a 409, not a 500.
    expect(routeSeesUniqueViolation(rejected[0]!.reason)).toBe(true);
    expect(await countBallots()).toBe(1);
  });

  it("lets a voter edit while others submit", async () => {
    const editor = await createVoter(fixture);
    await submit(fixture, editor.id);
    const others = await Promise.all(
      Array.from({ length: 5 }, () => createVoter(fixture)),
    );

    const results = await Promise.allSettled([
      updateBallot({
        pollId: fixture.pollId,
        userId: editor.id,
        weekId: fixture.weekIds[0]!,
        entries: ballotEntries(fixture, 3),
      }),
      ...others.map((voter) => submit(fixture, voter.id)),
    ]);

    expect(results.filter((result) => result.status === "rejected")).toEqual(
      [],
    );
    expect(await countBallots()).toBe(6);
  });

  it("doesn't deadlock when two reassignments cross weeks", async () => {
    const [weekA, weekB] = fixture.weekIds as [string, string];
    for (let round = 0; round < 10; round++) {
      await db.delete(ballotsTable);
      const one = await createVoter(fixture);
      const two = await createVoter(fixture);
      await submit(fixture, one.id, 0);
      await submit(fixture, two.id, 1);

      const results = await Promise.allSettled([
        reassignBallotWeek({
          pollId: fixture.pollId,
          userId: one.id,
          fromWeekId: weekA,
          toWeekId: weekB,
        }),
        reassignBallotWeek({
          pollId: fixture.pollId,
          userId: two.id,
          fromWeekId: weekB,
          toWeekId: weekA,
        }),
      ]);

      expect(results.filter((result) => result.status === "rejected")).toEqual(
        [],
      );
    }
    expect(await heldAdvisoryLocks()).toBe(0);
  });
});
