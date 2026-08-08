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
 * Latest rankings for the navbar. Call only from a `'use cache'` parent
 * (e.g. CachedNavbarServer) — no nested `"use cache"` here.
 */
export async function getCachedNavbarLatestRankings(): Promise<
  NavbarLatestRankingsBySport[]
> {
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
  return getFinalRankingsForWeekAndYear({ year, week, division, sport });
}

export async function getCachedSchoolRankingHistory(
  sanityId: string,
): Promise<SchoolRankingHistory> {
  "use cache";
  return getSchoolRankingHistory(sanityId);
}

export async function getCachedSchoolHasPollRankings(
  sanityId: string,
): Promise<boolean> {
  "use cache";
  return schoolHasPollRankings(sanityId);
}

export async function getCachedRankedSchoolSanityIds(): Promise<string[]> {
  "use cache";
  return getRankedSchoolSanityIds();
}
