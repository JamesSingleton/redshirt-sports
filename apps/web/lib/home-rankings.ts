import { getLatestFinalRankingsBySportSlug } from "@redshirt-sports/db/queries";

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

async function fetchPollFromLatest({
  division,
  year,
  week,
  sportSlug,
}: {
  division: string;
  year: number;
  week: number;
  sportSlug: string;
}): Promise<HomePollData | null> {
  try {
    const { rankings } = await getCachedFinalRankings({
      division,
      year,
      week,
      sport: sportSlug,
    });

    const teams = rankings
      .filter((team) => team.rank && team.rank <= 25)
      .slice(0, 10)
      .map((team) => ({
        _id: team._id,
        rank: team.rank as number,
        shortName: team.shortName as string,
        name: team.name as string,
        abbreviation: team.abbreviation as string,
        firstPlaceVotes: (team.firstPlaceVotes ?? 0) as number,
        image: team.image,
      }));

    if (teams.length === 0) return null;

    return {
      division,
      year,
      week,
      teams,
    };
  } catch {
    return null;
  }
}

/** Single-division poll fetch (college news sidebars). Prefer getPollsForSport when loading a sport. */
export async function fetchPollForDivision(
  division: string,
  sportSlug = "football",
): Promise<HomePollData | null> {
  const latestRankings = await getLatestFinalRankingsBySportSlug(sportSlug);
  const latest = latestRankings.find((row) => row.division === division);
  if (!latest) return null;
  return fetchPollFromLatest({ ...latest, sportSlug });
}

export async function getHomeFootballPolls(): Promise<{
  fbs: HomePollData | null;
  fcs: HomePollData | null;
}> {
  const sportSlug = "football";
  const latestRankings = await getLatestFinalRankingsBySportSlug(sportSlug);
  const byDivision = new Map(
    latestRankings.map((row) => [row.division, row] as const),
  );

  const [fbs, fcs] = await Promise.all([
    byDivision.has("fbs")
      ? fetchPollFromLatest({ ...byDivision.get("fbs")!, sportSlug })
      : Promise.resolve(null),
    byDivision.has("fcs")
      ? fetchPollFromLatest({ ...byDivision.get("fcs")!, sportSlug })
      : Promise.resolve(null),
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
    latestRankings.map(async (latest) => {
      const poll = await fetchPollFromLatest({ ...latest, sportSlug });
      return poll ? ([latest.division, poll] as const) : null;
    }),
  );

  return Object.fromEntries(
    pollEntries.filter(
      (entry): entry is [string, HomePollData] => entry != null,
    ),
  );
}
