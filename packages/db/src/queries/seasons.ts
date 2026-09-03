import { inArray } from "drizzle-orm";

import { primaryDb as db } from "../client";
import { SEASON_TYPE_CODES, seasonsTable } from "../schema";
import {
  isWeekCompleteForVoting,
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
  return db.query.seasonsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.sportId, sportId), eq(model.year, year)),
    with: {
      seasonTypes: {
        where: (s, { eq }) => eq(s.type, seasonType),
        with: {
          weeks: {
            where: (w, { eq }) => eq(w.number, week),
          },
        },
      },
    },
  });
}

export async function getCurrentSeasonStartAndEnd({
  sportId,
  year,
}: {
  sportId: string;
  year: number;
}) {
  const season = await db.query.seasonsTable.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.year, year), eq(model.sportId, sportId)),
  });

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
 * Voting week = last regular week complete for voting (`endDate - 48h`),
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
    isWeekCompleteForVoting(week.endDate, date),
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

  const seasonHeaders = await db.query.seasonsTable.findMany({
    where: inArray(seasonsTable.sportId, sportIds),
    columns: {
      id: true,
      sportId: true,
      year: true,
      startDate: true,
      endDate: true,
    },
    orderBy: (model, { desc }) => [desc(model.year)],
  });

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

  const seasons = await db.query.seasonsTable.findMany({
    where: inArray(seasonsTable.id, currentSeasonIds),
    with: {
      seasonTypes: {
        with: {
          weeks: true,
        },
      },
    },
  });

  const seasonById = new Map(seasons.map((season) => [season.id, season]));

  for (const sportId of sportIds) {
    const header = currentHeaderBySport.get(sportId);
    if (!header) continue;
    const current = seasonById.get(header.id);
    if (!current) continue;

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
      year: current.year,
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
