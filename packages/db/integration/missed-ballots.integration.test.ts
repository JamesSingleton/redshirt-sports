import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  autoPublishDueRankings,
  isAutoPublishTime,
  listAutoPublishSchedule,
  nextAutoPublishAt,
} from "../src/queries/auto-publish";
import {
  excuseBallotAhead,
  listPollAttendance,
  MISSED_BALLOT_LOCKOUT_LIMIT,
  reinstateLockedOutVoter,
  removeAdvanceExcuse,
  setMissedBallotExcused,
} from "../src/queries/missed-ballots";
import {
  assignVoterToPoll,
  isUserAssignedToPoll,
  revokeVoterFromPoll,
  setUserIsVoter,
} from "../src/queries/polls";
import {
  publishPollRankingsForWeek,
  unpublishPollRankingsForWeek,
} from "../src/queries/publish-rankings";
import type { SportParam } from "../src/queries/sports";
import { submitBallot } from "../src/queries/voting";
import {
  pollMissedBallotsTable,
  pollRankingsTable,
  pollsTable,
  pollVotersTable,
  SEASON_TYPE_CODES,
} from "../src/schema";
import {
  ballotEntries,
  createPollWeekFixture,
  createVoter,
  db,
  FIXTURE_POLL_SLUG,
  FIXTURE_YEAR,
  type PollWeekFixture,
  releaseLockHolders,
  resetDatabase,
} from "./fixtures";

let fixture: PollWeekFixture;

beforeEach(async () => {
  await resetDatabase();
  fixture = await createPollWeekFixture({ weekCount: 6 });
});

afterEach(releaseLockHolders);

const weekInput = (weekIndex: number) => ({
  sport: fixture.sportSlug as SportParam,
  division: FIXTURE_POLL_SLUG,
  year: FIXTURE_YEAR,
  seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
  weekNumber: weekIndex + 1,
});

const publish = (weekIndex: number) =>
  publishPollRankingsForWeek(weekInput(weekIndex));

function submit(userId: string, weekIndex: number) {
  return submitBallot({
    pollId: fixture.pollId,
    userId,
    weekId: fixture.weekIds[weekIndex]!,
    entries: ballotEntries(fixture),
  });
}

async function missesFor(userId: string) {
  return db
    .select()
    .from(pollMissedBallotsTable)
    .where(
      and(
        eq(pollMissedBallotsTable.pollId, fixture.pollId),
        eq(pollMissedBallotsTable.userId, userId),
      ),
    );
}

const assigned = (userId: string) =>
  isUserAssignedToPoll({ pollId: fixture.pollId, userId });

describe("missed ballots at publish", () => {
  it("records a miss for each assigned voter without a ballot", async () => {
    const [voted, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await submit(voted.id, 0);

    await expect(publish(0)).resolves.toMatchObject({
      ballots: 1,
      missed: 1,
      lockedOutUserIds: [],
    });
    expect(await missesFor(voted.id)).toHaveLength(0);
    expect(await missesFor(absent.id)).toHaveLength(1);
  });

  it(`locks a voter out on the ${MISSED_BALLOT_LOCKOUT_LIMIT}rd unexcused miss`, async () => {
    const [voter, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    for (let week = 0; week < MISSED_BALLOT_LOCKOUT_LIMIT - 1; week++) {
      await submit(voter.id, week);
      await expect(publish(week)).resolves.toMatchObject({
        lockedOutUserIds: [],
      });
    }
    expect(await assigned(absent.id)).toBe(true);

    await submit(voter.id, 2);
    await expect(publish(2)).resolves.toMatchObject({
      lockedOutUserIds: [absent.id],
    });
    expect(await assigned(absent.id)).toBe(false);
    expect(await assigned(voter.id)).toBe(true);

    const [attendance] = await listPollAttendance(
      new Date(`${FIXTURE_YEAR}-10-01T00:00:00Z`),
    );
    expect(attendance?.voters).toEqual([
      expect.objectContaining({
        userId: absent.id,
        unexcusedCount: 3,
        lockedOut: true,
      }),
    ]);
    expect(attendance?.voters[0]?.misses.map((miss) => miss.label)).toEqual([
      "Week 1",
      "Week 2",
      "Week 3",
    ]);
  });

  it("does not count excused misses", async () => {
    const [voter, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await submit(voter.id, 0);
    await publish(0);
    const [first] = await missesFor(absent.id);
    await setMissedBallotExcused({
      id: first!.id,
      excused: true,
      note: "Told me ahead of time",
    });

    for (const week of [1, 2]) {
      await submit(voter.id, week);
      await publish(week);
    }
    expect(await assigned(absent.id)).toBe(true);

    const excused = (await missesFor(absent.id)).find(
      (miss) => miss.id === first!.id,
    );
    expect(excused?.excuseNote).toBe("Told me ahead of time");

    await submit(voter.id, 3);
    await expect(publish(3)).resolves.toMatchObject({
      lockedOutUserIds: [absent.id],
    });
  });

  it("keeps a reinstated voter on until they miss again", async () => {
    const [voter, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    for (const week of [0, 1, 2]) {
      await submit(voter.id, week);
      await publish(week);
    }
    expect(await assigned(absent.id)).toBe(false);

    await reinstateLockedOutVoter({
      pollId: fixture.pollId,
      userId: absent.id,
    });
    expect(await assigned(absent.id)).toBe(true);

    await submit(voter.id, 3);
    await submit(absent.id, 3);
    await publish(3);
    expect(await assigned(absent.id)).toBe(true);

    await submit(voter.id, 4);
    await publish(4);
    expect(await assigned(absent.id)).toBe(false);
  });

  it("clears the lockout marker when a voter is re-assigned by hand", async () => {
    const [voter, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    for (const week of [0, 1, 2]) {
      await submit(voter.id, week);
      await publish(week);
    }
    await assignVoterToPoll({ pollId: fixture.pollId, userId: absent.id });
    const [row] = await db
      .select({ lockedOutAt: pollVotersTable.lockedOutAt })
      .from(pollVotersTable)
      .where(eq(pollVotersTable.userId, absent.id));
    expect(row?.lockedOutAt).toBeNull();
  });

  it("drops unexcused misses on unpublish and a late ballot's miss on re-publish", async () => {
    const [voter, late] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await submit(voter.id, 0);
    await publish(0);
    expect(await missesFor(late.id)).toHaveLength(1);

    await unpublishPollRankingsForWeek(weekInput(0));
    expect(await missesFor(late.id)).toHaveLength(0);

    await submit(late.id, 0);
    await expect(publish(0)).resolves.toMatchObject({ missed: 0 });
    expect(await missesFor(late.id)).toHaveLength(0);
  });

  it("lists current and locked-out voters, not ones removed from the poll or panel", async () => {
    const [voter, lockedOut, removed, uncredentialed] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture, { lastName: "Locked" }),
      createVoter(fixture, { lastName: "Removed" }),
      createVoter(fixture, { lastName: "Former" }),
    ]);
    for (const week of [0, 1, 2]) {
      await submit(voter.id, week);
      // Keep these two under the limit so only `lockedOut` is locked out.
      if (week === 2) {
        await submit(removed.id, week);
        await submit(uncredentialed.id, week);
      }
      await publish(week);
    }
    await revokeVoterFromPoll({ pollId: fixture.pollId, userId: removed.id });
    await setUserIsVoter({ userId: uncredentialed.id, isVoter: false });

    const [attendance] = await listPollAttendance(
      new Date(`${FIXTURE_YEAR}-10-01T00:00:00Z`),
    );
    expect(attendance?.voters.map((row) => row.lastName)).toEqual(["Locked"]);
    expect(await missesFor(removed.id)).toHaveLength(2);
  });

  it("refuses to reinstate a voter who was not locked out", async () => {
    const voter = await createVoter(fixture);
    await expect(
      reinstateLockedOutVoter({ pollId: fixture.pollId, userId: voter.id }),
    ).rejects.toThrow("not locked out");
  });
});

describe("excusing ahead of time", () => {
  const excuseAhead = (userId: string, weekIndex: number, note?: string) =>
    excuseBallotAhead({
      pollId: fixture.pollId,
      userId,
      weekId: fixture.weekIds[weekIndex]!,
      note,
    });

  it("keeps an advance excuse excused through publish and off the lockout count", async () => {
    const [voter, away] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await excuseAhead(away.id, 2, "Out of the country");
    for (const week of [0, 1, 2]) {
      await submit(voter.id, week);
      await publish(week);
    }
    // Three missed weeks, but week 3 was excused ahead: two count.
    expect(await assigned(away.id)).toBe(true);
    const misses = await missesFor(away.id);
    expect(misses).toHaveLength(3);
    expect(
      misses.find((miss) => miss.weekId === fixture.weekIds[2])?.excuseNote,
    ).toBe("Out of the country");

    await submit(voter.id, 3);
    await expect(publish(3)).resolves.toMatchObject({
      lockedOutUserIds: [away.id],
    });
  });

  it("drops the advance excuse if they vote anyway", async () => {
    const voter = await createVoter(fixture);
    await excuseAhead(voter.id, 0);
    await submit(voter.id, 0);
    await publish(0);
    expect(await missesFor(voter.id)).toHaveLength(0);
  });

  it("refuses a published week or one they already voted in", async () => {
    const [voter, other] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await submit(voter.id, 0);
    await expect(excuseAhead(voter.id, 0)).rejects.toThrow(
      "already have a ballot",
    );
    await publish(0);
    await expect(excuseAhead(other.id, 0)).rejects.toThrow("already published");
  });

  it("can be removed before the week publishes, but not after", async () => {
    const [voter, away] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    const first = await excuseAhead(away.id, 0);
    await removeAdvanceExcuse({ id: first.id });
    expect(await missesFor(away.id)).toHaveLength(0);

    const second = await excuseAhead(away.id, 1);
    await expect(
      setMissedBallotExcused({ id: second.id, excused: false }),
    ).rejects.toThrow("hasn't published yet");
    await submit(voter.id, 1);
    await publish(1);
    await expect(removeAdvanceExcuse({ id: second.id })).rejects.toThrow(
      "already published",
    );
  });

  it("lists upcoming weeks from the voting week and the poll's voters", async () => {
    const [voter, away] = await Promise.all([
      createVoter(fixture, { lastName: "Alpha" }),
      createVoter(fixture, { lastName: "Bravo" }),
    ]);
    await submit(voter.id, 1);
    await publish(1);
    await excuseAhead(away.id, 2);

    // 2026-09-07: Week 2 is the voting week (published), so Weeks 3-5 are next.
    const [attendance] = await listPollAttendance(
      new Date("2026-09-07T14:00:00Z"),
    );
    expect(attendance?.upcomingWeeks.map((week) => week.label)).toEqual([
      "Week 3",
      "Week 4",
      "Week 5",
    ]);
    expect(attendance?.assignedVoters.map((row) => row.lastName)).toEqual([
      "Alpha",
      "Bravo",
    ]);
    const bravo = attendance?.voters.find((row) => row.userId === away.id);
    expect(bravo?.unexcusedCount).toBe(1);
    expect(
      bravo?.misses.map((miss) => [miss.label, miss.excused, miss.upcoming]),
    ).toEqual([
      ["Week 2", false, false],
      ["Week 3", true, true],
    ]);
  });
});

describe("auto-publish", () => {
  // Week 2 ends 2026-09-07, so it is the voting week from 2026-09-05.
  const mondayNineCentral = new Date("2026-09-07T14:00:00Z");

  it("only runs from 9 AM Central on Mondays, on CDT and CST", () => {
    expect(isAutoPublishTime(new Date("2026-09-07T13:59:00Z"))).toBe(false);
    expect(isAutoPublishTime(mondayNineCentral)).toBe(true);
    // November is CST: 14:00 UTC is 8 AM, 15:00 UTC is 9 AM.
    expect(isAutoPublishTime(new Date("2026-11-09T14:00:00Z"))).toBe(false);
    expect(isAutoPublishTime(new Date("2026-11-09T15:00:00Z"))).toBe(true);
    expect(isAutoPublishTime(new Date("2026-09-08T15:00:00Z"))).toBe(false);
  });

  it("skips polls that have auto-publish off", async () => {
    const voter = await createVoter(fixture);
    await submit(voter.id, 1);
    await expect(autoPublishDueRankings(mondayNineCentral)).resolves.toEqual(
      [],
    );
  });

  it("publishes the voting week once, then skips it", async () => {
    await db
      .update(pollsTable)
      .set({ autoPublish: true })
      .where(eq(pollsTable.id, fixture.pollId));
    const [voter, absent] = await Promise.all([
      createVoter(fixture),
      createVoter(fixture),
    ]);
    await submit(voter.id, 1);

    await expect(autoPublishDueRankings(mondayNineCentral)).resolves.toEqual([
      expect.objectContaining({
        status: "published",
        week: 2,
        ballots: 1,
        missed: 1,
      }),
    ]);
    const rankings = await db
      .select({ id: pollRankingsTable.id })
      .from(pollRankingsTable)
      .where(eq(pollRankingsTable.weekId, fixture.weekIds[1]!));
    expect(rankings.length).toBeGreaterThan(0);
    expect(await missesFor(absent.id)).toHaveLength(1);

    await expect(autoPublishDueRankings(mondayNineCentral)).resolves.toEqual([
      expect.objectContaining({
        status: "skipped",
        reason: "Already published",
      }),
    ]);
  });

  it("skips a week with no ballots", async () => {
    await db
      .update(pollsTable)
      .set({ autoPublish: true })
      .where(eq(pollsTable.id, fixture.pollId));
    await createVoter(fixture);
    await expect(autoPublishDueRankings(mondayNineCentral)).resolves.toEqual([
      expect.objectContaining({ status: "skipped", reason: "No ballots" }),
    ]);
  });

  it("finds the next Monday 9 AM Central, on CDT and CST", () => {
    // Thursday in CDT → Monday 14:00 UTC.
    expect(nextAutoPublishAt(new Date("2026-09-03T18:00:00Z"))).toEqual(
      new Date("2026-09-07T14:00:00Z"),
    );
    // Monday after the run → the following Monday.
    expect(nextAutoPublishAt(new Date("2026-09-07T14:00:00Z"))).toEqual(
      new Date("2026-09-14T14:00:00Z"),
    );
    // Monday 8 AM CST → 15:00 UTC the same day.
    expect(nextAutoPublishAt(new Date("2026-11-09T14:00:00Z"))).toEqual(
      new Date("2026-11-09T15:00:00Z"),
    );
    // Across the November DST change: Thursday CDT → Monday CST.
    expect(nextAutoPublishAt(new Date("2026-10-29T12:00:00Z"))).toEqual(
      new Date("2026-11-02T15:00:00Z"),
    );
  });

  it("says what the next run will do for each poll", async () => {
    const thursday = new Date("2026-09-03T18:00:00Z");
    const voter = await createVoter(fixture);
    expect(
      (await listAutoPublishSchedule(thursday)).get(fixture.pollId),
    ).toEqual({
      runAt: mondayNineCentral,
      weekLabel: "Week 2",
      status: "off",
    });

    await db
      .update(pollsTable)
      .set({ autoPublish: true })
      .where(eq(pollsTable.id, fixture.pollId));
    expect(
      (await listAutoPublishSchedule(thursday)).get(fixture.pollId)?.status,
    ).toBe("scheduled");

    // Saturday: Week 2 is open for voting with no ballots yet.
    const saturday = new Date("2026-09-05T18:00:00Z");
    expect(
      (await listAutoPublishSchedule(saturday)).get(fixture.pollId)?.status,
    ).toBe("no-ballots");

    await submit(voter.id, 1);
    expect(
      (await listAutoPublishSchedule(saturday)).get(fixture.pollId)?.status,
    ).toBe("scheduled");

    await publish(1);
    expect(
      (await listAutoPublishSchedule(thursday)).get(fixture.pollId)?.status,
    ).toBe("published");
  });
});
