import {
  fetchPollForDivision,
  getPollsForSport,
  type HomePollData,
} from "@/lib/home-rankings";
import { mapNewsDivisionToRankingDivision } from "@/lib/college-news-config";

const FOOTBALL_TAB_ORDER = ["fcs", "fbs"] as const;

export type CollegeNewsPollWidgetData = {
  sportSlug: string;
  polls: Record<string, HomePollData | null>;
  pinnedDivision?: string;
  tabOrder?: string[];
};

export { mapNewsDivisionToRankingDivision };

export async function getSportPollWidgetData(
  sportSlug: string,
): Promise<CollegeNewsPollWidgetData | null> {
  const polls = await getPollsForSport(sportSlug);
  const availableKeys = Object.keys(polls);
  if (availableKeys.length === 0) {
    return null;
  }

  return {
    sportSlug,
    polls,
    tabOrder:
      sportSlug === "football"
        ? FOOTBALL_TAB_ORDER.filter((key) => polls[key] != null)
        : availableKeys,
  };
}

export async function getDivisionPollWidgetData(
  sportSlug: string,
  newsDivisionSlug: string,
): Promise<CollegeNewsPollWidgetData | null> {
  const rankingDivision = mapNewsDivisionToRankingDivision(
    sportSlug,
    newsDivisionSlug,
  );
  if (!rankingDivision) {
    return null;
  }

  const poll = await fetchPollForDivision(rankingDivision);
  if (!poll) {
    return null;
  }

  return {
    sportSlug,
    polls: { [rankingDivision]: poll },
    pinnedDivision: rankingDivision,
  };
}
