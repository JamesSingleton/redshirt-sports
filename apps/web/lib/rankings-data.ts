import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankings,
  getLatestFinalRankingsBySportSlug,
  getRankedSchoolSanityIds,
  getSchoolRankingHistory,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  schoolHasPollRankings,
} from "@redshirt-sports/db/queries";
import {
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsDivisionWeeksTag,
  rankingsDivisionYearsTag,
  rankingsInvalidationTags,
  rankingsSportTag,
  rankingsWeekTag,
} from "@redshirt-sports/db/rankings-cache-tags";
import type { SchoolRankingHistory } from "@redshirt-sports/db/utils/school-ranking-history";
import { cacheLife, cacheTag } from "next/cache";

import type { SportParam } from "@/utils/espn";

/**
 * Cross-request Data Cache lifetime for rankings Postgres reads.
 * Publish still busts immediately via `cacheTag`. next.config sets
 * `cacheLife.default` to the Sanity live-preview profile, which is too
 * short to persist — that is why these queries ran on every page view.
 */
export const RANKINGS_CACHE_LIFE = {
  stale: 300,
  revalidate: 3600,
  expire: 604800,
} as const;

export type NavbarLatestRanking = {
  division: string;
  week: number;
  year: number;
};

export type NavbarLatestRankingsBySport = {
  sport: string;
  divisions: NavbarLatestRanking[];
};

export {
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsDivisionWeeksTag,
  rankingsDivisionYearsTag,
  rankingsInvalidationTags,
  rankingsSportTag,
  rankingsWeekTag,
};

/**
 * Latest rankings week pointers for the navbar.
 * Own `"use cache"` scope so Sanity publishes do not re-hit Postgres.
 * Publish busts {@link RANKINGS_CACHE_TAG}; 1h revalidate is a safety net.
 */
export async function getCachedNavbarLatestRankings(): Promise<
  NavbarLatestRankingsBySport[]
> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);

  const [latestFootballRankings, latestMensBasketballRankings] =
    await Promise.all([
      getLatestFinalRankingsBySportSlug("football"),
      getLatestFinalRankingsBySportSlug("mens-basketball"),
    ]);

  return [
    { sport: "football", divisions: latestFootballRankings },
    { sport: "mens-basketball", divisions: latestMensBasketballRankings },
  ];
}

export async function getCachedYearsThatHaveVotes({
  division,
}: {
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionYearsTag(division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getYearsThatHaveVotes({ division });
}

export async function getCachedWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number;
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionWeeksTag(division, year));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getWeeksThatHaveVotes({ year, division });
}

export async function getCachedFinalRankings({
  year,
  week,
  division,
  sport,
}: {
  year: number;
  week: number;
  division: string;
  sport: SportParam;
}) {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
    rankingsWeekTag(sport, division, year, week),
  );
  cacheLife(RANKINGS_CACHE_LIFE);
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedLatestFinalRankings({
  division,
}: {
  division: string;
}) {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsDivisionYearsTag(division));
  cacheLife(RANKINGS_CACHE_LIFE);
  return getLatestFinalRankings({ division });
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);
  return getRankedSchoolSanityIds();
}
