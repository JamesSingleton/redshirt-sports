import {
  formatWeekSegment,
  type SportParam,
  weekTitle,
} from "@redshirt-sports/clients/espn";

import {
  getCachedFinalRankingsForLegacyWeeksInYear,
  getCachedWeeksThatHaveVotes,
  getCachedYearsThatHaveVotes,
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
  const legacyWeeks = weeksWithVotes.map(({ week }) => week);
  const rankingsByWeek = await getCachedFinalRankingsForLegacyWeeksInYear({
    year,
    division,
    sport,
    legacyWeeks,
  });

  const builtWeeks: WeekBuild[] = [];
  for (const { week } of weeksWithVotes) {
    const weekRankings = rankingsByWeek.get(week);
    if (!weekRankings) {
      continue;
    }

    const numberOne = weekRankings.rankings.find((team) => team.rank === 1);
    if (!numberOne) {
      continue;
    }

    const weekSegment = formatWeekSegment(week);
    const ranksByTeamId = new Map<string, number>();
    for (const team of weekRankings.rankings) {
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

    builtWeeks.push({
      week,
      weekSegment,
      weekLabel: weekTitle(week),
      teamId: numberOne._id,
      teamName: numberOne.name,
      teamShortName: numberOne.shortName,
      points: numberOne._points,
      pollHref: `/college/${sport}/rankings/${division}/${year}/${weekSegment}`,
      ranksByTeamId,
    });
  }

  builtWeeks.sort((a, b) => a.week - b.week);

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
