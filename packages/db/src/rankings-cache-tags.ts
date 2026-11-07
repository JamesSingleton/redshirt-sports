/** Cache tags for Next.js `"use cache"` rankings data on the public web app. */

/**
 * On every rankings entry, for edits that touch all of them (a school's name
 * or logo, a voter's display name). Publishing does not expire it: it would
 * also expire every team page.
 */
export const RANKINGS_CACHE_TAG = "rankings";

/** Lists built from every published poll week: the sitemaps and ranked-school ids. */
export const RANKINGS_PUBLISHED_TAG = "rankings:published";

/** One school's ranking history on its team page. */
export function rankingsSchoolTag(sanityId: string) {
  return `rankings:school:${sanityId}`;
}

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

/**
 * Tags to expire after publishing or unpublishing a poll week.
 *
 * Team pages tag their history with `rankingsDivisionWeeksTag` for each poll
 * season they appear in, so this expires every school already in this poll
 * season. Pass `schoolSanityIds` (the week's ranked schools) on publish to
 * also catch schools ranked in this poll season for the first time.
 */
export function rankingsInvalidationTags({
  sport,
  division,
  year,
  week,
  schoolSanityIds = [],
}: {
  sport: string;
  division: string;
  year: number;
  week: number;
  schoolSanityIds?: readonly string[];
}) {
  return [
    RANKINGS_PUBLISHED_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
    rankingsDivisionYearsTag(division),
    rankingsDivisionWeeksTag(division, year),
    ...new Set(schoolSanityIds.map(rankingsSchoolTag)),
  ];
}
