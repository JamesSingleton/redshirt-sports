import { and, eq } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  seasonTypesTable,
  seasonsTable,
  weeksTable,
} from "../schema";
import {
  legacyWeekToSeasonTypeAndNumber,
  seasonTypeAndNumberToLegacyWeek,
} from "../utils/week-mapping";

export {
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  legacyWeekToSeasonTypeAndNumber,
  seasonTypeAndNumberToLegacyWeek,
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

  const row = await db
    .select({ weekId: weeksTable.id })
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

  return row[0]?.weekId ?? null;
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
