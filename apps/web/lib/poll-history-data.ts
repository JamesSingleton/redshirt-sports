import {
  formatWeekSegment,
  type SportParam,
  weekTitle,
} from "@redshirt-sports/clients/espn";
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

export type PollHistoryTeamRow = {
  teamId: string;
  teamName: string;
  teamShortName: string;
  teamSlug: string | null;
  /** Rank per week index (parallel to `weeks`), null when unranked */
  ranks: Array<number | null>;
  high: number | null;
  low: number | null;
  weeksRanked: number;
};

export type PollHistorySeason = {
  year: number;
  weeks: PollWeekNumberOne[];
  teams: PollHistoryTeamRow[];
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

  type TeamMeta = {
    teamName: string;
    teamShortName: string;
    teamSlug: string | null;
  };

  type WeekBuild = PollWeekNumberOne & {
    ranksByTeamId: Map<string, number>;
  };

  const teamMeta = new Map<string, TeamMeta>();

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
      const ranksByTeamId = new Map<string, number>();
      for (const team of rankings) {
        if (team.rank != null) {
          ranksByTeamId.set(team._id, team.rank);
          if (!teamMeta.has(team._id)) {
            teamMeta.set(team._id, {
              teamName: team.name,
              teamShortName: team.shortName,
              teamSlug: team.slug ?? null,
            });
          }
        }
      }
      return {
        week,
        weekSegment,
        weekLabel: weekTitle(week),
        teamId: numberOne._id,
        teamName: numberOne.name,
        teamShortName: numberOne.shortName,
        points: numberOne._points,
        pollHref: `/college/${sport}/rankings/${division}/${year}/${weekSegment}`,
        ranksByTeamId,
      } satisfies WeekBuild;
    }),
  );

  const builtWeeks = weekResults
    .filter(
      (result): result is PromiseFulfilledResult<WeekBuild | null> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value)
    .filter((row): row is WeekBuild => row != null)
    .sort((a, b) => a.week - b.week);

  if (!builtWeeks.length) {
    return null;
  }

  const weeks: PollWeekNumberOne[] = builtWeeks.map(
    ({ ranksByTeamId: _ranks, ...week }) => week,
  );

  const teams: PollHistoryTeamRow[] = [...teamMeta.entries()]
    .map(([teamId, meta]) => {
      const ranks = builtWeeks.map((weekRow) => {
        const rank = weekRow.ranksByTeamId.get(teamId);
        return rank ?? null;
      });
      const ranked = ranks.filter((value): value is number => value != null);
      return {
        teamId,
        teamName: meta.teamName,
        teamShortName: meta.teamShortName,
        teamSlug: meta.teamSlug,
        ranks,
        high: ranked.length ? Math.min(...ranked) : null,
        low: ranked.length ? Math.max(...ranked) : null,
        weeksRanked: ranked.length,
      };
    })
    .sort((a, b) => a.teamShortName.localeCompare(b.teamShortName));

  return { year, weeks, teams };
}

export async function getCachedPollHistoryYears(division: string) {
  return getCachedYearsThatHaveVotes({ division });
}
