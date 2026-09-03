/**
 * Legacy week integers used at the app / URL edge.
 * Same contract as `@redshirt-sports/db/utils/week-mapping`
 * (`0` preseason, `N` regular, `999` postseason / final rankings).
 * New DB rows use real `weeks.id` FKs — these ints are for URLs and ESPN helpers only.
 */
export const LEGACY_PRESEASON_WEEK = 0;
export const LEGACY_FINAL_RANKINGS_WEEK = 999;

export const FINAL_RANKINGS_SEGMENT = "final-rankings";
export const PRESEASON_SEGMENT = "preseason";

/** Open the next voting week this long before ESPN regular-week `endDate`. */
export const VOTING_WEEK_EARLY_OPEN_MS = 48 * 60 * 60 * 1000;

/** True once `now` is at or past `endDate - 48h` (ballot attachment, not calendar week). */
export function isWeekCompleteForVoting(endDate: Date, now: Date): boolean {
  return now.getTime() >= endDate.getTime() - VOTING_WEEK_EARLY_OPEN_MS;
}

/**
 * Parse a rankings URL week segment into a legacy week number.
 * Accepts `final-rankings`, `preseason`, or a numeric string (`0`, `1`, …).
 */
export function parseWeekSegment(segment: string): number {
  if (segment === FINAL_RANKINGS_SEGMENT) {
    return LEGACY_FINAL_RANKINGS_WEEK;
  }
  if (segment === PRESEASON_SEGMENT) {
    return LEGACY_PRESEASON_WEEK;
  }

  const parsed = Number.parseInt(segment, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid week segment: ${segment}`);
  }
  return parsed;
}

/**
 * Format a legacy week number for rankings URLs.
 * Postseason → `final-rankings`; preseason stays numeric `0` (current site behavior).
 */
export function formatWeekSegment(legacyWeek: number): string {
  if (legacyWeek === LEGACY_FINAL_RANKINGS_WEEK) {
    return FINAL_RANKINGS_SEGMENT;
  }
  return String(legacyWeek);
}

/**
 * Human-readable week label for rankings UI.
 */
export function weekTitle(legacyWeek: number): string {
  if (legacyWeek === LEGACY_PRESEASON_WEEK) {
    return "Preseason";
  }
  if (legacyWeek === LEGACY_FINAL_RANKINGS_WEEK) {
    return "Final Rankings";
  }
  return `Week ${legacyWeek}`;
}
