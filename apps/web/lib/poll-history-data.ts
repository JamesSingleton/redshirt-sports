import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import { cacheLife, cacheTag } from "next/cache";

import {
  getCachedFinalRankings,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
  RANKINGS_CACHE_LIFE,
  RANKINGS_CACHE_TAG,
  rankingsDivisionTag,
  rankingsSportTag,
} from "@/lib/rankings-data";
import type { SportParam } from "@/utils/espn";
import { weekTitle } from "@/utils/espn";

export type PollWeekNumberOne = {
  week: number;
  weekSegment: string;
  weekLabel: string;
  teamId: string;
  teamName: string;
  teamShortName: string;
  points: number;
  pollHref: string;
};

export type PollHistorySeason = {
  year: number;
  weeks: PollWeekNumberOne[];
};

export async function getCachedPollHistoryForDivision({
  sport,
  division,
  year,
}: {
  sport: SportParam;
  division: string;
  year: number;
}): Promise<PollHistorySeason | null> {
  "use cache";
  cacheTag(
    RANKINGS_CACHE_TAG,
    rankingsSportTag(sport),
    rankingsDivisionTag(sport, division),
  );
  cacheLife(RANKINGS_CACHE_LIFE);

  const weeksWithVotes = await getCachedWeeksThatHaveVotes({
    year,
    division,
  });
  if (!weeksWithVotes.length) {
    return null;
  }

  const weekResults = await Promise.allSettled(
    weeksWithVotes.map(async ({ week }) => {
      const { rankings } = await getCachedFinalRankings({
        year,
        week,
        division,
        sport,
      });
      const numberOne = rankings.find((t) => t.rank === 1);
      if (!numberOne) {
        return null;
      }
      const weekSegment = formatWeekSegment(week);
      return {
        week,
        weekSegment,
        weekLabel: weekTitle(week),
        teamId: numberOne._id,
        teamName: numberOne.name,
        teamShortName: numberOne.shortName,
        points: numberOne._points,
        pollHref: `/college/${sport}/rankings/${division}/${year}/${weekSegment}`,
      } satisfies PollWeekNumberOne;
    }),
  );

  const weeks = weekResults
    .filter(
      (result): result is PromiseFulfilledResult<PollWeekNumberOne | null> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter((row): row is PollWeekNumberOne => row != null)
    .sort((a, b) => a.week - b.week);

  if (!weeks.length) {
    return null;
  }

  return { year, weeks };
}

export async function getCachedPollHistoryYears(division: string) {
  return getCachedYearsThatHaveVotes({ division });
}
