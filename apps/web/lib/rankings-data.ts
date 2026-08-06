import {
  getFinalRankingsForWeekAndYear,
  getLatestFinalRankingsBySportSlug,
  getWeeksThatHaveVotes,
  getYearsThatHaveVotes,
} from "@redshirt-sports/db/queries";

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

export async function getCachedNavbarLatestRankings(): Promise<
  NavbarLatestRankingsBySport[]
> {
  "use cache";
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
