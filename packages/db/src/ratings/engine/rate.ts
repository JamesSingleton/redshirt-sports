import type { EngineConfig } from "./config";
import {
  gaussianSource,
  mean,
  mulberry32,
  normalCdf,
  poissonBinomial,
  quantile,
  recencyWeight,
  transformMargin,
} from "./math";
import {
  type FitRow,
  fitRidge,
  ratingsWithout,
  samplePosterior,
} from "./ridge";
import type {
  EngineGame,
  EngineTeam,
  ExcludedGameExplanation,
  PoolGameExplanation,
  RatingResult,
  RecordLine,
  Result,
  ScheduledGameExplanation,
  Site,
  TeamRating,
} from "./types";

type Played = {
  game: EngineGame;
  home: number;
  away: number;
  margin: number;
};

/** One team's side of a counted pool game, before explanation formatting. */
type Side = {
  played: Played;
  team: number;
  opponent: number;
  isHome: boolean;
  /** Opponent strength with every game between the two removed. */
  opponentStrength: number;
  /** Full-fit minus leave-out strength, reused to shift posterior samples. */
  looShift: number;
  result: Result;
};

const emptyRecord = (): RecordLine => ({ wins: 0, losses: 0, ties: 0 });

function isPlayed(game: EngineGame, currentWeekIndex: number): boolean {
  return (
    game.status === "final" &&
    game.homeScore != null &&
    game.awayScore != null &&
    game.weekIndex <= currentWeekIndex
  );
}

function resultFor(margin: number): Result {
  return margin > 0 ? "win" : margin < 0 ? "loss" : "tie";
}

function addResult(record: RecordLine, result: Result) {
  if (result === "win") record.wins += 1;
  else if (result === "loss") record.losses += 1;
  else record.ties += 1;
}

function winPct(record: RecordLine): number | null {
  const games = record.wins + record.losses + record.ties;
  return games === 0 ? null : (record.wins + 0.5 * record.ties) / games;
}

/** Edge the *opponent* has: +h at home, −h on the road, 0 neutral. */
function opponentEdge(
  teamIsHome: boolean,
  neutral: boolean,
  homeField: number,
) {
  if (neutral) return 0;
  return teamIsHome ? -homeField : homeField;
}

/** p = chance a benchmark team loses to this opponent at this site. */
function benchmarkLoss(
  opponentStrength: number,
  edge: number,
  config: EngineConfig,
): number {
  return normalCdf((opponentStrength + edge - config.benchmark) / config.sigma);
}

function tierFor(p: number, config: EngineConfig): 1 | 2 | 3 | 4 {
  const [first, second, third] = config.tierFloors;
  if (p >= first) return 1;
  if (p >= second) return 2;
  if (p >= third) return 3;
  return 4;
}

/**
 * Strength of record: the chance a benchmark team wins at least as many of
 * these exact games as this team did. Lower is more impressive.
 */
function strengthOfRecord(
  ps: number[],
  record: RecordLine,
): { sor: number; distribution: number[] } {
  const distribution = poissonBinomial(ps.map((p) => 1 - p));
  const needed = Math.ceil(record.wins + 0.5 * record.ties);
  let sor = 0;
  for (let k = needed; k < distribution.length; k += 1) {
    sor += distribution[k] ?? 0;
  }
  return { sor: Math.min(1, sor), distribution };
}

/** Competition ranking (1, 2, 2, 4) among eligible teams; ties broken only for display order. */
function rank(
  values: Array<number | null>,
  eligible: boolean[],
  direction: "desc" | "asc",
): Array<number | null> {
  const order = values
    .map((value, index) => ({ value, index }))
    .filter(
      (entry): entry is { value: number; index: number } =>
        entry.value != null &&
        Number.isFinite(entry.value) &&
        eligible[entry.index] === true,
    )
    .sort((a, b) =>
      direction === "desc" ? b.value - a.value : a.value - b.value,
    );
  const ranks = new Array<number | null>(values.length).fill(null);
  order.forEach((entry, position) => {
    const previous = order[position - 1];
    ranks[entry.index] =
      previous && previous.value === entry.value
        ? (ranks[previous.index] ?? position + 1)
        : position + 1;
  });
  return ranks;
}

function componentCount(teamCount: number, played: Played[]): number {
  const parent = Array.from({ length: teamCount }, (_, index) => index);
  const find = (x: number): number => {
    let root = x;
    while (parent[root] !== root) root = parent[root] ?? root;
    let node = x;
    while (parent[node] !== root) {
      const next = parent[node] ?? root;
      parent[node] = root;
      node = next;
    }
    return root;
  };
  for (const game of played) {
    const a = find(game.home);
    const b = find(game.away);
    if (a !== b) parent[a] = b;
  }
  const active = new Set<number>();
  for (const game of played) {
    active.add(game.home);
    active.add(game.away);
  }
  return new Set([...active].map(find)).size;
}

/**
 * Rate one pool as of one week. Pure: same inputs, same output, every time.
 *
 * - Strength `S`: Bayesian ridge on pool-vs-pool margins (capped, overtime damped), no recency.
 * - Power: the same fit with recency weighting, for prediction.
 * - SOS: mean over pool games of p = Φ((S_opp⁻ + edge − B)/σ), where S_opp⁻ leaves out
 *   every game between the two teams and B is a fixed #25-level benchmark.
 * - SOR: P(benchmark team wins ≥ this team's pool wins against the same games).
 * - SOV / SOL: SOS over wins / losses only.
 * - Record SOS: (2·OWP + OOWP)/3, NCAA RPI style, excluding head-to-head games.
 */
export function rateWeek(input: {
  teams: EngineTeam[];
  games: EngineGame[];
  currentWeekIndex: number;
  config: EngineConfig;
}): RatingResult {
  const { config, currentWeekIndex } = input;
  const teams = [...input.teams].sort((a, b) => a.id.localeCompare(b.id));
  const n = teams.length;
  const indexById = new Map(teams.map((team, index) => [team.id, index]));

  const played: Played[] = [];
  const scheduled: Array<{ game: EngineGame; home: number; away: number }> = [];
  const overall = teams.map(emptyRecord);
  const excluded: ExcludedGameExplanation[][] = teams.map(() => []);

  for (const game of input.games) {
    if (game.homeId === game.awayId) continue;
    const home = indexById.get(game.homeId);
    const away = indexById.get(game.awayId);
    if (home == null && away == null) continue;
    const done = isPlayed(game, currentWeekIndex);
    const margin = done ? (game.homeScore ?? 0) - (game.awayScore ?? 0) : 0;

    if (done) {
      if (home != null)
        addResult(overall[home] as RecordLine, resultFor(margin));
      if (away != null)
        addResult(overall[away] as RecordLine, resultFor(-margin));
    }

    if (home != null && away != null) {
      if (done) {
        played.push({ game, home, away, margin });
      } else if (
        game.weekIndex > currentWeekIndex ||
        game.status === "scheduled" ||
        game.status === "in_progress"
      ) {
        if (game.status !== "cancelled" && game.status !== "postponed") {
          scheduled.push({ game, home, away });
        }
      }
      continue;
    }

    if (!done) continue;
    const member = (home ?? away) as number;
    const memberIsHome = home != null;
    excluded[member]?.push({
      gameId: game.id,
      weekIndex: game.weekIndex,
      opponentName: memberIsHome ? game.awayName : game.homeName,
      opponentLevel: (memberIsHome ? game.awayLevel : game.homeLevel) ?? null,
      site: game.neutralSite ? "neutral" : memberIsHome ? "home" : "away",
      pointsFor: memberIsHome ? game.homeScore : game.awayScore,
      pointsAgainst: memberIsHome ? game.awayScore : game.homeScore,
      result: resultFor(memberIsHome ? margin : -margin),
      reason: "opponent_not_in_pool",
    });
  }

  const priorMeans = teams.map((team) =>
    team.priorStrength == null
      ? config.newcomerPrior
      : config.priorCarryover * team.priorStrength,
  );
  const rowFor = (game: Played, weight: number): FitRow => ({
    home: game.home,
    away: game.away,
    neutral: game.game.neutralSite,
    target: transformMargin(
      game.margin,
      game.game.overtime,
      config.marginTransform,
      config.overtimeMargin,
    ),
    weight,
  });
  const ridgeInput = {
    teamCount: n,
    priorMeans,
    priorGames: config.priorGames,
    homeFieldPrior: config.homeFieldPrior,
    homeFieldPriorGames: config.homeFieldPriorGames,
  };

  const strengthRows = played.map((game) => rowFor(game, 1));
  const strengthFit = fitRidge({ ...ridgeInput, rows: strengthRows });
  const powerWeights = played.map((game) =>
    recencyWeight(
      currentWeekIndex,
      game.game.weekIndex,
      config.powerHalfLifeWeeks,
    ),
  );
  const powerFit = fitRidge({
    ...ridgeInput,
    rows: played.map((game, index) => rowFor(game, powerWeights[index] ?? 1)),
  });
  const S = strengthFit.values;
  const h = strengthFit.homeField;

  // Leave out every meeting between each pair, once per pair.
  const pairRows = new Map<string, number[]>();
  played.forEach((game, index) => {
    const key =
      game.home < game.away
        ? `${game.home}:${game.away}`
        : `${game.away}:${game.home}`;
    pairRows.set(key, [...(pairRows.get(key) ?? []), index]);
  });
  const looStrength = new Map<string, Float64Array>();
  for (const [key, indexes] of pairRows) {
    looStrength.set(
      key,
      ratingsWithout(
        strengthFit,
        indexes.map((index) => strengthRows[index] as FitRow),
      ),
    );
  }

  const sides: Side[][] = teams.map(() => []);
  const poolRecord = teams.map(emptyRecord);
  played.forEach((game) => {
    const key =
      game.home < game.away
        ? `${game.home}:${game.away}`
        : `${game.away}:${game.home}`;
    const without = looStrength.get(key) ?? S;
    for (const isHome of [true, false]) {
      const team = isHome ? game.home : game.away;
      const opponent = isHome ? game.away : game.home;
      const result = resultFor(isHome ? game.margin : -game.margin);
      addResult(poolRecord[team] as RecordLine, result);
      sides[team]?.push({
        played: game,
        team,
        opponent,
        isHome,
        opponentStrength: without[opponent] ?? 0,
        looShift: (S[opponent] ?? 0) - (without[opponent] ?? 0),
        result,
      });
    }
  });

  // Record SOS: head-to-head games are excluded at every level, per the RPI definition.
  const recordExcluding = (
    team: number,
    excludedOpponent: number,
  ): RecordLine => {
    const record = emptyRecord();
    for (const side of sides[team] ?? []) {
      if (side.opponent !== excludedOpponent) addResult(record, side.result);
    }
    return record;
  };
  const owpOf = (team: number): number | null =>
    mean(
      (sides[team] ?? [])
        .map((side) => winPct(recordExcluding(side.opponent, team)))
        .filter((value): value is number => value != null),
    );
  const owp = teams.map((_, index) => owpOf(index));
  const oowp = teams.map((_, index) =>
    mean(
      (sides[index] ?? [])
        .map((side) => owp[side.opponent] ?? null)
        .filter((value): value is number => value != null),
    ),
  );

  const metricsFor = (
    team: number,
    strengths: (side: Side) => number,
    homeField: number,
  ) => {
    const ps = (sides[team] ?? []).map((side) =>
      benchmarkLoss(
        strengths(side),
        opponentEdge(side.isHome, side.played.game.neutralSite, homeField),
        config,
      ),
    );
    return {
      ps,
      sos: mean(ps),
      sor:
        ps.length === 0
          ? null
          : strengthOfRecord(ps, poolRecord[team] as RecordLine),
    };
  };

  const poolGames = teams.map((_, index) => sides[index]?.length ?? 0);
  const rankable = poolGames.map((count) => count >= config.minRankedGames);
  const baseMetrics = teams.map((_, index) =>
    metricsFor(index, (side) => side.opponentStrength, h),
  );

  // Posterior ranges.
  const normal = gaussianSource(mulberry32(config.seed));
  const powerSamples = samplePosterior(
    powerFit,
    config.posteriorSamples,
    normal,
  );
  const strengthSamples = samplePosterior(
    strengthFit,
    config.posteriorSamples,
    normal,
  );
  const powerValueSamples = teams.map(() => [] as number[]);
  const powerRankSamples = teams.map(() => [] as number[]);
  const sosRankSamples = teams.map(() => [] as number[]);
  const sorRankSamples = teams.map(() => [] as number[]);
  const all = teams.map(() => true);
  for (const sample of powerSamples) {
    const values = teams.map((_, index) => sample[index] ?? 0);
    const ranks = rank(values, all, "desc");
    values.forEach((value, index) => {
      powerValueSamples[index]?.push(value);
      powerRankSamples[index]?.push(ranks[index] ?? n);
    });
  }
  for (const sample of strengthSamples) {
    const sampleHome = sample[n] ?? h;
    const metrics = teams.map((_, index) =>
      metricsFor(
        index,
        (side) => (sample[side.opponent] ?? 0) - side.looShift,
        sampleHome,
      ),
    );
    const sosRanks = rank(
      metrics.map((m) => m.sos),
      rankable,
      "desc",
    );
    const sorRanks = rank(
      metrics.map((m) => m.sor?.sor ?? null),
      rankable,
      "asc",
    );
    teams.forEach((_, index) => {
      if (sosRanks[index] != null)
        sosRankSamples[index]?.push(sosRanks[index] as number);
      if (sorRanks[index] != null)
        sorRankSamples[index]?.push(sorRanks[index] as number);
    });
  }
  const range = (samples: number[]) => {
    const sorted = [...samples].sort((a, b) => a - b);
    return { low: quantile(sorted, 0.1), high: quantile(sorted, 0.9) };
  };

  const power = teams.map((_, index) => powerFit.values[index] ?? 0);
  const powerRanks = rank(power, all, "desc");
  const sosValues = baseMetrics.map((m) => m.sos);
  const sorValues = baseMetrics.map((m) => m.sor?.sor ?? null);
  const sosRanks = rank(sosValues, rankable, "desc");
  const sorRanks = rank(sorValues, rankable, "asc");

  const sovValues = teams.map((_, index) =>
    mean(
      (sides[index] ?? [])
        .map((side, k) => ({ side, p: baseMetrics[index]?.ps[k] ?? 0 }))
        .filter(({ side }) => side.result === "win")
        .map(({ p }) => p),
    ),
  );
  const solValues = teams.map((_, index) =>
    mean(
      (sides[index] ?? [])
        .map((side, k) => ({ side, p: baseMetrics[index]?.ps[k] ?? 0 }))
        .filter(({ side }) => side.result === "loss")
        .map(({ p }) => p),
    ),
  );
  const sovRanks = rank(
    sovValues,
    teams.map(
      (_, index) => (poolRecord[index]?.wins ?? 0) >= config.minRankedGames,
    ),
    "desc",
  );
  const recordSos = teams.map((_, index) => {
    const o = owp[index];
    const oo = oowp[index];
    return o == null || oo == null ? null : (2 * o + oo) / 3;
  });
  const recordSosRanks = rank(recordSos, rankable, "desc");

  const remainingByTeam = teams.map(() => [] as ScheduledGameExplanation[]);
  for (const { game, home, away } of scheduled) {
    for (const isHome of [true, false]) {
      const team = isHome ? home : away;
      const opponent = isHome ? away : home;
      const opponentStrength = S[opponent] ?? 0;
      remainingByTeam[team]?.push({
        gameId: game.id,
        weekIndex: game.weekIndex,
        opponentId: teams[opponent]?.id ?? "",
        opponentName: teams[opponent]?.name ?? "",
        site: game.neutralSite ? "neutral" : isHome ? "home" : "away",
        opponentStrength,
        p: benchmarkLoss(
          opponentStrength,
          opponentEdge(isHome, game.neutralSite, h),
          config,
        ),
      });
    }
  }

  const components = componentCount(n, played);
  const averagePoolGames =
    n === 0 ? 0 : poolGames.reduce((a, b) => a + b, 0) / n;
  const connected = components <= 1;
  const leagueProvisional =
    !connected || averagePoolGames < config.provisionalMinAverageGames;

  const powerHome = powerFit.homeField;
  const ratings: TeamRating[] = teams.map((team, index) => {
    const ps = baseMetrics[index]?.ps ?? [];
    const games: PoolGameExplanation[] = (sides[index] ?? []).map((side, k) => {
      const { game } = side.played;
      const p = ps[k] ?? 0;
      const pointsFor = (side.isHome ? game.homeScore : game.awayScore) ?? 0;
      const pointsAgainst =
        (side.isHome ? game.awayScore : game.homeScore) ?? 0;
      const site: Site = game.neutralSite
        ? "neutral"
        : side.isHome
          ? "home"
          : "away";
      const ownMargin = transformMargin(
        pointsFor - pointsAgainst,
        game.overtime,
        config.marginTransform,
        config.overtimeMargin,
      );
      const ownEdge = game.neutralSite
        ? 0
        : side.isHome
          ? powerHome
          : -powerHome;
      const playedIndex = played.indexOf(side.played);
      return {
        gameId: game.id,
        weekIndex: game.weekIndex,
        opponentId: teams[side.opponent]?.id ?? "",
        opponentName: teams[side.opponent]?.name ?? "",
        site,
        pointsFor,
        pointsAgainst,
        overtime: game.overtime,
        result: side.result,
        opponentStrength: side.opponentStrength,
        opponentSiteEdge: opponentEdge(side.isHome, game.neutralSite, h),
        p,
        tier: tierFor(p, config),
        opponentRecord: recordExcluding(side.opponent, index),
        powerWeight: powerWeights[playedIndex] ?? 1,
        performance:
          ownMargin + (powerFit.values[side.opponent] ?? 0) - ownEdge,
      };
    });
    const tierRecords: TeamRating["tierRecords"] = [
      emptyRecord(),
      emptyRecord(),
      emptyRecord(),
      emptyRecord(),
    ];
    for (const game of games)
      addResult(tierRecords[game.tier - 1] as RecordLine, game.result);

    const remaining = remainingByTeam[index] ?? [];
    const remainingPs = remaining.map((game) => game.p);
    const powerRange = range(powerValueSamples[index] ?? []);
    const powerRankRange = range(powerRankSamples[index] ?? []);
    const sosRange = range(sosRankSamples[index] ?? []);
    const sorRange = range(sorRankSamples[index] ?? []);
    const ranked = rankable[index] === true;

    return {
      teamId: team.id,
      name: team.name,
      conferenceId: team.conferenceId,
      power: power[index] ?? 0,
      powerLow: powerRange.low,
      powerHigh: powerRange.high,
      powerRank: powerRanks[index] ?? n,
      powerRankLow: Math.round(powerRankRange.low),
      powerRankHigh: Math.round(powerRankRange.high),
      strength: S[index] ?? 0,
      sor: sorValues[index] ?? null,
      sorRank: sorRanks[index] ?? null,
      sorRankLow: ranked ? Math.round(sorRange.low) : null,
      sorRankHigh: ranked ? Math.round(sorRange.high) : null,
      sos: sosValues[index] ?? null,
      sosRank: sosRanks[index] ?? null,
      sosRankLow: ranked ? Math.round(sosRange.low) : null,
      sosRankHigh: ranked ? Math.round(sosRange.high) : null,
      sov: sovValues[index] ?? null,
      sovRank: sovRanks[index] ?? null,
      sol: solValues[index] ?? null,
      recordSos: recordSos[index] ?? null,
      recordSosRank: recordSosRanks[index] ?? null,
      owp: owp[index] ?? null,
      oowp: oowp[index] ?? null,
      averageOpponentStrength: mean(
        games.map((game) => game.opponentStrength + game.opponentSiteEdge),
      ),
      remainingSos: mean(remainingPs),
      fullSeasonSos: mean([...ps, ...remainingPs]),
      poolRecord: poolRecord[index] ?? emptyRecord(),
      overallRecord: overall[index] ?? emptyRecord(),
      poolGames: poolGames[index] ?? 0,
      tierRecords,
      isProvisional: leagueProvisional || !ranked,
      explanation: {
        games,
        remaining,
        excluded: excluded[index] ?? [],
        sorDistribution: baseMetrics[index]?.sor?.distribution ?? [1],
      },
    };
  });

  ratings.sort(
    (a, b) =>
      (a.sorRank ?? Number.POSITIVE_INFINITY) -
        (b.sorRank ?? Number.POSITIVE_INFINITY) ||
      a.powerRank - b.powerRank ||
      a.name.localeCompare(b.name),
  );

  return {
    currentWeekIndex,
    diagnostics: {
      homeField: h,
      powerHomeField: powerHome,
      residualSd: Math.sqrt(strengthFit.residualVariance),
      effectiveParameters: strengthFit.effectiveParameters,
      poolGamesPlayed: played.length,
      averagePoolGames,
      connected,
      components,
      leagueProvisional,
    },
    teams: ratings,
  };
}
