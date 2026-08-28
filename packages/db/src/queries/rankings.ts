import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  pollRankingsTable,
  pollsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../schema";
import type { FinalRankingWithSchool } from "../types/rankings";
import {
  buildSchoolRankingHistory,
  type SchoolRankingHistory,
} from "../utils/school-ranking-history";
import { getPollBySportAndSlug } from "./polls";
import { getSportIdBySlug, type SportParam } from "./sports";
import {
  resolveWeekIdForLegacyWeek,
  seasonTypeAndNumberToLegacyWeek,
} from "./weeks";

type FinalRankings = {
  id: string;
  division: string;
  week: number;
  year: number;
  rankings: {
    _id: string;
    _points: number;
    name: string;
    shortName: string;
    abbreviation: string;
    slug: string | null;
    image: unknown;
    rank: number | null;
    firstPlaceVotes: number;
    isTie: boolean;
  }[];
};

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

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) throw new Error(`Poll not found: ${sport}/${division}`);

  const weekId = await resolveWeekIdForLegacyWeek({
    sportId,
    year,
    legacyWeek: week,
  });
  if (!weekId) throw new Error("Unable to find season or week for rankings");

  const rankings = await db.query.pollRankingsTable.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.pollId, poll.id), eq(model.weekId, weekId)),
    with: {
      school: true,
    },
    orderBy: (model, { asc }) => [asc(model.rank), asc(model.points)],
  });

  return rankings.map((row) => ({
    ...row,
    ranking: row.rank,
    schoolId: row.schoolId,
    weekId: row.weekId,
    divisionSportId: poll.divisionSportId,
    firstPlaceVotes: row.firstPlaceVotes,
    isTie: row.isTie,
    points: row.points,
  })) as unknown as FinalRankingWithSchool[];
}

export async function getFinalRankingsForWeekAndYear({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport?: SportParam;
}): Promise<FinalRankings> {
  let sportId: string | null = null;
  if (sport) {
    sportId = await getSportIdBySlug(sport);
  } else {
    // Infer sport from poll slug when only one active poll matches
    const poll = await db.query.pollsTable.findFirst({
      where: (model, { eq }) => eq(model.slug, division),
    });
    sportId = poll?.sportId ?? null;
  }

  if (!sportId) {
    throw new Error(`Unable to resolve sport for division ${division}`);
  }

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) throw new Error("Rankings not found");

  const weekId = await resolveWeekIdForLegacyWeek({
    sportId,
    year,
    legacyWeek: week,
  });
  if (!weekId) throw new Error("Rankings not found");

  const rows = await db
    .select({
      id: pollRankingsTable.id,
      rank: pollRankingsTable.rank,
      points: pollRankingsTable.points,
      firstPlaceVotes: pollRankingsTable.firstPlaceVotes,
      isTie: pollRankingsTable.isTie,
      sanityId: schoolsTable.sanityId,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
      slug: schoolsTable.slug,
      image: schoolsTable.image,
    })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(
      and(
        eq(pollRankingsTable.pollId, poll.id),
        eq(pollRankingsTable.weekId, weekId),
      ),
    )
    .orderBy(
      sql`${pollRankingsTable.rank} ASC NULLS LAST`,
      desc(pollRankingsTable.points),
    );

  if (!rows.length) {
    throw new Error("Rankings not found");
  }

  return {
    id: `${poll.id}:${weekId}`,
    division,
    week,
    year,
    rankings: rows.map((row) => ({
      _id: row.sanityId ?? "",
      _points: row.points,
      name: row.name ?? "",
      shortName: row.shortName ?? "",
      abbreviation: row.abbreviation ?? "",
      slug: row.slug ?? null,
      image: row.image,
      rank: row.rank,
      firstPlaceVotes: row.firstPlaceVotes,
      isTie: row.isTie,
    })),
  };
}

export async function getLatestFinalRankings({
  division,
}: {
  division: string;
}) {
  const row = await db
    .select({
      division: pollsTable.slug,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(pollsTable.slug, division))
    // Season type before week number: postseason week 1 (final rankings)
    // must beat regular-season week 13.
    .orderBy(
      desc(seasonsTable.year),
      desc(seasonTypesTable.type),
      desc(weeksTable.number),
    )
    .limit(1);

  const match = row[0];
  if (!match) return undefined;

  return {
    division: match.division,
    week: seasonTypeAndNumberToLegacyWeek(match.seasonType, match.weekNumber),
    year: match.year,
  };
}

export async function getLatestFinalRankingsBySportSlug(sportSlug: string) {
  const results = await db
    .selectDistinctOn([pollsTable.slug], {
      division: pollsTable.slug,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(sportsTable.slug, sportSlug))
    // Season type before week number: postseason week 1 (final rankings)
    // must beat regular-season week 13.
    .orderBy(
      pollsTable.slug,
      desc(seasonsTable.year),
      desc(seasonTypesTable.type),
      desc(weeksTable.number),
    );

  return results.map((row) => ({
    division: row.division,
    week: seasonTypeAndNumberToLegacyWeek(row.seasonType, row.weekNumber),
    year: row.year,
  }));
}

export async function replacePollRankings({
  pollId,
  weekId,
  rankings,
}: {
  pollId: string;
  weekId: string;
  rankings: Array<{
    schoolId: string;
    rank: number | null;
    points: number;
    firstPlaceVotes: number;
    isTie: boolean;
  }>;
}) {
  await db.transaction(async (tx) => {
    await tx
      .delete(pollRankingsTable)
      .where(
        and(
          eq(pollRankingsTable.pollId, pollId),
          eq(pollRankingsTable.weekId, weekId),
        ),
      );

    if (rankings.length === 0) return;

    await tx.insert(pollRankingsTable).values(
      rankings.map((row) => ({
        pollId,
        weekId,
        schoolId: row.schoolId,
        rank: row.rank,
        points: row.points,
        firstPlaceVotes: row.firstPlaceVotes,
        isTie: row.isTie,
      })),
    );
  });
}

export async function schoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  const school = await db.query.schoolsTable.findFirst({
    where: (model, { eq }) => eq(model.sanityId, sanityId),
    columns: { id: true },
  });
  if (!school) return false;

  const row = await db
    .select({ id: pollRankingsTable.id })
    .from(pollRankingsTable)
    .where(eq(pollRankingsTable.schoolId, school.id))
    .limit(1);

  return row.length > 0;
}

/** Distinct Sanity school ids that appear in published poll rankings. */
export async function getRankedSchoolSanityIds(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ sanityId: schoolsTable.sanityId })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(isNotNull(schoolsTable.sanityId));

  return rows
    .map((row) => row.sanityId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function getSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  const school = await db.query.schoolsTable.findFirst({
    where: (model, { eq }) => eq(model.sanityId, sanityId),
    columns: { id: true },
  });
  if (!school) {
    return { polls: [] };
  }

  const appearances = await db
    .select({
      pollId: pollsTable.id,
      pollSlug: pollsTable.slug,
      pollName: pollsTable.name,
      sportSlug: sportsTable.slug,
      sportTitle: sportsTable.name,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
      weekText: weeksTable.text,
      rank: pollRankingsTable.rank,
      points: pollRankingsTable.points,
    })
    .from(pollRankingsTable)
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(pollRankingsTable.schoolId, school.id));

  if (appearances.length === 0) {
    return { polls: [] };
  }

  const pollYearPairs = [
    ...new Map(
      appearances.map((row) => [
        `${row.pollId}:${row.year}`,
        { pollId: row.pollId, year: row.year },
      ]),
    ).values(),
  ];

  const pollIds = [...new Set(pollYearPairs.map((p) => p.pollId))];
  const years = [...new Set(pollYearPairs.map((p) => p.year))];

  const publishedWeekRows = await db
    .selectDistinct({
      pollId: pollRankingsTable.pollId,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
      weekText: weeksTable.text,
    })
    .from(pollRankingsTable)
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(
      and(
        inArray(pollRankingsTable.pollId, pollIds),
        inArray(seasonsTable.year, years),
      ),
    );

  const pollYearKeySet = new Set(
    pollYearPairs.map((p) => `${p.pollId}:${p.year}`),
  );
  const publishedWeeks = publishedWeekRows.filter((row) =>
    pollYearKeySet.has(`${row.pollId}:${row.year}`),
  );

  return buildSchoolRankingHistory(appearances, publishedWeeks);
}
