import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  ballotEntriesTable,
  ballotsTable,
  pollRankingsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  weeksTable,
} from "../schema";
import {
  type BallotVote,
  tallyTeamPoints,
  toRankingRows,
} from "../utils/publish-tally";
import {
  type CalendarWeekParams,
  resolveCalendarWeekParams,
} from "../utils/week-mapping";
import { getPollBySportAndSlug, listActivePollVoters } from "./polls";
import { deletePollRankings, replacePollRankings } from "./rankings";
import { getSportIdBySlug, type SportParam } from "./sports";
import { getBallotVotesForPollWeek } from "./voting";
import {
  calendarWeekKey,
  legacyWeekLabel,
  PUBLISHABLE_SEASON_TYPES,
  resolveWeekIdForCalendarWeek,
  seasonTypeAndNumberToLegacyWeek,
} from "./weeks";

export type { CalendarWeekParams };
export { resolveCalendarWeekParams };

type PollWeekInput = {
  sport: SportParam;
  division: string;
  year: number;
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  legacyWeek?: number | null;
};

async function resolvePollWeek({
  sport,
  division,
  year,
  weekKey,
  seasonType,
  weekNumber,
  legacyWeek,
}: PollWeekInput) {
  const { seasonType: resolvedSeasonType, weekNumber: resolvedWeekNumber } =
    resolveCalendarWeekParams({
      weekKey,
      seasonType,
      weekNumber,
      legacyWeek,
    });

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) throw new Error(`Invalid sport: ${sport}`);

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) throw new Error(`Poll not found: ${sport}/${division}`);

  const weekId = await resolveWeekIdForCalendarWeek({
    sportId,
    year,
    seasonType: resolvedSeasonType,
    weekNumber: resolvedWeekNumber,
  });
  if (!weekId) {
    throw new Error(
      `Week not found for year=${year} seasonType=${resolvedSeasonType} week=${resolvedWeekNumber}`,
    );
  }

  return { sportId, poll, weekId, resolvedSeasonType, resolvedWeekNumber };
}

export async function listSeasonYearsForSport(sportId: string) {
  const rows = await db
    .selectDistinct({ year: seasonsTable.year })
    .from(seasonsTable)
    .where(eq(seasonsTable.sportId, sportId))
    .orderBy(desc(seasonsTable.year));
  return rows.map((row) => row.year);
}

export async function listLegacyWeeksForSportYear({
  sportId,
  year,
}: {
  sportId: string;
  year: number;
}) {
  const rows = await db
    .select({
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      text: weeksTable.text,
    })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(
      and(
        eq(seasonsTable.sportId, sportId),
        eq(seasonsTable.year, year),
        inArray(seasonTypesTable.type, [...PUBLISHABLE_SEASON_TYPES]),
      ),
    )
    .orderBy(asc(seasonTypesTable.type), asc(weeksTable.number));

  return rows.map((row) => {
    const legacyWeek = seasonTypeAndNumberToLegacyWeek(
      row.seasonType,
      row.weekNumber,
    );
    return {
      weekKey: calendarWeekKey(row.seasonType, row.weekNumber),
      legacyWeek,
      label: legacyWeekLabel({
        legacyWeek,
        seasonType: row.seasonType,
        weekNumber: row.weekNumber,
        text: row.text,
      }),
      seasonType: row.seasonType,
      weekNumber: row.weekNumber,
    };
  });
}

export async function getBallotEntriesForPollWeek({
  pollId,
  weekId,
}: {
  pollId: string;
  weekId: string;
}) {
  const rows = await db
    .select({
      userId: ballotsTable.userId,
      rank: ballotEntriesTable.rank,
      points: ballotEntriesTable.points,
      schoolId: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
    })
    .from(ballotsTable)
    .innerJoin(
      ballotEntriesTable,
      eq(ballotEntriesTable.ballotId, ballotsTable.id),
    )
    .innerJoin(schoolsTable, eq(ballotEntriesTable.schoolId, schoolsTable.id))
    .where(
      and(eq(ballotsTable.pollId, pollId), eq(ballotsTable.weekId, weekId)),
    )
    .orderBy(asc(ballotEntriesTable.rank));

  const byUserId = new Map<
    string,
    Array<{
      rank: number;
      points: number;
      schoolId: string;
      name: string;
      shortName: string | null;
      abbreviation: string | null;
    }>
  >();

  for (const row of rows) {
    const entries = byUserId.get(row.userId) ?? [];
    entries.push({
      rank: row.rank,
      points: row.points,
      schoolId: row.schoolId,
      name: row.name ?? "Unknown",
      shortName: row.shortName,
      abbreviation: row.abbreviation,
    });
    byUserId.set(row.userId, entries);
  }

  return byUserId;
}

export async function getPollRankingPublishPreview({
  sport,
  division,
  year,
  weekKey,
  seasonType,
  weekNumber,
  week,
}: {
  sport: SportParam;
  division: string;
  year: number;
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  /** @deprecated Use weekKey or seasonType + weekNumber */
  week?: number | null;
}) {
  const { sportId, poll, weekId, resolvedSeasonType, resolvedWeekNumber } =
    await resolvePollWeek({
      sport,
      division,
      year,
      weekKey,
      seasonType,
      weekNumber,
      legacyWeek: week,
    });
  if (!poll.isActive) {
    throw new Error(`Poll is inactive: ${sport}/${division}`);
  }

  const legacyWeek = seasonTypeAndNumberToLegacyWeek(
    resolvedSeasonType,
    resolvedWeekNumber,
  );

  const [assigned, votes, existingRankingRow, submittedBallots, ballotEntries] =
    await Promise.all([
      listActivePollVoters(poll.id),
      getBallotVotesForPollWeek({
        pollId: poll.id,
        weekId,
        sportId,
        division,
        year,
        legacyWeek,
      }),
      db
        .select({ count: count() })
        .from(pollRankingsTable)
        .where(
          and(
            eq(pollRankingsTable.pollId, poll.id),
            eq(pollRankingsTable.weekId, weekId),
          ),
        )
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({
          userId: ballotsTable.userId,
          submittedAt: ballotsTable.submittedAt,
        })
        .from(ballotsTable)
        .where(
          and(
            eq(ballotsTable.pollId, poll.id),
            eq(ballotsTable.weekId, weekId),
          ),
        ),
      getBallotEntriesForPollWeek({ pollId: poll.id, weekId }),
    ]);

  const submittedByUserId = new Map(
    submittedBallots.map((ballot) => [ballot.userId, ballot.submittedAt]),
  );

  const panel = assigned.map((row) => {
    const submittedAt = submittedByUserId.get(row.userId) ?? null;
    return {
      userId: row.userId,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      organization: row.user.organization,
      submitted: submittedAt != null,
      submittedAt,
      ballotEntries:
        submittedAt != null ? (ballotEntries.get(row.userId) ?? []) : [],
    };
  });

  const missing = panel.filter((row) => !row.submitted);
  const rankingRows = toRankingRows(tallyTeamPoints(votes as BallotVote[]));
  const schoolIds = rankingRows.map((row) => row.schoolId);
  const schoolRows =
    schoolIds.length === 0
      ? []
      : await db
          .select({
            id: schoolsTable.id,
            name: schoolsTable.name,
            shortName: schoolsTable.shortName,
            abbreviation: schoolsTable.abbreviation,
          })
          .from(schoolsTable)
          .where(inArray(schoolsTable.id, schoolIds));

  const schoolById = new Map(schoolRows.map((school) => [school.id, school]));

  return {
    poll: {
      id: poll.id,
      name: poll.name,
      slug: poll.slug,
      sportId,
    },
    year,
    week: legacyWeek,
    weekId,
    ballotCount: submittedBallots.length,
    assignedCount: assigned.length,
    missingCount: missing.length,
    alreadyPublished: existingRankingRow > 0,
    existingRankingRows: existingRankingRow,
    panel,
    missing,
    rankings: rankingRows.map((row) => {
      const school = schoolById.get(row.schoolId);
      return {
        ...row,
        name: school?.name ?? "Unknown",
        shortName: school?.shortName ?? null,
        abbreviation: school?.abbreviation ?? null,
      };
    }),
  };
}

export async function publishPollRankingsForWeek({
  sport,
  division,
  year,
  weekKey,
  seasonType,
  weekNumber,
  week,
}: {
  sport: SportParam;
  division: string;
  year: number;
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  /** @deprecated Use weekKey or seasonType + weekNumber */
  week?: number | null;
}) {
  const { sportId, poll, weekId, resolvedSeasonType, resolvedWeekNumber } =
    await resolvePollWeek({
      sport,
      division,
      year,
      weekKey,
      seasonType,
      weekNumber,
      legacyWeek: week,
    });
  if (!poll.isActive) {
    throw new Error(`Poll is inactive: ${sport}/${division}`);
  }

  const legacyWeek = seasonTypeAndNumberToLegacyWeek(
    resolvedSeasonType,
    resolvedWeekNumber,
  );

  const votes = await getBallotVotesForPollWeek({
    pollId: poll.id,
    weekId,
    sportId,
    division,
    year,
    legacyWeek,
  });
  if (!votes.length) {
    throw new Error("No ballots found for this week");
  }

  const rankings = toRankingRows(tallyTeamPoints(votes as BallotVote[])).filter(
    (row) => row.schoolId,
  );

  await replacePollRankings({
    pollId: poll.id,
    weekId,
    rankings,
  });

  return {
    pollId: poll.id,
    weekId,
    teams: rankings.length,
    ballots: new Set(votes.map((vote) => vote.userId)).size,
  };
}

export async function unpublishPollRankingsForWeek({
  sport,
  division,
  year,
  weekKey,
  seasonType,
  weekNumber,
  week,
}: {
  sport: SportParam;
  division: string;
  year: number;
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  /** @deprecated Use weekKey or seasonType + weekNumber */
  week?: number | null;
}) {
  const { poll, weekId } = await resolvePollWeek({
    sport,
    division,
    year,
    weekKey,
    seasonType,
    weekNumber,
    legacyWeek: week,
  });

  const result = await deletePollRankings({
    pollId: poll.id,
    weekId,
  });

  return {
    pollId: poll.id,
    weekId,
    deleted: result.deleted,
  };
}
