import { and, eq, inArray, sql } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { seasonsTable, seasonTypesTable, weeksTable } from "../schema";
import {
  legacyWeekToSeasonTypeAndNumber,
  seasonTypeAndNumberToLegacyWeek,
} from "../utils/week-mapping";

export {
  calendarWeekKey,
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  legacyWeekLabel,
  legacyWeekToSeasonTypeAndNumber,
  PUBLISHABLE_SEASON_TYPES,
  parseCalendarWeekKey,
  pollThroughDate,
  seasonTypeAndNumberToLegacyWeek,
  weekTitle,
} from "../utils/week-mapping";

export async function resolveWeekIdForLegacyWeek({
  sportId,
  year,
  legacyWeek,
}: {
  sportId: string;
  year: number;
  legacyWeek: number;
}): Promise<string | null> {
  const { seasonType, weekNumber } =
    legacyWeekToSeasonTypeAndNumber(legacyWeek);

  return resolveWeekIdForCalendarWeek({
    sportId,
    year,
    seasonType,
    weekNumber,
  });
}

/** Week id plus the calendar fields needed to describe the poll. */
export async function resolveWeekForLegacyWeek({
  sportId,
  year,
  legacyWeek,
}: {
  sportId: string;
  year: number;
  legacyWeek: number;
}): Promise<{ weekId: string; endDate: Date; seasonType: number } | null> {
  const { seasonType, weekNumber } =
    legacyWeekToSeasonTypeAndNumber(legacyWeek);

  const week = await resolveCalendarWeek({
    sportId,
    year,
    seasonType,
    weekNumber,
  });
  return week ? { ...week, seasonType } : null;
}

export async function resolveWeekIdForCalendarWeek(args: {
  sportId: string;
  year: number;
  seasonType: number;
  weekNumber: number;
}): Promise<string | null> {
  const week = await resolveCalendarWeek(args);
  return week?.weekId ?? null;
}

async function resolveCalendarWeek({
  sportId,
  year,
  seasonType,
  weekNumber,
}: {
  sportId: string;
  year: number;
  seasonType: number;
  weekNumber: number;
}): Promise<{ weekId: string; endDate: Date } | null> {
  const row = await db
    .select({
      weekId: weeksTable.id,
      // The live column is `timestamp without time zone` holding UTC; the
      // driver would parse it in the server's local zone. Epoch is UTC either way.
      endEpoch: sql<string>`extract(epoch from ${weeksTable.endDate})`,
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
        eq(seasonTypesTable.type, seasonType),
        eq(weeksTable.number, weekNumber),
      ),
    )
    .limit(1);

  const match = row[0];
  if (!match) return null;
  return {
    weekId: match.weekId,
    endDate: new Date(Number(match.endEpoch) * 1000),
  };
}

function legacyWeekLookupKey({
  sportId,
  year,
  legacyWeek,
}: {
  sportId: string;
  year: number;
  legacyWeek: number;
}) {
  return `${sportId}:${year}:${legacyWeek}`;
}

/**
 * Resolve many legacy week lookups in one DB round trip.
 * Returns a map keyed by `${sportId}:${year}:${legacyWeek}`.
 */
export async function resolveWeekIdsForLegacyWeekLookups(
  lookups: Array<{
    sportId: string;
    year: number;
    legacyWeek: number;
  }>,
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  if (lookups.length === 0) return results;

  const uniqueLookups = new Map<
    string,
    { sportId: string; year: number; legacyWeek: number }
  >();
  for (const lookup of lookups) {
    const key = legacyWeekLookupKey(lookup);
    if (!uniqueLookups.has(key)) {
      uniqueLookups.set(key, lookup);
      results.set(key, null);
    }
  }

  const sportIds = [
    ...new Set([...uniqueLookups.values()].map((lookup) => lookup.sportId)),
  ];
  const years = [
    ...new Set([...uniqueLookups.values()].map((lookup) => lookup.year)),
  ];

  const rows = await db
    .select({
      weekId: weeksTable.id,
      sportId: seasonsTable.sportId,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      weekNumber: weeksTable.number,
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
        inArray(seasonsTable.year, years),
      ),
    );

  const weekByCalendarKey = new Map(
    rows.map((row) => [
      `${row.sportId}:${row.year}:${row.seasonType}:${row.weekNumber}`,
      row.weekId,
    ]),
  );

  for (const [key, lookup] of uniqueLookups) {
    const { seasonType, weekNumber } = legacyWeekToSeasonTypeAndNumber(
      lookup.legacyWeek,
    );
    results.set(
      key,
      weekByCalendarKey.get(
        `${lookup.sportId}:${lookup.year}:${seasonType}:${weekNumber}`,
      ) ?? null,
    );
  }

  return results;
}

export function weekLookupKey(lookup: {
  sportId: string;
  year: number;
  legacyWeek: number;
}) {
  return legacyWeekLookupKey(lookup);
}

export async function getWeekMetaById(weekId: string): Promise<{
  weekId: string;
  weekNumber: number;
  seasonType: number;
  year: number;
  sportId: string;
  legacyWeek: number;
} | null> {
  const row = await db
    .select({
      weekId: weeksTable.id,
      weekNumber: weeksTable.number,
      seasonType: seasonTypesTable.type,
      year: seasonsTable.year,
      sportId: seasonsTable.sportId,
    })
    .from(weeksTable)
    .innerJoin(
      seasonTypesTable,
      eq(weeksTable.seasonTypeId, seasonTypesTable.id),
    )
    .innerJoin(seasonsTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .where(eq(weeksTable.id, weekId))
    .limit(1);

  const match = row[0];
  if (!match) return null;

  return {
    ...match,
    legacyWeek: seasonTypeAndNumberToLegacyWeek(
      match.seasonType,
      match.weekNumber,
    ),
  };
}
