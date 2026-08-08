import { SEASON_TYPE_CODES } from "@redshirt-sports/db/schema";
import {
  buildSchoolRankingHistory,
  RANKING_HISTORY_RV_CHART_VALUE,
  type RankingHistoryPublishedWeek,
  type RankingHistorySchoolAppearance,
  rankingHistoryPointToChartValue,
} from "@redshirt-sports/db/utils/school-ranking-history";

const pollId = "poll-fcs";

function appearance(
  overrides: Partial<RankingHistorySchoolAppearance> & {
    year: number;
    seasonType: number;
    weekNumber: number;
    rank: number | null;
    points: number;
  },
): RankingHistorySchoolAppearance {
  return {
    pollId,
    pollSlug: "fcs",
    pollName: "FCS",
    sportSlug: "football",
    sportTitle: "Football",
    weekText: null,
    ...overrides,
  };
}

function week(
  overrides: Partial<RankingHistoryPublishedWeek> & {
    year: number;
    seasonType: number;
    weekNumber: number;
  },
): RankingHistoryPublishedWeek {
  return {
    pollId,
    weekText: null,
    ...overrides,
  };
}

describe("buildSchoolRankingHistory", () => {
  it("returns empty polls when there are no appearances", () => {
    expect(buildSchoolRankingHistory([], [])).toEqual({ polls: [] });
  });

  it("fills ranked, RV, and out weeks for a season", () => {
    const appearances = [
      appearance({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.PRESEASON,
        weekNumber: 1,
        rank: 12,
        points: 200,
      }),
      appearance({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 2,
        rank: null,
        points: 15,
      }),
    ];
    const publishedWeeks = [
      week({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.PRESEASON,
        weekNumber: 1,
      }),
      week({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 1,
      }),
      week({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 2,
      }),
      week({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.POSTSEASON,
        weekNumber: 1,
      }),
    ];

    const { polls } = buildSchoolRankingHistory(appearances, publishedWeeks);
    expect(polls).toHaveLength(1);
    const series = polls[0]!.seriesByYear[2025]!;
    expect(series.map((p) => p.status)).toEqual(["ranked", "out", "rv", "out"]);
    expect(series[0]).toMatchObject({
      legacyWeek: 0,
      label: "Preseason",
      rank: 12,
      points: 200,
    });
    expect(series[1]).toMatchObject({
      legacyWeek: 1,
      status: "out",
      points: null,
    });
    expect(series[2]).toMatchObject({
      legacyWeek: 2,
      status: "rv",
      rank: null,
      points: 15,
    });
    expect(series[3]).toMatchObject({
      legacyWeek: 999,
      label: "Final Rankings",
      status: "out",
    });
  });

  it("treats ordinal ranks above 25 as receiving votes", () => {
    const appearances = [
      appearance({
        year: 2024,
        seasonType: SEASON_TYPE_CODES.PRESEASON,
        weekNumber: 1,
        rank: 38,
        points: 12,
      }),
    ];
    const publishedWeeks = [
      week({
        year: 2024,
        seasonType: SEASON_TYPE_CODES.PRESEASON,
        weekNumber: 1,
      }),
    ];

    const { polls } = buildSchoolRankingHistory(appearances, publishedWeeks);
    expect(polls[0]!.seriesByYear[2024]![0]).toMatchObject({
      legacyWeek: 0,
      label: "Preseason",
      status: "rv",
      rank: null,
      points: 12,
    });
  });

  it("uses rankings dropdown week titles even when ESPN week text differs", () => {
    const appearances = [
      appearance({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.POSTSEASON,
        weekNumber: 1,
        weekText: "Bowls",
        rank: 3,
        points: 300,
      }),
    ];
    const publishedWeeks = [
      week({
        year: 2025,
        seasonType: SEASON_TYPE_CODES.POSTSEASON,
        weekNumber: 1,
        weekText: "Bowls",
      }),
    ];

    const { polls } = buildSchoolRankingHistory(appearances, publishedWeeks);
    expect(polls[0]!.seriesByYear[2025]![0]).toMatchObject({
      legacyWeek: 999,
      label: "Final Rankings",
      status: "ranked",
      rank: 3,
    });
  });

  it("groups multiple polls and sorts years descending", () => {
    const appearances = [
      appearance({
        year: 2024,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 1,
        rank: 5,
        points: 100,
      }),
      appearance({
        pollId: "poll-mbb",
        pollSlug: "d1",
        pollName: "Division I",
        sportSlug: "mens-basketball",
        sportTitle: "Men's Basketball",
        year: 2025,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 3,
        rank: 8,
        points: 90,
      }),
    ];
    const publishedWeeks = [
      week({
        year: 2024,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 1,
      }),
      week({
        pollId: "poll-mbb",
        year: 2025,
        seasonType: SEASON_TYPE_CODES.REGULAR_SEASON,
        weekNumber: 3,
      }),
    ];

    const { polls } = buildSchoolRankingHistory(appearances, publishedWeeks);
    expect(polls.map((p) => p.pollId)).toEqual(["poll-mbb", pollId]);
    expect(polls[0]!.years).toEqual([2025]);
    expect(polls[1]!.years).toEqual([2024]);
  });
});

describe("rankingHistoryPointToChartValue", () => {
  it("maps ranked, RV, and out statuses", () => {
    expect(rankingHistoryPointToChartValue({ status: "ranked", rank: 7 })).toBe(
      7,
    );
    expect(rankingHistoryPointToChartValue({ status: "rv", rank: null })).toBe(
      RANKING_HISTORY_RV_CHART_VALUE,
    );
    expect(
      rankingHistoryPointToChartValue({ status: "out", rank: null }),
    ).toBeNull();
  });
});
