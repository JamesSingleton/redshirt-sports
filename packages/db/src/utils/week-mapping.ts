import { SEASON_TYPE_CODES } from "../schema";

/** Legacy URL / storage week numbers still used at the app edge. */
export const LEGACY_PRESEASON_WEEK = 0;
export const LEGACY_FINAL_RANKINGS_WEEK = 999;

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
