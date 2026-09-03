import { SEASON_TYPE_CODES } from "../schema";

/** Legacy URL / storage week numbers still used at the app edge. */
export const LEGACY_PRESEASON_WEEK = 0;
export const LEGACY_FINAL_RANKINGS_WEEK = 999;

/** Season types that have Top 25 ballots / published rankings. */
export const PUBLISHABLE_SEASON_TYPES = [
  SEASON_TYPE_CODES.PRESEASON,
  SEASON_TYPE_CODES.REGULAR_SEASON,
  SEASON_TYPE_CODES.POSTSEASON,
] as const;

export function calendarWeekKey(
  seasonType: number,
  weekNumber: number,
): string {
  return `${seasonType}-${weekNumber}`;
}

export function parseCalendarWeekKey(
  weekKey: string,
): { seasonType: number; weekNumber: number } | null {
  const [seasonTypeRaw, weekNumberRaw] = weekKey.split("-");
  const seasonType = Number(seasonTypeRaw);
  const weekNumber = Number(weekNumberRaw);
  if (
    !Number.isInteger(seasonType) ||
    !Number.isInteger(weekNumber) ||
    weekNumber < 1
  ) {
    return null;
  }
  return { seasonType, weekNumber };
}

/**
 * Map legacy week integers (0 / N / 999) to ESPN calendar season type + week number.
 */
export function legacyWeekToSeasonTypeAndNumber(legacyWeek: number): {
  seasonType: number;
  weekNumber: number;
} {
  if (legacyWeek === LEGACY_PRESEASON_WEEK) {
    return {
      seasonType: SEASON_TYPE_CODES.PRESEASON,
      weekNumber: 1,
    };
  }
  if (legacyWeek === LEGACY_FINAL_RANKINGS_WEEK) {
    return {
      seasonType: SEASON_TYPE_CODES.POSTSEASON,
      weekNumber: 1,
    };
  }
  return {
    seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
    weekNumber: legacyWeek,
  };
}

/**
 * Map a DB week + season type back to the legacy week number used in URLs.
 */
export function seasonTypeAndNumberToLegacyWeek(
  seasonType: number,
  weekNumber: number,
): number {
  if (seasonType === SEASON_TYPE_CODES.PRESEASON) {
    return LEGACY_PRESEASON_WEEK;
  }
  if (seasonType === SEASON_TYPE_CODES.POSTSEASON) {
    return LEGACY_FINAL_RANKINGS_WEEK;
  }
  return weekNumber;
}

/** Human-readable label for a legacy week integer (URLs / filters). */
export function weekTitle(legacyWeek: number): string {
  if (legacyWeek === LEGACY_PRESEASON_WEEK) {
    return "Preseason";
  }
  if (legacyWeek === LEGACY_FINAL_RANKINGS_WEEK) {
    return "Final Rankings";
  }
  return `Week ${legacyWeek}`;
}

export type CalendarWeekParams = {
  seasonType: number;
  weekNumber: number;
};

/** Resolve week from weekKey, seasonType+weekNumber, or legacy week integer. */
export function resolveCalendarWeekParams({
  weekKey,
  seasonType,
  weekNumber,
  legacyWeek,
}: {
  weekKey?: string | null;
  seasonType?: number | null;
  weekNumber?: number | null;
  legacyWeek?: number | null;
}): CalendarWeekParams {
  if (weekKey) {
    const parsed = parseCalendarWeekKey(weekKey);
    if (!parsed) {
      throw new Error(`Invalid week key: ${weekKey}`);
    }
    return parsed;
  }

  if (seasonType != null && weekNumber != null) {
    return { seasonType, weekNumber };
  }

  if (legacyWeek != null) {
    return legacyWeekToSeasonTypeAndNumber(legacyWeek);
  }

  throw new Error(
    "Week is required (weekKey, seasonType + weekNumber, or legacy week)",
  );
}

/**
 * Label for a calendar week row from the DB (ESPN `text` + season type).
 * Preseason is always "Preseason" even when ESPN calls it "Week 1".
 */
export function legacyWeekLabel({
  legacyWeek,
  seasonType,
  weekNumber,
  text,
}: {
  legacyWeek: number;
  seasonType: number;
  weekNumber: number;
  text?: string | null;
}): string {
  if (seasonType === SEASON_TYPE_CODES.PRESEASON) {
    return "Preseason";
  }
  if (seasonType === SEASON_TYPE_CODES.POSTSEASON) {
    const trimmed = text?.trim();
    if (trimmed) {
      if (
        weekNumber === 1 &&
        legacyWeek === LEGACY_FINAL_RANKINGS_WEEK &&
        trimmed.toLowerCase() !== "final rankings"
      ) {
        return `${trimmed} (Final Rankings)`;
      }
      return trimmed;
    }
    return weekNumber === 1
      ? "Final Rankings"
      : `Postseason week ${weekNumber}`;
  }
  const trimmed = text?.trim();
  if (trimmed) return trimmed;
  return weekTitle(legacyWeek);
}
