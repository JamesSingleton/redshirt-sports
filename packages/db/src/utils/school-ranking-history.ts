import { seasonTypeAndNumberToLegacyWeek, weekTitle } from "./week-mapping";

export type RankingHistoryPointStatus = "ranked" | "rv" | "out";

export type RankingHistoryPoint = {
  legacyWeek: number;
  label: string;
  rank: number | null;
  points: number | null;
  status: RankingHistoryPointStatus;
};

export type RankingHistoryPoll = {
  pollId: string;
  pollSlug: string;
  pollName: string;
  sportSlug: string;
  sportTitle: string;
  years: number[];
  seriesByYear: Record<number, RankingHistoryPoint[]>;
};

export type SchoolRankingHistory = {
  polls: RankingHistoryPoll[];
};

/** Raw week that had published rankings for a poll/year. */
export type RankingHistoryPublishedWeek = {
  pollId: string;
  year: number;
  seasonType: number;
  weekNumber: number;
  weekText: string | null;
};

/** A school's appearance in a published poll week. */
export type RankingHistorySchoolAppearance = {
  pollId: string;
  pollSlug: string;
  pollName: string;
  sportSlug: string;
  sportTitle: string;
  year: number;
  seasonType: number;
  weekNumber: number;
  weekText: string | null;
  rank: number | null;
  points: number;
};

/** Published Top 25 cutoff. Older publishes kept ordinal ranks > 25 for ORV. */
export const TOP_25_RANK = 25;

export function isTop25Rank(rank: number | null | undefined): rank is number {
  return typeof rank === "number" && rank >= 1 && rank <= TOP_25_RANK;
}

function weekSortKey(seasonType: number, weekNumber: number): number {
  return seasonType * 1000 + weekNumber;
}

function appearanceKey(
  pollId: string,
  year: number,
  seasonType: number,
  weekNumber: number,
): string {
  return `${pollId}:${year}:${seasonType}:${weekNumber}`;
}

/**
 * Build the UI-facing ranking history from DB rows.
 * `publishedWeeks` should include every week with rankings for each
 * (poll, year) the school appeared in so "out" gaps can be filled.
 */
export function buildSchoolRankingHistory(
  appearances: RankingHistorySchoolAppearance[],
  publishedWeeks: RankingHistoryPublishedWeek[],
): SchoolRankingHistory {
  if (appearances.length === 0) {
    return { polls: [] };
  }

  const appearanceByWeek = new Map(
    appearances.map((row) => [
      appearanceKey(row.pollId, row.year, row.seasonType, row.weekNumber),
      row,
    ]),
  );

  const pollMeta = new Map<
    string,
    {
      pollId: string;
      pollSlug: string;
      pollName: string;
      sportSlug: string;
      sportTitle: string;
      years: Set<number>;
      maxSort: number;
    }
  >();

  for (const row of appearances) {
    const existing = pollMeta.get(row.pollId);
    const sort =
      row.year * 100_000 + weekSortKey(row.seasonType, row.weekNumber);
    if (!existing) {
      pollMeta.set(row.pollId, {
        pollId: row.pollId,
        pollSlug: row.pollSlug,
        pollName: row.pollName,
        sportSlug: row.sportSlug,
        sportTitle: row.sportTitle,
        years: new Set([row.year]),
        maxSort: sort,
      });
    } else {
      existing.years.add(row.year);
      if (sort > existing.maxSort) {
        existing.maxSort = sort;
      }
    }
  }

  const weeksByPollYear = new Map<string, RankingHistoryPublishedWeek[]>();
  for (const week of publishedWeeks) {
    const key = `${week.pollId}:${week.year}`;
    const list = weeksByPollYear.get(key);
    if (list) {
      list.push(week);
    } else {
      weeksByPollYear.set(key, [week]);
    }
  }

  const polls: RankingHistoryPoll[] = [...pollMeta.values()]
    .sort((a, b) => b.maxSort - a.maxSort)
    .map((meta) => {
      const years = [...meta.years].sort((a, b) => b - a);
      const seriesByYear: Record<number, RankingHistoryPoint[]> = {};

      for (const year of years) {
        const weeks = [
          ...(weeksByPollYear.get(`${meta.pollId}:${year}`) ?? []),
        ].sort(
          (a, b) =>
            weekSortKey(a.seasonType, a.weekNumber) -
            weekSortKey(b.seasonType, b.weekNumber),
        );

        seriesByYear[year] = weeks.map((week) => {
          const legacyWeek = seasonTypeAndNumberToLegacyWeek(
            week.seasonType,
            week.weekNumber,
          );
          // Match rankings page dropdown labels (Preseason / Week N / Final Rankings).
          const label = weekTitle(legacyWeek);
          const appearance = appearanceByWeek.get(
            appearanceKey(
              week.pollId,
              week.year,
              week.seasonType,
              week.weekNumber,
            ),
          );

          if (!appearance) {
            return {
              legacyWeek,
              label,
              rank: null,
              points: null,
              status: "out" as const,
            };
          }

          // ORV rows may be null or a legacy ordinal > 25 — neither is a Top 25 rank.
          if (!isTop25Rank(appearance.rank)) {
            return {
              legacyWeek,
              label,
              rank: null,
              points: appearance.points,
              status: "rv" as const,
            };
          }

          return {
            legacyWeek,
            label,
            rank: appearance.rank,
            points: appearance.points,
            status: "ranked" as const,
          };
        });
      }

      return {
        pollId: meta.pollId,
        pollSlug: meta.pollSlug,
        pollName: meta.pollName,
        sportSlug: meta.sportSlug,
        sportTitle: meta.sportTitle,
        years,
        seriesByYear,
      };
    });

  return { polls };
}

/** Map a history point to a chart y-value (1–25 ranked, ~29 = RV lane, null = out). */
export const RANKING_HISTORY_RV_CHART_VALUE = 29;

/** Y-axis max — leaves room under the Top 25 / RV divider so RV dots aren't crushed. */
export const RANKING_HISTORY_CHART_DOMAIN_MAX = 30;

export function rankingHistoryPointToChartValue(
  point: Pick<RankingHistoryPoint, "status" | "rank">,
): number | null {
  if (point.status === "out") return null;
  if (point.status === "rv") return RANKING_HISTORY_RV_CHART_VALUE;
  return point.rank;
}
