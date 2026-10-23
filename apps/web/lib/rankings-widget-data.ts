import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { rankingsSportTag } from "@redshirt-sports/db/rankings-cache-tags";
import { cacheLife, cacheTag } from "next/cache";

import {
  getCachedFinalRankings,
  getCachedLatestFinalRankingsBySportSlug,
  getCachedWeeksThatHaveVotes,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
} from "@/lib/rankings-data";
import {
  buildRankBySchoolId,
  getMovement,
  getPreviousWeek,
  type Movement,
} from "@/lib/rankings-movement";
import type { SportParam } from "@/utils/espn";

export const FOOTBALL_WIDGET_DIVISIONS = ["fcs", "fbs", "d2", "d3"] as const;
export const BASKETBALL_WIDGET_DIVISIONS = ["d1", "d2", "d3"] as const;

export type RankingsWidgetTeam = {
  _id: string;
  rank: number;
  shortName: string;
  slug: string | null;
  image: unknown;
  abbreviation: string;
  movement: Movement;
};

export type RankingsWidgetPoll = {
  division: string;
  label: string;
  week: number;
  year: number;
  weekHref: string;
  ballotsHref: string;
  teams: RankingsWidgetTeam[];
};

const DIVISION_LABEL: Record<string, string> = {
  fcs: "FCS",
  fbs: "FBS",
  d1: "D-I",
  d2: "D-II",
  d3: "D-III",
  naia: "NAIA",
};

function widgetDivisionsForSport(sport: SportParam): readonly string[] {
  switch (sport) {
    case "football":
      return FOOTBALL_WIDGET_DIVISIONS;
    case "mens-basketball":
    case "womens-basketball":
      return BASKETBALL_WIDGET_DIVISIONS;
    default:
      return [];
  }
}

export function pollDivisionLabel(division: string): string {
  return DIVISION_LABEL[division] ?? division.toUpperCase();
}

function divisionLabel(division: string): string {
  return pollDivisionLabel(division);
}

async function loadWidgetPoll(
  division: string,
  sport: SportParam,
): Promise<RankingsWidgetPoll | null> {
  const latestForSport = await getCachedLatestFinalRankingsBySportSlug(sport);
  const latest = latestForSport.find((row) => row.division === division);
  if (!latest) {
    return null;
  }

  const { year, week } = latest;
  const current = await getCachedFinalRankings({
    year,
    week,
    division,
    sport,
  });

  const top = current.rankings.filter((team) => team.rank != null).slice(0, 10);

  if (top.length === 0) {
    return null;
  }

  let previousRankById: Map<string, number | null> | null = null;
  const weeksWithVotes = await getCachedWeeksThatHaveVotes({ year, division });
  const previousWeek = getPreviousWeek(weeksWithVotes, week);
  if (previousWeek != null) {
    try {
      const previous = await getCachedFinalRankings({
        year,
        week: previousWeek,
        division,
        sport,
      });
      previousRankById = buildRankBySchoolId(previous.rankings);
    } catch {
      previousRankById = null;
    }
  }

  const weekSegment = formatWeekSegment(week);

  return {
    division,
    label: divisionLabel(division),
    week,
    year,
    weekHref: `/college/${sport}/rankings/${division}/${year}/${weekSegment}`,
    ballotsHref: `/college/${sport}/rankings/${division}/${year}/${weekSegment}/ballots`,
    teams: top.map((team) => ({
      _id: team._id,
      rank: team.rank as number,
      shortName: team.shortName ?? team.name,
      slug: team.slug,
      image: team.image,
      abbreviation: team.abbreviation ?? "",
      movement: getMovement(team.rank, previousRankById?.get(team._id)),
    })),
  };
}

export async function getCachedRankingsWidgetPolls(
  sport: SportParam = "football",
): Promise<RankingsWidgetPoll[]> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsSportTag(sport));
  cacheLife(RANKINGS_CACHE_LIFE);

  const divisions = widgetDivisionsForSport(sport);
  const polls = await Promise.all(
    divisions.map((division) => loadWidgetPoll(division, sport)),
  );

  return polls.filter((poll): poll is RankingsWidgetPoll => poll !== null);
}

export type RankingsIndexCard = {
  status: "live";
  division: string;
  label: string;
  title: string;
  poll: RankingsWidgetPoll;
  teams: RankingsWidgetTeam[];
  sport: SportParam;
};

export async function getCachedRankingsIndexCards(
  sport: SportParam,
): Promise<RankingsIndexCard[]> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG, rankingsSportTag(sport));
  cacheLife(RANKINGS_CACHE_LIFE);

  const divisions = widgetDivisionsForSport(sport);
  const cards = await Promise.all(
    divisions.map(async (division) => {
      const poll = await loadWidgetPoll(division, sport);
      const label = divisionLabel(division);
      const title = `${label} Top 25`;
      if (!poll) {
        return null;
      }
      return {
        status: "live" as const,
        division,
        label,
        title,
        poll,
        teams: poll.teams.slice(0, 5),
        sport,
      };
    }),
  );

  return cards.filter((card): card is RankingsIndexCard => card !== null);
}
