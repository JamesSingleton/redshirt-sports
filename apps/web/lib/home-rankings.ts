import {
  getLatestFinalRankings,
  getLatestFinalRankingsBySportSlug,
} from "@redshirt-sports/db/queries";

import { getCachedFinalRankings } from "@/lib/rankings-data";

export type HomePollTeam = {
  _id: string;
  rank: number;
  shortName: string;
  name: string;
  abbreviation: string;
  firstPlaceVotes: number;
  image: any;
};

export type HomePollData = {
  division: string;
  year: number;
  week: number;
  teams: HomePollTeam[];
};

export async function fetchPollForDivision(
  division: string,
): Promise<HomePollData | null> {
  const latest = await getLatestFinalRankings({ division });
  if (!latest) return null;

  try {
    const { rankings } = await getCachedFinalRankings({
      division,
      year: latest.year,
      week: latest.week,
    });

    const teams = rankings
      .filter((team) => team.rank && team.rank <= 25)
      .slice(0, 10)
      .map((team) => ({
        _id: team._id,
        rank: team.rank,
        shortName: team.shortName,
        name: team.name,
        abbreviation: team.abbreviation,
        firstPlaceVotes: team.firstPlaceVotes,
        image: team.image,
      }));

    if (teams.length === 0) return null;

    return {
      division,
      year: latest.year,
      week: latest.week,
      teams,
    };
  } catch {
    return null;
  }
}

export async function getHomeFootballPolls(): Promise<{
  fbs: HomePollData | null;
  fcs: HomePollData | null;
}> {
  const [fbs, fcs] = await Promise.all([
    fetchPollForDivision("fbs"),
    fetchPollForDivision("fcs"),
  ]);

  return { fbs, fcs };
}

export async function getPollsForSport(
  sportSlug: string,
): Promise<Record<string, HomePollData>> {
  const latestRankings = await getLatestFinalRankingsBySportSlug(sportSlug);
  if (!latestRankings.length) {
    return {};
  }

  const pollEntries = await Promise.all(
    latestRankings.map(async ({ division }) => {
      const poll = await fetchPollForDivision(division);
      return poll ? ([division, poll] as const) : null;
    }),
  );

  return Object.fromEntries(
    pollEntries.filter(
      (entry): entry is [string, HomePollData] => entry != null,
    ),
  );
}
