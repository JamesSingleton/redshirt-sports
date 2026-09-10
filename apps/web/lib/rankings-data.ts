import {
  getFinalRankingsForWeekAndYear,
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
  cacheLife({ revalidate: 3600 });

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
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  return getRankedSchoolSanityIds();
}
