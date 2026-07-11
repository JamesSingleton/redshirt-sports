import { and, asc, desc, eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  SEASON_TYPE_CODES,
  schoolsTable,
  sportsTable,
  weeklyFinalRankings,
  weeklyRankings,
} from "../schema";
import type { FinalRankingWithSchool } from "../types/rankings";
import { getWeekBySport } from "./seasons";
import { getSportIdBySlug, type SportParam } from "./sports";

const PRESEASON_WEEK = 0;
const FINAL_RANKINGS_WEEK = 999;

type FinalRankings = {
  id: number;
  division: string;
  week: number;
  year: number;
  rankings: {
    _id: string;
    _points: number;
    name: string;
    shortName: string;
    abbreviation: string;
    image: any;
    rank: number;
    firstPlaceVotes: number;
    isTie: boolean;
  }[];
};

export type NormalizedRankingInput = {
  schoolId: string;
  ranking: number | null;
  points: number | null;
  firstPlaceVotes?: number | null;
  isTie?: boolean | null;
};

export type FinalRankingsDisplayPayload = {
  division: string;
  week: number;
  year: number;
  rankings: {
    _id: string;
    _points: number;
    name: string | null;
    shortName: string | null;
    abbreviation: string | null;
    rank: number | null;
    firstPlaceVotes: number | null;
    isTie: boolean | null;
  }[];
};

/**
 * Resolves the weeks table id for a poll week number.
 * Week 0 → preseason (type 1), week number 1 or 0.
 * Week 999 → postseason/final (type 3), week number 1.
 * Otherwise → regular season (type 2), matching week number.
 */
export async function resolveWeekIdForRankings({
  sportId,
  year,
  week,
}: {
  sportId: string;
  year: number;
  week: number;
}): Promise<string | null> {
  if (week === PRESEASON_WEEK) {
    for (const weekNumber of [1, 0]) {
      const season = await getWeekBySport(
        sportId,
        year,
        weekNumber,
        SEASON_TYPE_CODES.PRESEASON,
      );
      const weekId = season?.seasonTypes[0]?.weeks[0]?.id;
      if (weekId) return weekId;
    }
    return null;
  }

  if (week === FINAL_RANKINGS_WEEK) {
    const season = await getWeekBySport(
      sportId,
      year,
      1,
      SEASON_TYPE_CODES.POSTSEASON,
    );
    return season?.seasonTypes[0]?.weeks[0]?.id ?? null;
  }

  const season = await getWeekBySport(
    sportId,
    year,
    week,
    SEASON_TYPE_CODES.REGULAR_SEASON,
  );
  return season?.seasonTypes[0]?.weeks[0]?.id ?? null;
}

async function getDivisionSportId({
  sportId,
  divisionSlug,
}: {
  sportId: string;
  divisionSlug: string;
}) {
  const division = await db.query.divisionsTable.findFirst({
    where: (model, { eq }) => eq(model.slug, divisionSlug),
    columns: { id: true },
  });

  if (!division) return null;

  const divisionSport = await db.query.divisionSportsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.sportId, sportId), eq(model.divisionId, division.id)),
    columns: { id: true },
  });

  return divisionSport?.id ?? null;
}

export async function getDivisionSportAndWeekIds({
  sportId,
  divisionSlug,
  year,
  week,
}: {
  sportId: string;
  divisionSlug: string;
  year: number;
  week: number;
}) {
  const [divisionSportId, weekId] = await Promise.all([
    getDivisionSportId({ sportId, divisionSlug }),
    resolveWeekIdForRankings({ sportId, year, week }),
  ]);

  if (!divisionSportId || !weekId) return null;

  return { divisionSportId, weekId };
}

export async function getAllLegacyWeeklyRankings() {
  return db.query.weeklyFinalRankings.findMany();
}

export async function getAllWeeklyRankings() {
  return db.query.weeklyRankings.findMany();
}

export async function getFinalRankingsForWeekAndYearFromDb({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}): Promise<FinalRankingWithSchool[]> {
  const sportId = await getSportIdBySlug(sport);
  if (!sportId) throw new Error(`Unable to find sport by slug. Slug: ${sport}`);

  const weekId = await resolveWeekIdForRankings({ sportId, year, week });
  if (!weekId) {
    throw new Error("Unable to find season or week for rankings");
  }

  const divisionSportId = await getDivisionSportId({
    sportId,
    divisionSlug: division,
  });
  if (!divisionSportId) {
    throw new Error(
      `Unable to find division sport for division "${division}" and sport "${sport}"`,
    );
  }

  const rankings = await db.query.weeklyRankings.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.weekId, weekId), eq(model.divisionSportId, divisionSportId)),
    with: {
      school: true,
    },
    orderBy: (model, { asc }) => asc(model.ranking),
  });

  return rankings;
}

export async function getFinalRankingsForWeekAndYear({
  year,
  week,
  division,
}: {
  year: number;
  week: number;
  division: string;
}): Promise<FinalRankings> {
  const rankings = await db.query.weeklyFinalRankings.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.year, year),
        eq(model.week, week),
        eq(model.division, division),
      ),
  });

  if (!rankings) {
    throw new Error("Rankings not found");
  }

  return rankings as FinalRankings;
}

export async function upsertNormalizedWeeklyRankings({
  divisionSportId,
  weekId,
  rankings,
}: {
  divisionSportId: string;
  weekId: string;
  rankings: NormalizedRankingInput[];
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(weeklyRankings)
      .where(
        and(
          eq(weeklyRankings.divisionSportId, divisionSportId),
          eq(weeklyRankings.weekId, weekId),
        ),
      );

    if (rankings.length === 0) {
      return;
    }

    await tx.insert(weeklyRankings).values(
      rankings.map((ranking) => ({
        schoolId: ranking.schoolId,
        divisionSportId,
        weekId,
        ranking: ranking.ranking,
        points: ranking.points,
        firstPlaceVotes: ranking.firstPlaceVotes ?? null,
        isTie: ranking.isTie ?? null,
      })),
    );
  });
}

export async function getFinalRankingsDisplayPayload({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}): Promise<FinalRankingsDisplayPayload | null> {
  const sportId = await getSportIdBySlug(sport);
  if (!sportId) return null;

  const weekId = await resolveWeekIdForRankings({ sportId, year, week });
  if (!weekId) return null;

  const divisionSportId = await getDivisionSportId({
    sportId,
    divisionSlug: division,
  });
  if (!divisionSportId) return null;

  const rows = await db
    .select({
      points: weeklyRankings.points,
      ranking: weeklyRankings.ranking,
      firstPlaceVotes: weeklyRankings.firstPlaceVotes,
      isTie: weeklyRankings.isTie,
      sanityId: schoolsTable.sanityId,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
    })
    .from(weeklyRankings)
    .innerJoin(schoolsTable, eq(weeklyRankings.schoolId, schoolsTable.id))
    .where(
      and(
        eq(weeklyRankings.weekId, weekId),
        eq(weeklyRankings.divisionSportId, divisionSportId),
      ),
    )
    .orderBy(asc(weeklyRankings.ranking));

  if (rows.length === 0) {
    return null;
  }

  return {
    division,
    week,
    year,
    rankings: rows.map((row) => ({
      _id: row.sanityId ?? "",
      _points: row.points ?? 0,
      name: row.name,
      shortName: row.shortName,
      abbreviation: row.abbreviation,
      rank: row.ranking,
      firstPlaceVotes: row.firstPlaceVotes,
      isTie: row.isTie,
    })),
  };
}

// get the last weeklyFinalRankings for a given division & return the division, week, and year
export async function getLatestFinalRankings({
  division,
}: {
  division: string;
}) {
  const latestWeeklyRankings = await db.query.weeklyFinalRankings.findFirst({
    where: (model, { eq }) => eq(model.division, division),
    columns: {
      division: true,
      week: true,
      year: true,
    },
    orderBy: (model) => [desc(model.year), desc(model.week)],
  });

  return latestWeeklyRankings;
}

export async function getLatestFinalRankingsBySportSlug(sportSlug: string) {
  // Use DISTINCT ON to get the latest ranking for each division in a single query
  const results = await db
    .selectDistinctOn([weeklyFinalRankings.division], {
      division: weeklyFinalRankings.division,
      week: weeklyFinalRankings.week,
      year: weeklyFinalRankings.year,
    })
    .from(weeklyFinalRankings)
    .innerJoin(sportsTable, eq(weeklyFinalRankings.sportId, sportsTable.id))
    .where(eq(sportsTable.slug, sportSlug))
    .orderBy(
      weeklyFinalRankings.division,
      desc(weeklyFinalRankings.year),
      desc(weeklyFinalRankings.week),
    );

  return results;
}
