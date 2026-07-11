import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "./client";
import {
  getDivisionSportAndWeekIds,
  upsertNormalizedWeeklyRankings,
} from "./queries/rankings";
import { getBallotsByWeekYearDivisionAndSport } from "./queries/voting";
import { schoolsTable, weeklyFinalRankings } from "./schema";

export type TeamPoint = {
  id: string;
  totalPoints: number;
  firstPlaceVotes: number;
  rank?: number;
  isTie?: boolean;
};

export type FinalizeRankingsInput = {
  sportId: string;
  division: string;
  year: number;
  week: number;
  /** When true, compute rankings without writing */
  dryRun?: boolean;
};

export type FinalizeRankingsResult = {
  teamPoints: TeamPoint[];
  rankings: {
    _id: string;
    _points: number;
    name: string | null;
    shortName: string | null;
    abbreviation: string | null;
    rank: number;
    firstPlaceVotes: number;
    isTie: boolean;
  }[];
  ballotCount: number;
  written: boolean;
};

type BallotLike = {
  teamId: string;
  points: number;
  rank: number;
};

function teamPointsReducer(acc: TeamPoint[], vote: BallotLike): TeamPoint[] {
  const team = acc.find((t) => t.id === vote.teamId);
  if (team) {
    team.totalPoints += vote.points;
    if (vote.rank === 1) {
      team.firstPlaceVotes++;
    }
  } else {
    acc.push({
      id: vote.teamId,
      totalPoints: vote.points,
      firstPlaceVotes: vote.rank === 1 ? 1 : 0,
    });
  }
  return acc;
}

export function processTeamPoints(votes: BallotLike[]): TeamPoint[] {
  const teamPoints: TeamPoint[] = votes.reduce(teamPointsReducer, []);
  teamPoints.sort((a, b) => {
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
          if (prevTeam) {
            prevTeam.isTie = true;
          }
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

/**
 * Aggregate ballots and optionally persist normalized + slim legacy rankings.
 * School images are NOT stored — enrich from Sanity at read time.
 */
export async function finalizeWeeklyRankings({
  sportId,
  division,
  year,
  week,
  dryRun = false,
}: FinalizeRankingsInput): Promise<FinalizeRankingsResult> {
  const votes = await getBallotsByWeekYearDivisionAndSport({
    year,
    week,
    division,
    sportId,
  });

  if (!votes.length) {
    return {
      teamPoints: [],
      rankings: [],
      ballotCount: 0,
      written: false,
    };
  }

  const teamPoints = processTeamPoints(votes);
  const sanityIds = teamPoints.map((t) => t.id);

  const schools = await db
    .select({
      id: schoolsTable.id,
      sanityId: schoolsTable.sanityId,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
    })
    .from(schoolsTable)
    .where(inArray(schoolsTable.sanityId, sanityIds));

  const schoolBySanityId = new Map(
    schools
      .filter((s) => s.sanityId)
      .map((s) => [s.sanityId as string, s] as const),
  );

  const rankings = teamPoints.flatMap((tp) => {
    const school = schoolBySanityId.get(tp.id);
    if (!school) return [];
    return [
      {
        _id: tp.id,
        _points: tp.totalPoints,
        name: school.name,
        shortName: school.shortName,
        abbreviation: school.abbreviation,
        rank: tp.rank ?? 0,
        firstPlaceVotes: tp.firstPlaceVotes,
        isTie: tp.isTie ?? false,
      },
    ];
  });

  if (dryRun) {
    return {
      teamPoints,
      rankings,
      ballotCount: new Set(votes.map((v) => v.userId)).size,
      written: false,
    };
  }

  const ids = await getDivisionSportAndWeekIds({
    sportId,
    divisionSlug: division,
    year,
    week,
  });

  if (ids) {
    const normalizedRows = teamPoints.flatMap((tp) => {
      const school = schoolBySanityId.get(tp.id);
      if (!school) return [];
      return [
        {
          schoolId: school.id,
          ranking: tp.rank ?? null,
          points: tp.totalPoints,
          firstPlaceVotes: tp.firstPlaceVotes,
          isTie: tp.isTie ?? false,
        },
      ];
    });

    await upsertNormalizedWeeklyRankings({
      divisionSportId: ids.divisionSportId,
      weekId: ids.weekId,
      rankings: normalizedRows,
    });
  }

  // Slim legacy row for year/week listing — no Sanity image blobs
  await db
    .insert(weeklyFinalRankings)
    .values({
      division,
      year,
      week,
      rankings,
      sportId,
    })
    .onConflictDoUpdate({
      target: [
        weeklyFinalRankings.division,
        weeklyFinalRankings.year,
        weeklyFinalRankings.week,
        weeklyFinalRankings.sportId,
      ],
      set: { rankings, sportId },
    });

  return {
    teamPoints,
    rankings,
    ballotCount: new Set(votes.map((v) => v.userId)).size,
    written: true,
  };
}

export async function getSchoolsBySanityIds(sanityIds: string[]) {
  if (sanityIds.length === 0) return [];
  return db
    .select()
    .from(schoolsTable)
    .where(
      and(
        inArray(schoolsTable.sanityId, sanityIds),
        eq(schoolsTable.top25Eligible, true),
      ),
    );
}
