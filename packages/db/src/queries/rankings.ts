import { and, asc, desc, eq, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  pollsTable,
  pollRankingsTable,
  schoolsTable,
  seasonTypesTable,
  seasonsTable,
  sportsTable,
  weeksTable,
} from "../schema";
import type { FinalRankingWithSchool } from "../types/rankings";
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
    image: unknown;
    rank: number | null;
    firstPlaceVotes: number;
    isTie: boolean;
  }[];
};

export async function getAllLegacyWeeklyRankings() {
  // Legacy jsonb table — kept only while old rows may still exist locally.
  return db.execute(sql`SELECT * FROM weekly_final_rankings`);
}

export async function getAllWeeklyRankings() {
  return db.query.pollRankingsTable.findMany();
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
      image: schoolsTable.image,
    })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(
      and(eq(pollRankingsTable.pollId, poll.id), eq(pollRankingsTable.weekId, weekId)),
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
