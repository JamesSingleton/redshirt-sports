import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  ballotsTable,
  pollsTable,
  pollVotersTable,
  SEASON_TYPE_CODES,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  usersTable,
  weeksTable,
} from "../schema";
import {
  periodFlags,
  resolveVotingWeekFromLocalSeason,
  resolveWeekIdFromSeasonTypes,
  type VotingSeasonInfo,
} from "./seasons";

export type AdminDashboardPanelRow = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sportId: string;
  sportSlug: string;
  assignedCount: number;
  submittedCount: number | null;
  year: number | null;
  votingWeek: number | null;
  weekId: string | null;
  isPreseason: boolean;
  isRegularSeason: boolean;
  isPostseason: boolean;
};

export type AdminDashboardSnapshot = {
  credentialedVoters: number;
  totalUsers: number;
  staleAssignments: number;
  panels: AdminDashboardPanelRow[];
};

const PUBLISHABLE_TYPES = [
  SEASON_TYPE_CODES.PRESEASON,
  SEASON_TYPE_CODES.REGULAR_SEASON,
  SEASON_TYPE_CODES.POSTSEASON,
] as const;

async function countCredentialedVoters() {
  const [row] = await db
    .select({ value: count() })
    .from(usersTable)
    .where(eq(usersTable.isVoter, true));
  return row?.value ?? 0;
}

async function countAllUsers() {
  const [row] = await db.select({ value: count() }).from(usersTable);
  return row?.value ?? 0;
}

async function countStaleAssignments() {
  const [row] = await db
    .select({ value: count() })
    .from(pollVotersTable)
    .innerJoin(usersTable, eq(pollVotersTable.userId, usersTable.id))
    .where(
      and(isNull(pollVotersTable.revokedAt), eq(usersTable.isVoter, false)),
    );
  return row?.value ?? 0;
}

async function listActivePolls() {
  return db
    .select({
      id: pollsTable.id,
      name: pollsTable.name,
      slug: pollsTable.slug,
      isActive: pollsTable.isActive,
      sportId: pollsTable.sportId,
      sportSlug: sportsTable.slug,
    })
    .from(pollsTable)
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .where(eq(pollsTable.isActive, true))
    .orderBy(asc(pollsTable.name));
}

async function countAssignedVotersByPollIds(pollIds: string[]) {
  const counts = new Map<string, number>();
  for (const pollId of pollIds) {
    counts.set(pollId, 0);
  }
  if (pollIds.length === 0) return counts;

  const rows = await db
    .select({
      pollId: pollVotersTable.pollId,
      value: count(),
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
    .groupBy(pollVotersTable.pollId);

  for (const row of rows) {
    counts.set(row.pollId, row.value);
  }
  return counts;
}

/**
 * Lean season/week load for dashboard: joined select for publishable
 * season types + weeks, then resolve voting week in JS (same rules as
 * getVotingSeasonInfoBySportIds).
 */
async function getVotingSeasonInfoForDashboard(
  sportIds: string[],
  date: Date,
): Promise<Map<string, VotingSeasonInfo>> {
  const bySportId = new Map<string, VotingSeasonInfo>();
  if (sportIds.length === 0) return bySportId;

  const seasonHeaders = await db
    .select({
      id: seasonsTable.id,
      sportId: seasonsTable.sportId,
      year: seasonsTable.year,
      startDate: seasonsTable.startDate,
      endDate: seasonsTable.endDate,
    })
    .from(seasonsTable)
    .where(inArray(seasonsTable.sportId, sportIds))
    .orderBy(desc(seasonsTable.year));

  const headersBySport = new Map<string, typeof seasonHeaders>();
  for (const season of seasonHeaders) {
    const list = headersBySport.get(season.sportId) ?? [];
    list.push(season);
    headersBySport.set(season.sportId, list);
  }

  const currentHeaderBySport = new Map<
    string,
    (typeof seasonHeaders)[number]
  >();
  const currentSeasonIds: string[] = [];

  for (const sportId of sportIds) {
    const sportSeasons = headersBySport.get(sportId) ?? [];
    const current =
      sportSeasons.find(
        (season) => date >= season.startDate && date <= season.endDate,
      ) ?? sportSeasons[0];
    if (!current) continue;
    currentSeasonIds.push(current.id);
    currentHeaderBySport.set(sportId, current);
  }

  if (currentSeasonIds.length === 0) return bySportId;

  const typeAndWeekRows = await db
    .select({
      seasonId: seasonTypesTable.seasonId,
      type: seasonTypesTable.type,
      typeStart: seasonTypesTable.startDate,
      typeEnd: seasonTypesTable.endDate,
      weekId: weeksTable.id,
      weekNumber: weeksTable.number,
      weekEnd: weeksTable.endDate,
    })
    .from(seasonTypesTable)
    .leftJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
    .where(
      and(
        inArray(seasonTypesTable.seasonId, currentSeasonIds),
        inArray(seasonTypesTable.type, [...PUBLISHABLE_TYPES]),
      ),
    );

  type SeasonTypeBag = {
    type: number;
    startDate: Date;
    endDate: Date;
    weeks: Array<{ id: string; number: number; endDate: Date }>;
  };

  const typesBySeasonId = new Map<string, Map<number, SeasonTypeBag>>();
  for (const row of typeAndWeekRows) {
    let byType = typesBySeasonId.get(row.seasonId);
    if (!byType) {
      byType = new Map();
      typesBySeasonId.set(row.seasonId, byType);
    }

    let seasonType = byType.get(row.type);
    if (!seasonType) {
      seasonType = {
        type: row.type,
        startDate: row.typeStart,
        endDate: row.typeEnd,
        weeks: [],
      };
      byType.set(row.type, seasonType);
    }

    if (row.weekId != null && row.weekNumber != null && row.weekEnd != null) {
      seasonType.weeks.push({
        id: row.weekId,
        number: row.weekNumber,
        endDate: row.weekEnd,
      });
    }
  }

  for (const sportId of sportIds) {
    const header = currentHeaderBySport.get(sportId);
    if (!header) continue;

    const byType =
      typesBySeasonId.get(header.id) ?? new Map<number, SeasonTypeBag>();
    const preseason = byType.get(SEASON_TYPE_CODES.PRESEASON);
    const regularSeason = byType.get(SEASON_TYPE_CODES.REGULAR_SEASON);
    const seasonTypes = [...byType.values()].map((entry) => ({
      type: entry.type,
      weeks: entry.weeks.map((week) => ({ id: week.id, number: week.number })),
    }));

    const { isPreseason, isRegularSeason, isPostseason } = periodFlags({
      date,
      preseasonStart: preseason?.startDate ?? null,
      preseasonEnd: preseason?.endDate ?? null,
      regularStart: regularSeason?.startDate ?? null,
      regularEnd: regularSeason?.endDate ?? null,
    });

    const votingWeek = resolveVotingWeekFromLocalSeason({
      regularSeasonEndDate: regularSeason?.endDate ?? null,
      regularWeeks: (regularSeason?.weeks ?? []).map((week) => ({
        number: week.number,
        endDate: week.endDate,
      })),
      date,
    });

    bySportId.set(sportId, {
      sportId,
      year: header.year,
      votingWeek,
      weekId: resolveWeekIdFromSeasonTypes({ seasonTypes, votingWeek }),
      isPreseason,
      isRegularSeason,
      isPostseason,
    });
  }

  return bySportId;
}

async function countBallotsByPollWeekPairs(
  pairs: Array<{ pollId: string; weekId: string }>,
) {
  const counts = new Map<string, number>();
  if (pairs.length === 0) return counts;

  for (const pair of pairs) {
    counts.set(`${pair.pollId}:${pair.weekId}`, 0);
  }

  const pollIds = [...new Set(pairs.map((pair) => pair.pollId))];
  const weekIds = [...new Set(pairs.map((pair) => pair.weekId))];
  const wanted = new Set(counts.keys());

  const rows = await db
    .select({
      pollId: ballotsTable.pollId,
      weekId: ballotsTable.weekId,
      value: count(),
    })
    .from(ballotsTable)
    .where(
      and(
        inArray(ballotsTable.pollId, pollIds),
        inArray(ballotsTable.weekId, weekIds),
      ),
    )
    .groupBy(ballotsTable.pollId, ballotsTable.weekId);

  for (const row of rows) {
    const key = `${row.pollId}:${row.weekId}`;
    if (wanted.has(key)) {
      counts.set(key, row.value);
    }
  }

  return counts;
}

/**
 * Dashboard snapshot via Drizzle select/join APIs.
 *
 * Wave 1: active polls
 * Wave 2 (parallel): snapshot counts + assigned voters + lean season/weeks
 * Wave 3: ballot counts for resolved poll/week pairs
 *
 * Uses the SQL-like query builder ([Drizzle select API](https://orm.drizzle.team/docs/select))
 * instead of a raw `db.execute` string, and reuses voting-week helpers from seasons.ts.
 */
export async function getAdminDashboardSnapshot(
  date = new Date(),
): Promise<AdminDashboardSnapshot> {
  const pollsPromise = listActivePolls();
  const snapshotPromise = Promise.all([
    countCredentialedVoters(),
    countAllUsers(),
    countStaleAssignments(),
  ]);

  const polls = await pollsPromise;
  const pollIds = polls.map((poll) => poll.id);
  const sportIds = [...new Set(polls.map((poll) => poll.sportId))];

  const [snapshot, assignedByPoll, seasonBySportId] = await Promise.all([
    snapshotPromise,
    countAssignedVotersByPollIds(pollIds),
    getVotingSeasonInfoForDashboard(sportIds, date),
  ]);
  const [credentialedVoters, totalUsers, staleAssignments] = snapshot;

  const ballotPairs = polls.flatMap((poll) => {
    const season = seasonBySportId.get(poll.sportId);
    if (!season?.weekId) return [];
    return [{ pollId: poll.id, weekId: season.weekId }];
  });
  const ballotCounts = await countBallotsByPollWeekPairs(ballotPairs);

  const panels: AdminDashboardPanelRow[] = polls.map((poll) => {
    const season = seasonBySportId.get(poll.sportId) ?? null;
    const assignedCount = assignedByPoll.get(poll.id) ?? 0;
    let submittedCount: number | null = null;
    if (season?.weekId) {
      submittedCount = ballotCounts.get(`${poll.id}:${season.weekId}`) ?? 0;
    }

    return {
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      isActive: poll.isActive,
      sportId: poll.sportId,
      sportSlug: poll.sportSlug,
      assignedCount,
      submittedCount,
      year: season?.year ?? null,
      votingWeek: season?.votingWeek ?? null,
      weekId: season?.weekId ?? null,
      isPreseason: season?.isPreseason ?? false,
      isRegularSeason: season?.isRegularSeason ?? false,
      isPostseason: season?.isPostseason ?? false,
    };
  });

  return {
    credentialedVoters,
    totalUsers,
    staleAssignments,
    panels,
  };
}
