import { and, desc, eq, inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import {
  SEASON_TYPE_CODES,
  seasonsTable,
  seasonTypesTable,
  weeksTable,
} from "../schema";
import {
  isWeekEligibleForVoting,
  LEGACY_FINAL_RANKINGS_WEEK,
  LEGACY_PRESEASON_WEEK,
  legacyWeekToSeasonTypeAndNumber,
} from "../utils/week-mapping";

export async function getWeekBySport(
  sportId: string,
  year: number,
  week: number,
  seasonType = SEASON_TYPE_CODES.REGULAR_SEASON,
) {
  const [season] = await db
    .select()
    .from(seasonsTable)
    .where(and(eq(seasonsTable.sportId, sportId), eq(seasonsTable.year, year)))
    .limit(1);
  if (!season) return undefined;

  const [matchedType] = await db
    .select()
    .from(seasonTypesTable)
    .where(
      and(
        eq(seasonTypesTable.seasonId, season.id),
        eq(seasonTypesTable.type, seasonType),
      ),
    )
    .limit(1);
  if (!matchedType) {
    return { ...season, seasonTypes: [] };
  }

  const weeks = await db
    .select()
    .from(weeksTable)
    .where(
      and(
        eq(weeksTable.seasonTypeId, matchedType.id),
        eq(weeksTable.number, week),
      ),
    );

  return {
    ...season,
    seasonTypes: [{ ...matchedType, weeks }],
  };
}

export async function getCurrentSeasonStartAndEnd({
  sportId,
  year,
}: {
  sportId: string;
  year: number;
}) {
  const [season] = await db
    .select()
    .from(seasonsTable)
    .where(and(eq(seasonsTable.year, year), eq(seasonsTable.sportId, sportId)))
    .limit(1);

  return season;
}

export type VotingSeasonInfo = {
  sportId: string;
  year: number;
  votingWeek: number;
  weekId: string | null;
  isPreseason: boolean;
  isRegularSeason: boolean;
  isPostseason: boolean;
};

/**
 * Voting week = last regular week eligible for voting (`endDate - 48h`),
 * else Preseason, else Final Rankings after regular season ends.
 * See docs/poll-weeks.md.
 */
export function resolveVotingWeekFromLocalSeason({
  regularSeasonEndDate,
  regularWeeks,
  date,
}: {
  regularSeasonEndDate: Date | null;
  regularWeeks: Array<{ number: number; endDate: Date }>;
  date: Date;
}): number {
  if (!regularSeasonEndDate) {
    return LEGACY_PRESEASON_WEEK;
  }

  if (date >= regularSeasonEndDate) {
    return LEGACY_FINAL_RANKINGS_WEEK;
  }

  const completed = regularWeeks.filter((week) =>
    isWeekEligibleForVoting(week.endDate, date),
  );
  if (completed.length === 0) {
    return LEGACY_PRESEASON_WEEK;
  }

  return Math.max(...completed.map((week) => week.number));
}

export function periodFlags({
  date,
  preseasonStart,
  preseasonEnd,
  regularStart,
  regularEnd,
}: {
  date: Date;
  preseasonStart: Date | null;
  preseasonEnd: Date | null;
  regularStart: Date | null;
  regularEnd: Date | null;
}) {
  const isPreseason =
    preseasonStart != null &&
    preseasonEnd != null &&
    date >= preseasonStart &&
    date <= preseasonEnd;

  const isRegularSeason =
    regularStart != null &&
    regularEnd != null &&
    date >= regularStart &&
    date <= regularEnd;

  const isPostseason =
    regularEnd != null && date >= regularEnd && !isRegularSeason;

  return { isPreseason, isRegularSeason, isPostseason };
}

export function resolveWeekIdFromSeasonTypes({
  seasonTypes,
  votingWeek,
}: {
  seasonTypes: Array<{
    type: number;
    weeks: Array<{ id: string; number: number }>;
  }>;
  votingWeek: number;
}): string | null {
  const { seasonType, weekNumber } =
    legacyWeekToSeasonTypeAndNumber(votingWeek);
  const type = seasonTypes.find((entry) => entry.type === seasonType);
  return type?.weeks.find((week) => week.number === weekNumber)?.id ?? null;
}

/**
 * Resolve current voting-season info for many sports from synced Postgres
 * season/week rows (no ESPN round trip).
 *
 * Loads season headers first, then only types/weeks for the current season
 * per sport (overlapping dates, else latest year).
 */
export async function getVotingSeasonInfoBySportIds(
  sportIds: string[],
  date = new Date(),
): Promise<Map<string, VotingSeasonInfo>> {
  const bySportId = new Map<string, VotingSeasonInfo>();
  if (sportIds.length === 0) return bySportId;

  const seasonHeaders = await db
    .select({
      id: seasonsTable.id,
      sportId: seasonsTable.sportId,
      year: seasonsTable.year,
      startDate: seasonsTable.startDate,
      endDate: seasonsTable.endDate,
    })
    .from(seasonsTable)
    .where(inArray(seasonsTable.sportId, sportIds))
    .orderBy(desc(seasonsTable.year));

  const headersBySport = new Map<string, typeof seasonHeaders>();
  for (const season of seasonHeaders) {
    const list = headersBySport.get(season.sportId) ?? [];
    list.push(season);
    headersBySport.set(season.sportId, list);
  }

  const currentSeasonIds: string[] = [];
  const currentHeaderBySport = new Map<
    string,
    (typeof seasonHeaders)[number]
  >();

  for (const sportId of sportIds) {
    const sportSeasons = headersBySport.get(sportId) ?? [];
    const current =
      sportSeasons.find(
        (season) => date >= season.startDate && date <= season.endDate,
      ) ?? sportSeasons[0];
    if (!current) continue;
    currentSeasonIds.push(current.id);
    currentHeaderBySport.set(sportId, current);
  }

  if (currentSeasonIds.length === 0) return bySportId;

  const typeAndWeekRows = await db
    .select({
      seasonId: seasonTypesTable.seasonId,
      type: seasonTypesTable.type,
      typeStart: seasonTypesTable.startDate,
      typeEnd: seasonTypesTable.endDate,
      weekId: weeksTable.id,
      weekNumber: weeksTable.number,
      weekEnd: weeksTable.endDate,
    })
    .from(seasonTypesTable)
    .leftJoin(weeksTable, eq(weeksTable.seasonTypeId, seasonTypesTable.id))
    .where(inArray(seasonTypesTable.seasonId, currentSeasonIds));

  type SeasonTypeBag = {
    type: number;
    startDate: Date;
    endDate: Date;
    weeks: Array<{ id: string; number: number; endDate: Date }>;
  };

  const typesBySeasonId = new Map<string, Map<number, SeasonTypeBag>>();
  for (const row of typeAndWeekRows) {
    let byType = typesBySeasonId.get(row.seasonId);
    if (!byType) {
      byType = new Map();
      typesBySeasonId.set(row.seasonId, byType);
    }

    let bag = byType.get(row.type);
    if (!bag) {
      bag = {
        type: row.type,
        startDate: row.typeStart,
        endDate: row.typeEnd,
        weeks: [],
      };
      byType.set(row.type, bag);
    }

    if (row.weekId != null && row.weekNumber != null && row.weekEnd != null) {
      bag.weeks.push({
        id: row.weekId,
        number: row.weekNumber,
        endDate: row.weekEnd,
      });
    }
  }

  const seasons = currentSeasonIds.flatMap((seasonId) => {
    const byType = typesBySeasonId.get(seasonId);
    if (!byType) return [];
    return [
      {
        id: seasonId,
        seasonTypes: [...byType.values()].map((entry) => ({
          type: entry.type,
          startDate: entry.startDate,
          endDate: entry.endDate,
          weeks: entry.weeks,
        })),
      },
    ];
  });

  const seasonById = new Map(seasons.map((season) => [season.id, season]));

  for (const sportId of sportIds) {
    const header = currentHeaderBySport.get(sportId);
    if (!header) continue;
    const current = seasonById.get(header.id) ?? {
      id: header.id,
      seasonTypes: [],
    };

    const preseason = current.seasonTypes.find(
      (type) => type.type === SEASON_TYPE_CODES.PRESEASON,
    );
    const regularSeason = current.seasonTypes.find(
      (type) => type.type === SEASON_TYPE_CODES.REGULAR_SEASON,
    );

    const { isPreseason, isRegularSeason, isPostseason } = periodFlags({
      date,
      preseasonStart: preseason?.startDate ?? null,
      preseasonEnd: preseason?.endDate ?? null,
      regularStart: regularSeason?.startDate ?? null,
      regularEnd: regularSeason?.endDate ?? null,
    });

    const votingWeek = resolveVotingWeekFromLocalSeason({
      regularSeasonEndDate: regularSeason?.endDate ?? null,
      regularWeeks: (regularSeason?.weeks ?? []).map((week) => ({
        number: week.number,
        endDate: week.endDate,
      })),
      date,
    });

    bySportId.set(sportId, {
      sportId,
      year: header.year,
      votingWeek,
      weekId: resolveWeekIdFromSeasonTypes({
        seasonTypes: current.seasonTypes,
        votingWeek,
      }),
      isPreseason,
      isRegularSeason,
      isPostseason,
    });
  }

  return bySportId;
}
