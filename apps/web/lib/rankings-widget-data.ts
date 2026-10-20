import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { cacheLife, cacheTag } from "next/cache";

import {
  getCachedFinalRankings,
  getCachedLatestFinalRankings,
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

export const WIDGET_DIVISIONS = ["fcs", "fbs", "d2", "d3"] as const;
export type WidgetDivision = (typeof WIDGET_DIVISIONS)[number];

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
  division: WidgetDivision;
  label: string;
  week: number;
  year: number;
  weekHref: string;
  ballotsHref: string;
  teams: RankingsWidgetTeam[];
};

const DIVISION_LABEL: Record<WidgetDivision, string> = {
  fcs: "FCS",
  fbs: "FBS",
  d2: "D-II",
  d3: "D-III",
};

async function loadWidgetPoll(
  division: WidgetDivision,
  sport: SportParam = "football",
): Promise<RankingsWidgetPoll | null> {
  const latest = await getCachedLatestFinalRankings({ division });
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

  const top = current.rankings
    .filter((team) => team.rank != null)
    .slice(0, 10);

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
    label: DIVISION_LABEL[division],
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
      movement: getMovement(
        team.rank,
        previousRankById?.get(team._id),
      ),
    })),
  };
}

export async function getCachedRankingsWidgetPolls(): Promise<
  RankingsWidgetPoll[]
> {
  "use cache";
  cacheTag(RANKINGS_CACHE_TAG);
  cacheLife(RANKINGS_CACHE_LIFE);

  const polls = await Promise.all(
    WIDGET_DIVISIONS.map((division) => loadWidgetPoll(division)),
  );

  return polls.filter((poll): poll is RankingsWidgetPoll => poll !== null);
}
