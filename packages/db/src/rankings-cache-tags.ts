/** Cache tags for Next.js `"use cache"` rankings data on the public web app. */

export const RANKINGS_CACHE_TAG = "rankings";

export function rankingsSportTag(sport: string) {
  return `rankings:${sport}`;
}

export function rankingsDivisionTag(sport: string, division: string) {
  return `rankings:${sport}:${division}`;
}

export function rankingsWeekTag(
  sport: string,
  division: string,
  year: number,
  week: number,
) {
  return `rankings:${sport}:${division}:${year}:${week}`;
}

export function rankingsDivisionYearsTag(division: string) {
  return `rankings:${division}:years`;
}

export function rankingsDivisionWeeksTag(division: string, year: number) {
  return `rankings:${division}:${year}:weeks`;
}

/** Tags to expire after publishing or unpublishing a poll week. */
export function rankingsInvalidationTags({
  sport,
  division,
  year,
  week,
}: {
  sport: string;
  division: string;
  year: number;
  week: number;
}) {
  return [
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
    rankingsDivisionYearsTag(division),
    rankingsDivisionWeeksTag(division, year),
  ];
}
