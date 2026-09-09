import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankingsBySportSlug,
  getRankedSchoolSanityIds,
  getSchoolRankingHistory,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
  schoolHasPollRankings,
} from "@redshirt-sports/db/queries";
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

/**
 * Shared Next.js cache tag for published poll rankings data.
 * Bust via web `/api/revalidate-tags` `cacheTags` when rankings are published.
 * Keep in sync with admin publish revalidation.
 */
export const POLL_RANKINGS_CACHE_TAG = "poll-rankings";

function tagPollRankingsCache() {
  cacheTag(POLL_RANKINGS_CACHE_TAG);
}

/**
 * Latest rankings week pointers for the navbar.
 * Own `"use cache"` scope so Sanity publishes do not re-hit Postgres.
 * Publish busts {@link POLL_RANKINGS_CACHE_TAG}; 1h revalidate is a safety net.
 */
export async function getCachedNavbarLatestRankings(): Promise<
  NavbarLatestRankingsBySport[]
> {
  "use cache";
  tagPollRankingsCache();
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
  tagPollRankingsCache();
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
  tagPollRankingsCache();
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
  tagPollRankingsCache();
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache";
  tagPollRankingsCache();
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache";
  tagPollRankingsCache();
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache";
  tagPollRankingsCache();
  return getRankedSchoolSanityIds();
}
