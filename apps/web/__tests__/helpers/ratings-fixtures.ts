import type { PublishedTeamSheetRow } from "@redshirt-sports/db/ratings";
import type { ReactElement, ReactNode } from "react";

import type { RatingsSheetsModel, RatingsTeamModel } from "@/lib/ratings/data";

const record = (wins: number, losses: number, ties = 0) => ({
  wins,
  losses,
  ties,
});

export const config = {
  marginTransform: { type: "cap" as const, cap: 28 },
  overtimeMargin: 3,
  priorGames: 2,
  priorCarryover: 0.95,
  newcomerPrior: -21,
  homeFieldPrior: 0,
  homeFieldPriorGames: 20,
  powerHalfLifeWeeks: null,
  sigma: 14.6,
  benchmark: 8.42,
  minRankedGames: 3,
  provisionalMinAverageGames: 4,
  tierFloors: [0.5, 0.25, 0.1] as [number, number, number],
  posteriorSamples: 1000,
  seed: 1,
};

export function teamRow(
  overrides: Partial<PublishedTeamSheetRow> = {},
): PublishedTeamSheetRow {
  return {
    schoolId: "msu",
    name: "Montana State",
    fullName: "Montana State University",
    abbreviation: "MSU",
    slug: "montana-state-bobcats",
    image: null,
    conference: "Big Sky",
    power: 26,
    powerLow: 22,
    powerHigh: 30,
    powerRank: 1,
    powerRankLow: 1,
    powerRankHigh: 3,
    strength: 25.5,
    sor: 0.0004,
    sorRank: 1,
    sorRankLow: 1,
    sorRankHigh: 2,
    sos: 0.494,
    sosRank: 12,
    sosRankLow: 8,
    sosRankHigh: 18,
    sov: 0.488,
    sovRank: 3,
    sol: 0.7,
    recordSos: 0.63,
    recordSosRank: 2,
    owp: 0.61,
    oowp: 0.55,
    averageOpponentStrength: 3.2,
    remainingSos: null,
    fullSeasonSos: 0.494,
    poolRecord: record(14, 1),
    overallRecord: record(14, 2),
    poolGames: 15,
    tierRecords: [record(6, 1), record(4, 0), record(2, 0), record(2, 0)],
    isProvisional: false,
    explanation: {
      games: [
        {
          gameId: "g1",
          weekIndex: 2,
          opponentId: "ndsu",
          opponentName: "North Dakota State",
          site: "away",
          pointsFor: 35,
          pointsAgainst: 34,
          overtime: true,
          result: "win",
          opponentStrength: 27.1,
          opponentSiteEdge: 1.4,
          p: 0.93,
          tier: 1,
          opponentRecord: record(12, 1),
          powerWeight: 1,
          performance: 30.2,
        },
        {
          gameId: "g2",
          weekIndex: 3,
          opponentId: "x",
          opponentName: "Not In Table",
          site: "neutral",
          pointsFor: 10,
          pointsAgainst: 17,
          overtime: false,
          result: "loss",
          opponentStrength: -2,
          opponentSiteEdge: 0,
          p: 0.3,
          tier: 2,
          opponentRecord: record(3, 8),
          powerWeight: 1,
          performance: -7,
        },
        {
          gameId: "g3",
          weekIndex: 4,
          opponentId: "ndsu",
          opponentName: "North Dakota State",
          site: "home",
          pointsFor: 21,
          pointsAgainst: 21,
          overtime: false,
          result: "tie",
          opponentStrength: 0,
          opponentSiteEdge: -1.4,
          p: 0.2,
          tier: 3,
          opponentRecord: record(12, 1),
          powerWeight: 1,
          performance: 0,
        },
      ],
      remaining: [
        {
          gameId: "r1",
          weekIndex: 12,
          opponentId: "ndsu",
          opponentName: "North Dakota State",
          site: "home",
          opponentStrength: 27,
          p: 0.81,
        },
      ],
      excluded: [
        {
          gameId: "e1",
          weekIndex: 1,
          opponentName: "Oregon",
          opponentLevel: "FBS",
          site: "away",
          pointsFor: 14,
          pointsAgainst: 59,
          result: "loss",
          reason: "opponent_not_in_pool",
        },
        {
          gameId: "e2",
          weekIndex: 1,
          opponentName: "Some D-II",
          opponentLevel: "DII",
          site: "home",
          pointsFor: 50,
          pointsAgainst: 0,
          result: "win",
          reason: "opponent_not_in_pool",
        },
        {
          gameId: "e3",
          weekIndex: 1,
          opponentName: "Draw U",
          opponentLevel: "Non-NCAA",
          site: "neutral",
          pointsFor: 7,
          pointsAgainst: 7,
          result: "tie",
          reason: "opponent_not_in_pool",
        },
        {
          gameId: "e4",
          weekIndex: 1,
          opponentName: "Cancelled",
          opponentLevel: null,
          site: "home",
          pointsFor: null,
          pointsAgainst: null,
          result: null,
          reason: "opponent_not_in_pool",
        },
      ],
      sorDistribution: [0.1, 0.9],
    },
    ...overrides,
  };
}

export function rows(): PublishedTeamSheetRow[] {
  return [
    teamRow(),
    teamRow({
      schoolId: "ndsu",
      name: "North Dakota State",
      slug: "north-dakota-state-bison",
      sorRank: 2,
      powerRank: 2,
      sosRank: null,
      sovRank: null,
      recordSosRank: null,
      sos: 0.4,
      sor: 0.2,
      remainingSos: 0.5,
      power: -1,
      recordSos: null,
      owp: null,
      oowp: null,
      poolRecord: record(12, 1, 1),
      explanation: {
        games: [],
        remaining: [],
        excluded: [],
        sorDistribution: [1],
      },
    }),
    teamRow({
      schoolId: "new",
      name: "Newcomer",
      slug: null,
      conference: null,
      sorRank: null,
      sorRankLow: null,
      sorRankHigh: null,
      sor: null,
      sos: null,
      sov: null,
      sosRank: null,
      sovRank: null,
      recordSosRank: null,
      powerRank: 3,
      power: 0,
      remainingSos: 0.2,
      poolGames: 2,
      isProvisional: true,
    }),
  ];
}

export function weekModel(
  overrides: Partial<RatingsSheetsModel> = {},
): RatingsSheetsModel {
  const weeks = [
    {
      runId: "run-post",
      year: 2025,
      seasonType: 3,
      number: 1,
      segment: "postseason",
      label: "Postseason",
      publishedAt: "2026-01-06T12:00:00.000Z",
      throughAt: "2026-01-05T23:00:00.000Z",
    },
    {
      runId: "run-16",
      year: 2025,
      seasonType: 2,
      number: 16,
      segment: "16",
      label: "Week 16",
      publishedAt: "2025-12-14T12:00:00.000Z",
      throughAt: null,
    },
    {
      runId: "run-2024",
      year: 2024,
      seasonType: 3,
      number: 1,
      segment: "postseason",
      label: "Postseason",
      publishedAt: "2025-01-07T12:00:00.000Z",
      throughAt: null,
    },
  ];
  return {
    pool: {
      id: "pool-1",
      slug: "fcs",
      name: "FCS",
      sportSlug: "football",
      sportName: "Football",
      methodVersion: 1,
      config,
    },
    week: weeks[0]!,
    weeks,
    run: {
      id: "run-post",
      methodVersion: 1,
      params: config,
      diagnostics: {
        homeField: 1.4,
        powerHomeField: 1.4,
        residualSd: 11.6,
        effectiveParameters: 106,
        poolGamesPlayed: 691,
        averagePoolGames: 10.7,
        connected: true,
        components: 1,
        leagueProvisional: false,
      },
      checksum: "abcdef0123456789",
      gameCount: 691,
      computedAt: "2026-01-06T11:00:00.000Z",
    },
    rows: rows(),
    isLatest: true,
    ...overrides,
  };
}

/** Pages wrap their async body in <Suspense>; resolve it so the body can be rendered. */
export async function resolveSuspense(element: ReactNode): Promise<ReactNode> {
  const suspense = element as ReactElement<{ children: ReactElement }>;
  const inner = suspense.props.children;
  const component = inner.type as (props: unknown) => Promise<ReactNode>;
  return component(inner.props);
}

/** A team sheet's model: the week without its table, plus every team's slug. */
export function teamModel(
  overrides: Partial<RatingsSheetsModel> = {},
): RatingsTeamModel & { rows: RatingsSheetsModel["rows"] } {
  const model = weekModel(overrides);
  return {
    ...model,
    teams: model.rows.map((row) => ({
      schoolId: row.schoolId,
      slug: row.slug,
    })),
  };
}
