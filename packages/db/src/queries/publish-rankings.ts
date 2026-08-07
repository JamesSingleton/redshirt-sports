import { and, asc, count, desc, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  pollRankingsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  weeksTable,
} from "../schema";
import { listActivePollVoters } from "./polls";
import { replacePollRankings } from "./rankings";
import { getSportIdBySlug, type SportParam } from "./sports";
import { getBallotVotesForPollWeek } from "./voting";
import {
  calendarWeekKey,
  legacyWeekLabel,
  legacyWeekToSeasonTypeAndNumber,
  PUBLISHABLE_SEASON_TYPES,
  parseCalendarWeekKey,
  resolveWeekIdForCalendarWeek,
  seasonTypeAndNumberToLegacyWeek,
} from "./weeks";

export type CalendarWeekParams = {
  seasonType: number;
  weekNumber: number;
};

export function resolveCalendarWeekParams({
  weekKey,
  seasonType,
  weekNumber,
  legacyWeek,
}: {
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  legacyWeek?: number | null;
}): CalendarWeekParams {
  if (weekKey) {
    const parsed = parseCalendarWeekKey(weekKey);
    if (!parsed) {
      throw new Error(`Invalid week key: ${weekKey}`);
    }
    return parsed;
  }

  if (seasonType != null && weekNumber != null) {
    return { seasonType, weekNumber };
  }

  if (legacyWeek != null) {
    return legacyWeekToSeasonTypeAndNumber(legacyWeek);
  }

  throw new Error(
    "Week is required (weekKey, seasonType + weekNumber, or legacy week)",
  );
}

type BallotVote = {
  schoolId?: string;
  rank: number;
  points: number;
  userId: string;
};

type TeamPoint = {
  schoolId: string;
  totalPoints: number;
  firstPlaceVotes: number;
  rank?: number;
  isTie?: boolean;
};

function tallyTeamPoints(votes: BallotVote[]): TeamPoint[] {
  const bySchool = new Map<string, TeamPoint>();

  for (const vote of votes) {
    const schoolId = vote.schoolId;
    if (!schoolId) continue;

    const existing = bySchool.get(schoolId);
    if (existing) {
      existing.totalPoints += vote.points;
      if (vote.rank === 1) existing.firstPlaceVotes += 1;
    } else {
      bySchool.set(schoolId, {
        schoolId,
        totalPoints: vote.points,
        firstPlaceVotes: vote.rank === 1 ? 1 : 0,
      });
    }
  }

  const teamPoints = [...bySchool.values()].sort((a, b) => {
    if (a.totalPoints === b.totalPoints) {
      return b.firstPlaceVotes - a.firstPlaceVotes;
    }
    return b.totalPoints - a.totalPoints;
  });

  let currentRank = 1;
  let previousPoints = teamPoints[0]?.totalPoints;
  let wasPreviousTeamTied = false;

  teamPoints.forEach((team, index) => {
    if (index > 0) {
      if (team.totalPoints === previousPoints) {
        team.isTie = true;
        if (!wasPreviousTeamTied) {
          const prevTeam = teamPoints[index - 1];
          if (prevTeam) prevTeam.isTie = true;
        }
        wasPreviousTeamTied = true;
      } else {
        currentRank = index + 1;
        wasPreviousTeamTied = false;
      }
    } else {
      team.isTie = false;
    }
    team.rank = currentRank;
    previousPoints = team.totalPoints;
  });

  return teamPoints;
}

function toRankingRows(teamPoints: TeamPoint[]) {
  return teamPoints.map((team) => ({
    schoolId: team.schoolId,
    // Match existing cron behavior: keep ordinal for ORV rows too.
    rank: team.rank && team.rank <= 25 ? team.rank : (team.rank ?? null),
    points: team.totalPoints,
    firstPlaceVotes: team.firstPlaceVotes,
    isTie: team.isTie ?? false,
  }));
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
  const { seasonType: resolvedSeasonType, weekNumber: resolvedWeekNumber } =
    resolveCalendarWeekParams({
      weekKey,
      seasonType,
      weekNumber,
      legacyWeek: week,
    });

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) throw new Error(`Invalid sport: ${sport}`);

  const poll = await db.query.pollsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.sportId, sportId), eq(model.slug, division)),
  });
  if (!poll) throw new Error(`Poll not found: ${sport}/${division}`);
  if (!poll.isActive) {
    throw new Error(`Poll is inactive: ${sport}/${division}`);
  }

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

  const legacyWeek = seasonTypeAndNumberToLegacyWeek(
    resolvedSeasonType,
    resolvedWeekNumber,
  );

  const [assigned, votes, existingRankingRow, submittedBallots] =
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
      db.query.ballotsTable.findMany({
        where: (model, { eq, and }) =>
          and(eq(model.pollId, poll.id), eq(model.weekId, weekId)),
        columns: { userId: true, submittedAt: true },
      }),
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
  const { seasonType: resolvedSeasonType, weekNumber: resolvedWeekNumber } =
    resolveCalendarWeekParams({
      weekKey,
      seasonType,
      weekNumber,
      legacyWeek: week,
    });

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) throw new Error(`Invalid sport: ${sport}`);

  const poll = await db.query.pollsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.sportId, sportId), eq(model.slug, division)),
  });
  if (!poll) throw new Error(`Poll not found: ${sport}/${division}`);
  if (!poll.isActive) {
    throw new Error(`Poll is inactive: ${sport}/${division}`);
  }

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
