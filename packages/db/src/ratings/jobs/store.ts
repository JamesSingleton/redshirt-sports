import { and, asc, eq } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  ratingPoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../../schema";
import { weekIndex } from "../engine/math";
import { type PoolDefinition, poolDefinitionSchema } from "../pools";

export type Pool = PoolDefinition & {
  id: string;
  slug: string;
  name: string;
  sportId: string;
  sportSlug: string;
  isActive: boolean;
  isPublic: boolean;
  methodVersion: number;
};

function toPool(row: {
  id: string;
  slug: string;
  name: string;
  sportId: string;
  sportSlug: string;
  isActive: boolean;
  isPublic: boolean;
  methodVersion: number;
  membership: unknown;
  source: unknown;
  schedule: unknown;
  config: unknown;
}): Pool {
  const definition = poolDefinitionSchema.parse({
    membership: row.membership,
    source: row.source,
    schedule: row.schedule,
    config: row.config,
  });
  return { ...row, ...definition };
}

const poolColumns = {
  id: ratingPoolsTable.id,
  slug: ratingPoolsTable.slug,
  name: ratingPoolsTable.name,
  sportId: ratingPoolsTable.sportId,
  sportSlug: sportsTable.slug,
  isActive: ratingPoolsTable.isActive,
  isPublic: ratingPoolsTable.isPublic,
  methodVersion: ratingPoolsTable.methodVersion,
  membership: ratingPoolsTable.membership,
  source: ratingPoolsTable.source,
  schedule: ratingPoolsTable.schedule,
  config: ratingPoolsTable.config,
};

export async function listPools(
  filter: { active?: boolean; public?: boolean } = {},
): Promise<Pool[]> {
  const rows = await db
    .select(poolColumns)
    .from(ratingPoolsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, ratingPoolsTable.sportId))
    .orderBy(asc(sportsTable.slug), asc(ratingPoolsTable.slug));
  return rows
    .filter((row) => filter.active == null || row.isActive === filter.active)
    .filter((row) => filter.public == null || row.isPublic === filter.public)
    .map(toPool);
}

export async function getPool(
  sportSlug: string,
  poolSlug: string,
): Promise<Pool> {
  const [row] = await db
    .select(poolColumns)
    .from(ratingPoolsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, ratingPoolsTable.sportId))
    .where(
      and(eq(sportsTable.slug, sportSlug), eq(ratingPoolsTable.slug, poolSlug)),
    )
    .limit(1);
  if (!row) {
    throw new Error(`No rating pool ${sportSlug}/${poolSlug}.`);
  }
  return toPool(row);
}

export async function getPoolById(poolId: string): Promise<Pool> {
  const [row] = await db
    .select(poolColumns)
    .from(ratingPoolsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, ratingPoolsTable.sportId))
    .where(eq(ratingPoolsTable.id, poolId))
    .limit(1);
  if (!row) {
    throw new Error(`No rating pool ${poolId}.`);
  }
  return toPool(row);
}

export type CalendarWeek = {
  id: string;
  seasonType: number;
  number: number;
  startDate: Date;
  endDate: Date;
  label: string;
  index: number;
};

export type SeasonCalendar = {
  seasonId: string;
  year: number;
  regularWeekCount: number;
  /** Regular season and postseason weeks, in order. */
  weeks: CalendarWeek[];
};

/** A sport's season and its rateable weeks, as loaded from ESPN by the admin season loader. */
export async function loadSeasonCalendar(
  sportId: string,
  year: number,
): Promise<SeasonCalendar> {
  const rows = await db
    .select({
      seasonId: seasonsTable.id,
      weekId: weeksTable.id,
      seasonType: seasonTypesTable.type,
      number: weeksTable.number,
      startDate: weeksTable.startDate,
      endDate: weeksTable.endDate,
      text: weeksTable.text,
    })
    .from(seasonsTable)
    .innerJoin(seasonTypesTable, eq(seasonTypesTable.seasonId, seasonsTable.id))
    .innerJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
    .where(and(eq(seasonsTable.sportId, sportId), eq(seasonsTable.year, year)))
    .orderBy(asc(seasonTypesTable.type), asc(weeksTable.number));
  const seasonId = rows[0]?.seasonId;
  if (!seasonId) {
    throw new Error(
      `No ${year} season with weeks for this sport. Load seasons in admin (Development → Seasons) first.`,
    );
  }
  const rateable = rows.filter(
    (row) => row.seasonType === 2 || row.seasonType === 3,
  );
  const regularWeekCount = rateable.filter(
    (row) => row.seasonType === 2,
  ).length;
  return {
    seasonId,
    year,
    regularWeekCount,
    weeks: rateable.map((row, position) => ({
      id: row.weekId,
      seasonType: row.seasonType,
      number: row.number,
      startDate: row.startDate,
      // ESPN calendars occasionally overrun (2025 week 16 "ends" in 2026); a week ends where the next begins.
      endDate: new Date(
        Math.min(
          row.endDate.getTime(),
          rateable[position + 1]?.startDate.getTime() ??
            Number.POSITIVE_INFINITY,
        ),
      ),
      label: row.seasonType === 3 ? "Postseason" : `Week ${row.number}`,
      index: weekIndex(row.seasonType, row.number, regularWeekCount),
    })),
  };
}

/** The rateable week containing `at`, or the last one that has started. */
export function weekAt(
  calendar: SeasonCalendar,
  at: Date,
): CalendarWeek | null {
  const time = at.getTime();
  const containing = calendar.weeks.find(
    (week) => week.startDate.getTime() <= time && time < week.endDate.getTime(),
  );
  if (containing) {
    return containing;
  }
  const started = calendar.weeks.filter(
    (week) => week.startDate.getTime() <= time,
  );
  return started[started.length - 1] ?? null;
}

/** Which season year is in play for a sport at `at`: the latest season that has started. */
export async function seasonYearAt(
  sportId: string,
  at: Date,
): Promise<number | null> {
  const seasons = await db
    .select({ year: seasonsTable.year, startDate: seasonsTable.startDate })
    .from(seasonsTable)
    .where(eq(seasonsTable.sportId, sportId))
    .orderBy(asc(seasonsTable.year));
  const started = seasons.filter(
    (season) => season.startDate.getTime() <= at.getTime(),
  );
  return started[started.length - 1]?.year ?? null;
}
