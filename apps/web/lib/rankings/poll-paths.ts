/** Stable URL that always shows a poll's latest published week. */
export function pollLatestPath(sport: string, division: string): string {
  return `/college/${sport}/rankings/${division}`;
}

/** Permanent URL for one published week. */
export function pollWeekPath(
  sport: string,
  division: string,
  year: string | number,
  weekSegment: string,
): string {
  return `/college/${sport}/rankings/${division}/${year}/${weekSegment}`;
}

/** Every published week of a poll. */
export function pollHistoryPath(sport: string, division: string): string {
  return `/college/${sport}/rankings/${division}/history`;
}
