import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

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
import { hasRankingsFor } from "./has-rankings";
import { getPollBySportAndSlug, resolvePollWeekBySlugs } from "./polls";
import { getSportIdBySlug, type SportParam } from "./sports";
import {
  resolveWeekIdForLegacyWeek,
  resolveWeekIdsForLegacyWeekLookups,
  seasonTypeAndNumberToLegacyWeek,
  weekLookupKey,
} from "./weeks";

/** Omit Sanity LQIP `preview` from school logos in rankings projections. */
export const schoolLogoImage = sql<unknown>`
  CASE
    WHEN ${schoolsTable.image} IS NULL THEN NULL
    ELSE jsonb_strip_nulls(
      jsonb_build_object(
        'id', coalesce(
          ${schoolsTable.image}->>'id',
          ${schoolsTable.image}->'asset'->>'_ref'
        ),
        'alt', coalesce(
          ${schoolsTable.image}->>'alt',
          ${schoolsTable.image}->>'caption'
        ),
        'width', ${schoolsTable.image}->'width',
        'height', ${schoolsTable.image}->'height',
        'hotspot', ${schoolsTable.image}->'hotspot',
        'crop', ${schoolsTable.image}->'crop'
      )
    )
  END
`;

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

export async function getAllWeeklyRankings() {
  return db.select().from(pollRankingsTable);
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

  const rankings = await db
    .select({
      ranking: pollRankingsTable,
      school: schoolsTable,
    })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(
      and(
        eq(pollRankingsTable.pollId, poll.id),
        eq(pollRankingsTable.weekId, weekId),
      ),
    )
    .orderBy(asc(pollRankingsTable.rank), asc(pollRankingsTable.points));

  return rankings.map((row) => ({
    ...row.ranking,
    school: row.school,
    ranking: row.ranking.rank,
    schoolId: row.ranking.schoolId,
    weekId: row.ranking.weekId,
    divisionSportId: poll.divisionSportId,
    firstPlaceVotes: row.ranking.firstPlaceVotes,
    isTie: row.ranking.isTie,
    points: row.ranking.points,
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
  let pollId: string;
  let weekId: string | null;
  if (sport) {
    // Sport, poll, and week in one round trip.
    const resolved = await resolvePollWeekBySlugs({
      sport,
      division,
      year,
      legacyWeek: week,
    });
    if (!resolved) throw new Error("Rankings not found");
    pollId = resolved.poll.id;
    weekId = resolved.weekId;
  } else {
    // Infer sport from poll slug when only one active poll matches
    const [poll] = await db
      .select({ sportId: pollsTable.sportId })
      .from(pollsTable)
      .where(eq(pollsTable.slug, division))
      .limit(1);
    if (!poll) {
      throw new Error(`Unable to resolve sport for division ${division}`);
    }
    const found = await getPollBySportAndSlug({
      sportId: poll.sportId,
      slug: division,
    });
    if (!found) throw new Error("Rankings not found");
    pollId = found.id;
    weekId = await resolveWeekIdForLegacyWeek({
      sportId: poll.sportId,
      year,
      legacyWeek: week,
    });
  }
  if (!weekId) throw new Error("Rankings not found");

  // Project only fields CustomImage/processImageData need.
  const rows = await db
    .select({
      rank: pollRankingsTable.rank,
      points: pollRankingsTable.points,
      firstPlaceVotes: pollRankingsTable.firstPlaceVotes,
      isTie: pollRankingsTable.isTie,
      sanityId: schoolsTable.sanityId,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
      abbreviation: schoolsTable.abbreviation,
      slug: schoolsTable.slug,
      image: schoolLogoImage,
    })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(
      and(
        eq(pollRankingsTable.pollId, pollId),
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
    id: `${pollId}:${weekId}`,
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

function mapRankingRowsToFinalRankings({
  division,
  year,
  legacyWeek,
  rows,
}: {
  division: string;
  year: number;
  legacyWeek: number;
  rows: Array<{
    id: string;
    rank: number | null;
    points: number;
    firstPlaceVotes: number;
    isTie: boolean;
    sanityId: string | null;
    name: string | null;
    shortName: string | null;
    abbreviation: string | null;
    slug: string | null;
    image: unknown;
  }>;
}): FinalRankings {
  return {
    id: `${division}:${year}:${legacyWeek}`,
    division,
    week: legacyWeek,
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

/** One round trip for every published week in a poll season (poll history matrix). */
export async function getFinalRankingsForLegacyWeeksInYear({
  year,
  division,
  sport,
  legacyWeeks,
}: {
  year: number;
  division: string;
  sport: SportParam;
  legacyWeeks: number[];
}): Promise<Map<number, FinalRankings>> {
  const results = new Map<number, FinalRankings>();
  if (legacyWeeks.length === 0) {
    return results;
  }

  const sportId = await getSportIdBySlug(sport);
  if (!sportId) {
    throw new Error(`Unable to find sport by slug. Slug: ${sport}`);
  }

  const poll = await getPollBySportAndSlug({ sportId, slug: division });
  if (!poll) {
    throw new Error(`Poll not found: ${sport}/${division}`);
  }

  const weekIdByLookup = await resolveWeekIdsForLegacyWeekLookups(
    legacyWeeks.map((legacyWeek) => ({ sportId, year, legacyWeek })),
  );

  const weekIdToLegacy = new Map<string, number>();
  const weekIds: string[] = [];
  for (const legacyWeek of legacyWeeks) {
    const weekId = weekIdByLookup.get(
      weekLookupKey({ sportId, year, legacyWeek }),
    );
    if (weekId) {
      weekIds.push(weekId);
      weekIdToLegacy.set(weekId, legacyWeek);
    }
  }

  if (weekIds.length === 0) {
    return results;
  }

  const rows = await db
    .select({
      weekId: pollRankingsTable.weekId,
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
      image: schoolLogoImage,
    })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(
      and(
        eq(pollRankingsTable.pollId, poll.id),
        inArray(pollRankingsTable.weekId, weekIds),
      ),
    )
    .orderBy(
      asc(pollRankingsTable.weekId),
      sql`${pollRankingsTable.rank} ASC NULLS LAST`,
      desc(pollRankingsTable.points),
    );

  const rowsByWeekId = new Map<string, typeof rows>();
  for (const row of rows) {
    const bucket = rowsByWeekId.get(row.weekId);
    if (bucket) {
      bucket.push(row);
    } else {
      rowsByWeekId.set(row.weekId, [row]);
    }
  }

  for (const [weekId, legacyWeek] of weekIdToLegacy) {
    const weekRows = rowsByWeekId.get(weekId);
    if (!weekRows?.length) {
      continue;
    }
    results.set(
      legacyWeek,
      mapRankingRowsToFinalRankings({
        division,
        year,
        legacyWeek,
        rows: weekRows,
      }),
    );
  }

  return results;
}

/**
 * Most recent published week for a poll. Pass `sport` to disambiguate poll
 * slugs shared across sports (e.g. a football and a basketball `d2`).
 * `publishedAt` is when that week's rankings were written.
 */
export async function getLatestFinalRankings({
  division,
  sport,
}: {
  division: string;
  sport?: string;
}) {
  // Walk the poll's weeks newest-first and stop at the first with rankings,
  // instead of sorting every ranking row the poll has ever published.
  const row = await db
    .select({
      division: pollsTable.slug,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
      publishedAt: sql<Date | null>`(
        select ${pollRankingsTable.createdAt} from ${pollRankingsTable}
        where ${pollRankingsTable.pollId} = ${pollsTable.id}
          and ${pollRankingsTable.weekId} = ${weeksTable.id}
        limit 1
      )`.mapWith(pollRankingsTable.createdAt),
    })
    .from(pollsTable)
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .innerJoin(seasonsTable, eq(seasonsTable.sportId, pollsTable.sportId))
    .innerJoin(seasonTypesTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .innerJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
    .where(
      and(
        eq(pollsTable.slug, division),
        ...(sport ? [eq(sportsTable.slug, sport)] : []),
        hasRankingsFor(pollsTable.id, weeksTable.id),
      ),
    )
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
    publishedAt: match.publishedAt,
  };
}

export async function getLatestFinalRankingsBySportSlug(sportSlug: string) {
  const pollSlugs = await db
    .select({ slug: pollsTable.slug })
    .from(pollsTable)
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .where(eq(sportsTable.slug, sportSlug));

  const latestRows = await Promise.all(
    pollSlugs.map(async ({ slug }) =>
      getLatestFinalRankings({ division: slug, sport: sportSlug }),
    ),
  );

  return latestRows.filter(
    (row): row is NonNullable<(typeof latestRows)[number]> => row != null,
  );
}

export async function arePollRankingsPublished({
  pollId,
  weekId,
}: {
  pollId: string;
  weekId: string;
}) {
  const row = await db
    .select({ id: pollRankingsTable.id })
    .from(pollRankingsTable)
    .where(
      and(
        eq(pollRankingsTable.pollId, pollId),
        eq(pollRankingsTable.weekId, weekId),
      ),
    )
    .limit(1);

  return row.length > 0;
}

export async function deletePollRankings({
  pollId,
  weekId,
}: {
  pollId: string;
  weekId: string;
}) {
  const deleted = await db
    .delete(pollRankingsTable)
    .where(
      and(
        eq(pollRankingsTable.pollId, pollId),
        eq(pollRankingsTable.weekId, weekId),
      ),
    )
    .returning({ id: pollRankingsTable.id });

  return { deleted: deleted.length };
}

/**
 * Pass `executor` to run inside a caller's transaction (as a savepoint).
 */
export async function replacePollRankings(
  {
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
  },
  executor: Pick<typeof db, "transaction"> = db,
) {
  await executor.transaction(async (tx) => {
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
  const [row] = await db
    .select({ id: pollRankingsTable.id })
    .from(pollRankingsTable)
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .where(eq(schoolsTable.sanityId, sanityId))
    .limit(1);

  return !!row;
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
    .innerJoin(schoolsTable, eq(pollRankingsTable.schoolId, schoolsTable.id))
    .innerJoin(pollsTable, eq(pollRankingsTable.pollId, pollsTable.id))
    .innerJoin(sportsTable, eq(pollsTable.sportId, sportsTable.id))
    .innerJoin(weeksTable, eq(pollRankingsTable.weekId, weeksTable.id))
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(schoolsTable.sanityId, sanityId));

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

  // Each poll's weeks in those years that have rankings (one index probe per
  // week), not every ranking row de-duplicated.
  const publishedWeekRows = await db
    .select({
      pollId: pollsTable.id,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
      weekText: weeksTable.text,
    })
    .from(pollsTable)
    .innerJoin(seasonsTable, eq(seasonsTable.sportId, pollsTable.sportId))
    .innerJoin(seasonTypesTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .innerJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
    .where(
      and(
        inArray(pollsTable.id, pollIds),
        inArray(seasonsTable.year, years),
        hasRankingsFor(pollsTable.id, weeksTable.id),
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
