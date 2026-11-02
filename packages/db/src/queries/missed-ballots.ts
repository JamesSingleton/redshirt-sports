import { and, asc, eq, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  ballotsTable,
  pollMissedBallotsTable,
  pollRankingsTable,
  pollsTable,
  pollVotersTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  usersTable,
  weeksTable,
} from "../schema";
import {
  legacyWeekLabel,
  PUBLISHABLE_SEASON_TYPES,
  seasonTypeAndNumberToLegacyWeek,
} from "../utils/week-mapping";
import { getVotingSeasonInfoBySportIds } from "./seasons";
import { lockPollWeek } from "./voting";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

/** Unexcused misses in one season that take a voter off a poll. */
export const MISSED_BALLOT_LOCKOUT_LIMIT = 3;

/** How many unpublished weeks ahead a voter can be excused for. */
export const EXCUSE_AHEAD_WEEKS = 3;

function weekLabel(row: {
  seasonType: number;
  weekNumber: number;
  weekText: string | null;
}) {
  return legacyWeekLabel({
    legacyWeek: seasonTypeAndNumberToLegacyWeek(row.seasonType, row.weekNumber),
    seasonType: row.seasonType,
    weekNumber: row.weekNumber,
    text: row.weekText,
  });
}

async function isPollWeekPublished(
  executor: DbExecutor,
  pollId: string,
  weekId: string,
) {
  const [row] = await executor
    .select({ id: pollRankingsTable.id })
    .from(pollRankingsTable)
    .where(
      and(
        eq(pollRankingsTable.pollId, pollId),
        eq(pollRankingsTable.weekId, weekId),
      ),
    )
    .limit(1);
  return row != null;
}

/**
 * Run at publish, inside its poll/week lock. Every assigned voter without a
 * ballot gets a miss for this week; a voter whose ballot is now in (a
 * re-publish after unpublish) loses theirs. A voter who missed this week and
 * now has MISSED_BALLOT_LOCKOUT_LIMIT unexcused misses this season is removed
 * from the poll. Only this week's absentees are checked, so a voter you
 * reinstated stays on until they miss again.
 */
export async function recordMissedBallotsForPollWeek(
  { pollId, weekId }: { pollId: string; weekId: string },
  executor: DbExecutor = db,
) {
  const assigned = await executor
    .select({ userId: pollVotersTable.userId })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(
        eq(pollVotersTable.pollId, pollId),
        isNull(pollVotersTable.revokedAt),
        eq(usersTable.isVoter, true),
      ),
    );
  const submitted = await executor
    .select({ userId: ballotsTable.userId })
    .from(ballotsTable)
    .where(
      and(eq(ballotsTable.pollId, pollId), eq(ballotsTable.weekId, weekId)),
    );

  const submittedIds = submitted.map((row) => row.userId);
  const submittedSet = new Set(submittedIds);
  const missedIds = assigned
    .map((row) => row.userId)
    .filter((userId) => !submittedSet.has(userId));

  if (submittedIds.length > 0) {
    await executor
      .delete(pollMissedBallotsTable)
      .where(
        and(
          eq(pollMissedBallotsTable.pollId, pollId),
          eq(pollMissedBallotsTable.weekId, weekId),
          inArray(pollMissedBallotsTable.userId, submittedIds),
        ),
      );
  }

  if (missedIds.length === 0) {
    return { missedUserIds: [], lockedOutUserIds: [] };
  }

  await executor
    .insert(pollMissedBallotsTable)
    .values(missedIds.map((userId) => ({ pollId, userId, weekId })))
    .onConflictDoNothing();

  const [season] = await executor
    .select({ seasonId: seasonTypesTable.seasonId })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .where(eq(weeksTable.id, weekId))
    .limit(1);
  if (!season) {
    return { missedUserIds: missedIds, lockedOutUserIds: [] };
  }

  const counts = await executor
    .select({
      userId: pollMissedBallotsTable.userId,
      misses: sql<number>`count(*)::int`,
    })
    .from(pollMissedBallotsTable)
    .innerJoin(weeksTable, eq(pollMissedBallotsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .where(
      and(
        eq(pollMissedBallotsTable.pollId, pollId),
        inArray(pollMissedBallotsTable.userId, missedIds),
        isNull(pollMissedBallotsTable.excusedAt),
        eq(seasonTypesTable.seasonId, season.seasonId),
      ),
    )
    .groupBy(pollMissedBallotsTable.userId);

  const lockOut = counts
    .filter((row) => row.misses >= MISSED_BALLOT_LOCKOUT_LIMIT)
    .map((row) => row.userId);
  if (lockOut.length > 0) {
    const now = new Date();
    await executor
      .update(pollVotersTable)
      .set({ revokedAt: now, lockedOutAt: now, updatedAt: now })
      .where(
        and(
          eq(pollVotersTable.pollId, pollId),
          inArray(pollVotersTable.userId, lockOut),
          isNull(pollVotersTable.revokedAt),
        ),
      );
  }

  return { missedUserIds: missedIds, lockedOutUserIds: lockOut };
}

/** Unpublish reopens ballots, so unexcused misses for that week no longer stand. */
export async function clearUnexcusedMissesForPollWeek({
  pollId,
  weekId,
}: {
  pollId: string;
  weekId: string;
}) {
  await db
    .delete(pollMissedBallotsTable)
    .where(
      and(
        eq(pollMissedBallotsTable.pollId, pollId),
        eq(pollMissedBallotsTable.weekId, weekId),
        isNull(pollMissedBallotsTable.excusedAt),
      ),
    );
}

/** Excusing a miss doesn't reinstate a locked-out voter; that is its own step. */
export async function setMissedBallotExcused({
  id,
  excused,
  note,
}: {
  id: string;
  excused: boolean;
  note?: string | null;
}) {
  if (!excused) {
    const [row] = await db
      .select({
        pollId: pollMissedBallotsTable.pollId,
        weekId: pollMissedBallotsTable.weekId,
      })
      .from(pollMissedBallotsTable)
      .where(eq(pollMissedBallotsTable.id, id))
      .limit(1);
    if (row && !(await isPollWeekPublished(db, row.pollId, row.weekId))) {
      throw new Error(
        "That week hasn't published yet; remove the advance excuse instead",
      );
    }
  }
  const now = new Date();
  const [updated] = await db
    .update(pollMissedBallotsTable)
    .set({
      excusedAt: excused ? now : null,
      excuseNote: excused ? note?.trim() || null : null,
      updatedAt: now,
    })
    .where(eq(pollMissedBallotsTable.id, id))
    .returning({ id: pollMissedBallotsTable.id });
  if (!updated) throw new Error("Missed ballot not found");
  return updated;
}

/**
 * Excuse a voter for a week before it publishes (they told you ahead of time).
 * Stored as an excused miss, so publish keeps it excused; if they vote anyway,
 * publish clears it. Takes the poll/week lock so it can't race a publish.
 */
export async function excuseBallotAhead({
  pollId,
  userId,
  weekId,
  note,
}: {
  pollId: string;
  userId: string;
  weekId: string;
  note?: string | null;
}) {
  return db.transaction(async (tx) => {
    await lockPollWeek(tx, pollId, weekId);
    if (await isPollWeekPublished(tx, pollId, weekId)) {
      throw new Error(
        "That week is already published; excuse it from their missed weeks",
      );
    }
    const [ballot] = await tx
      .select({ id: ballotsTable.id })
      .from(ballotsTable)
      .where(
        and(
          eq(ballotsTable.pollId, pollId),
          eq(ballotsTable.userId, userId),
          eq(ballotsTable.weekId, weekId),
        ),
      )
      .limit(1);
    if (ballot) throw new Error("They already have a ballot in for that week");

    const now = new Date();
    const excuse = {
      excusedAt: now,
      excuseNote: note?.trim() || null,
      updatedAt: now,
    };
    const [row] = await tx
      .insert(pollMissedBallotsTable)
      .values({ pollId, userId, weekId, ...excuse })
      .onConflictDoUpdate({
        target: [
          pollMissedBallotsTable.pollId,
          pollMissedBallotsTable.userId,
          pollMissedBallotsTable.weekId,
        ],
        set: excuse,
      })
      .returning({ id: pollMissedBallotsTable.id });
    return row!;
  });
}

/** Take back an advance excuse. Once the week publishes it's a miss; use setMissedBallotExcused. */
export async function removeAdvanceExcuse({ id }: { id: string }) {
  const [row] = await db
    .select({
      pollId: pollMissedBallotsTable.pollId,
      weekId: pollMissedBallotsTable.weekId,
    })
    .from(pollMissedBallotsTable)
    .where(eq(pollMissedBallotsTable.id, id))
    .limit(1);
  if (!row) throw new Error("Excuse not found");
  await db.transaction(async (tx) => {
    await lockPollWeek(tx, row.pollId, row.weekId);
    if (await isPollWeekPublished(tx, row.pollId, row.weekId)) {
      throw new Error("That week already published; count the miss instead");
    }
    await tx
      .delete(pollMissedBallotsTable)
      .where(eq(pollMissedBallotsTable.id, id));
  });
}

/** Put a locked-out voter back on the poll. Their misses stay on record. */
export async function reinstateLockedOutVoter({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  const now = new Date();
  const [updated] = await db
    .update(pollVotersTable)
    .set({ revokedAt: null, lockedOutAt: null, updatedAt: now })
    .where(
      and(
        eq(pollVotersTable.pollId, pollId),
        eq(pollVotersTable.userId, userId),
        isNotNull(pollVotersTable.lockedOutAt),
      ),
    )
    .returning({ id: pollVotersTable.id });
  if (!updated) throw new Error("Voter is not locked out of this poll");
  return updated;
}

export type MissedBallotWeek = {
  id: string;
  weekId: string;
  label: string;
  excused: boolean;
  excuseNote: string | null;
  /** The week hasn't published yet: an advance excuse. */
  upcoming: boolean;
};

export type AttendanceWeek = { id: string; label: string };

export type AssignedVoter = {
  userId: string;
  firstName: string;
  lastName: string;
};

export type VoterAttendanceRow = {
  userId: string;
  firstName: string;
  lastName: string;
  organization: string | null;
  unexcusedCount: number;
  lockedOut: boolean;
  lockedOutAt: Date | null;
  misses: MissedBallotWeek[];
};

export type PollAttendance = {
  pollId: string;
  pollName: string;
  sportSlug: string;
  year: number;
  limit: number;
  voters: VoterAttendanceRow[];
  /** The next unpublished weeks, from the current voting week, to excuse ahead. */
  upcomingWeeks: AttendanceWeek[];
  assignedVoters: AssignedVoter[];
};

/**
 * Every current voter with a miss this season, per active poll: most
 * unexcused misses first. Locked-out voters stay listed so they can be
 * reinstated; voters removed from the poll or the panel don't.
 */
export async function listPollAttendance(
  date = new Date(),
): Promise<PollAttendance[]> {
  const polls = await db
    .select({
      id: pollsTable.id,
      name: pollsTable.name,
      sportId: pollsTable.sportId,
      sportSlug: sportsTable.slug,
    })
    .from(pollsTable)
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .where(eq(pollsTable.isActive, true))
    .orderBy(asc(pollsTable.name));
  if (polls.length === 0) return [];

  const pollIds = polls.map((poll) => poll.id);
  const sportIds = [...new Set(polls.map((poll) => poll.sportId))];
  const seasonBySportId = await getVotingSeasonInfoBySportIds(sportIds, date);

  const [seasonWeeks, published, assigned] = await Promise.all([
    db
      .select({
        id: weeksTable.id,
        sportId: seasonsTable.sportId,
        year: seasonsTable.year,
        seasonType: seasonTypesTable.type,
        weekNumber: weeksTable.number,
        weekText: weeksTable.text,
      })
      .from(weeksTable)
      .innerJoin(
        seasonTypesTable,
        eq(weeksTable.seasonTypeId, seasonTypesTable.id),
      )
      .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
      .where(
        and(
          inArray(seasonsTable.sportId, sportIds),
          inArray(seasonTypesTable.type, [...PUBLISHABLE_SEASON_TYPES]),
        ),
      )
      .orderBy(asc(seasonTypesTable.type), asc(weeksTable.number)),
    db
      .selectDistinct({
        pollId: pollRankingsTable.pollId,
        weekId: pollRankingsTable.weekId,
      })
      .from(pollRankingsTable)
      .where(inArray(pollRankingsTable.pollId, pollIds)),
    db
      .select({
        pollId: pollVotersTable.pollId,
        userId: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(pollVotersTable)
      .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
      .where(
        and(
          inArray(pollVotersTable.pollId, pollIds),
          isNull(pollVotersTable.revokedAt),
          eq(usersTable.isVoter, true),
        ),
      )
      .orderBy(asc(usersTable.lastName), asc(usersTable.firstName)),
  ]);
  const publishedKeys = new Set(
    published.map((row) => `${row.pollId}:${row.weekId}`),
  );

  const rows = await db
    .select({
      id: pollMissedBallotsTable.id,
      pollId: pollMissedBallotsTable.pollId,
      userId: pollMissedBallotsTable.userId,
      weekId: pollMissedBallotsTable.weekId,
      excusedAt: pollMissedBallotsTable.excusedAt,
      excuseNote: pollMissedBallotsTable.excuseNote,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
      weekText: weeksTable.text,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      organization: usersTable.organization,
      lockedOutAt: pollVotersTable.lockedOutAt,
    })
    .from(pollMissedBallotsTable)
    .innerJoin(weeksTable, eq(pollMissedBallotsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .innerJoin(usersTable, eq(pollMissedBallotsTable.userId, usersTable.id))
    .innerJoin(
      pollVotersTable,
      and(
        eq(pollVotersTable.pollId, pollMissedBallotsTable.pollId),
        eq(pollVotersTable.userId, pollMissedBallotsTable.userId),
      ),
    )
    .where(
      and(
        inArray(
          pollMissedBallotsTable.pollId,
          polls.map((poll) => poll.id),
        ),
        // Current voters only: still credentialed, and still on the poll or
        // locked out by misses (listed so they can be reinstated). Anyone
        // removed by hand drops off; their misses stay on record.
        eq(usersTable.isVoter, true),
        or(
          isNull(pollVotersTable.revokedAt),
          isNotNull(pollVotersTable.lockedOutAt),
        ),
      ),
    )
    .orderBy(asc(seasonTypesTable.type), asc(weeksTable.number));

  return polls.flatMap((poll) => {
    const year = seasonBySportId.get(poll.sportId)?.year;
    if (year == null) return [];

    const byUser = new Map<string, VoterAttendanceRow>();
    for (const row of rows) {
      if (row.pollId !== poll.id || row.year !== year) continue;
      let voter = byUser.get(row.userId);
      if (!voter) {
        voter = {
          userId: row.userId,
          firstName: row.firstName,
          lastName: row.lastName,
          organization: row.organization,
          unexcusedCount: 0,
          lockedOut: row.lockedOutAt != null,
          lockedOutAt: row.lockedOutAt,
          misses: [],
        };
        byUser.set(row.userId, voter);
      }
      const excused = row.excusedAt != null;
      if (!excused) voter.unexcusedCount += 1;
      voter.misses.push({
        id: row.id,
        weekId: row.weekId,
        label: weekLabel(row),
        excused,
        excuseNote: row.excuseNote,
        upcoming: !publishedKeys.has(`${poll.id}:${row.weekId}`),
      });
    }

    const season = seasonBySportId.get(poll.sportId);
    const weeks = seasonWeeks.filter(
      (week) => week.sportId === poll.sportId && week.year === year,
    );
    const start = Math.max(
      0,
      weeks.findIndex((week) => week.id === season?.weekId),
    );
    const upcomingWeeks = weeks
      .slice(start)
      .filter((week) => !publishedKeys.has(`${poll.id}:${week.id}`))
      .slice(0, EXCUSE_AHEAD_WEEKS)
      .map((week) => ({ id: week.id, label: weekLabel(week) }));

    const voters = [...byUser.values()].sort(
      (a, b) =>
        Number(b.lockedOut) - Number(a.lockedOut) ||
        b.unexcusedCount - a.unexcusedCount ||
        a.lastName.localeCompare(b.lastName),
    );
    return [
      {
        pollId: poll.id,
        pollName: poll.name,
        sportSlug: poll.sportSlug,
        year,
        limit: MISSED_BALLOT_LOCKOUT_LIMIT,
        voters,
        upcomingWeeks,
        assignedVoters: assigned
          .filter((row) => row.pollId === poll.id)
          .map(({ userId, firstName, lastName }) => ({
            userId,
            firstName,
            lastName,
          })),
      },
    ];
  });
}
