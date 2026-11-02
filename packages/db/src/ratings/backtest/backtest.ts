import type { EngineConfig } from "../engine/config";
import { normalCdf, quantile } from "../engine/math";
import { rateWeek } from "../engine/rate";
import type { EngineGame, EngineTeam } from "../engine/types";

/** One season's inputs. Priors are filled in from the previous season by the backtest. */
export type BacktestSeason = {
  year: number;
  teams: EngineTeam[];
  games: EngineGame[];
  /** Week indexes with games, in order. */
  weeks: number[];
};

export type Prediction = {
  year: number;
  weekIndex: number;
  gameId: string;
  predictedMargin: number;
  actualMargin: number;
};

export type BacktestMetrics = {
  games: number;
  marginMae: number;
  marginRmse: number;
  winnerAccuracy: number;
  /** Mean negative log-likelihood of the winner under Φ(pred/σ). */
  logLoss: number;
  /** σ fitted by maximum likelihood on these predictions. */
  sigma: number;
};

function expandIfLog(value: number, config: EngineConfig): number {
  if (config.marginTransform.type !== "log") return value;
  const c = config.marginTransform.c;
  const sign = value >= 0 ? 1 : -1;
  return sign * c * (Math.exp(Math.abs(value) / c) - 1);
}

/**
 * Walk forward through seasons. Before each week, rate with only the games already
 * played, predict that week's pool games, then move on. Each season's priors are the
 * previous season's final strengths under the same config, as in production.
 */
export function walkForward(
  seasons: BacktestSeason[],
  config: EngineConfig,
  options: { firstWeek?: number } = {},
): {
  predictions: Prediction[];
  finalStrength: Map<number, Map<string, number>>;
} {
  const quick = { ...config, posteriorSamples: 0 };
  const predictions: Prediction[] = [];
  const finalStrength = new Map<number, Map<string, number>>();
  let previous = new Map<string, number>();
  for (const season of seasons) {
    const teams = season.teams.map((team) => ({
      ...team,
      priorStrength: previous.get(team.id) ?? null,
    }));
    const members = new Set(teams.map((team) => team.id));
    for (const week of season.weeks) {
      if (week < (options.firstWeek ?? 2)) continue;
      const toPredict = season.games.filter(
        (game) =>
          game.weekIndex === week &&
          game.status === "final" &&
          game.homeScore != null &&
          game.awayScore != null &&
          members.has(game.homeId) &&
          members.has(game.awayId),
      );
      if (toPredict.length === 0) continue;
      const result = rateWeek({
        teams,
        games: season.games,
        currentWeekIndex: week - 1,
        config: quick,
      });
      const power = new Map(
        result.teams.map((team) => [team.teamId, team.power]),
      );
      for (const game of toPredict) {
        const raw =
          (power.get(game.homeId) ?? 0) -
          (power.get(game.awayId) ?? 0) +
          (game.neutralSite ? 0 : result.diagnostics.powerHomeField);
        predictions.push({
          year: season.year,
          weekIndex: week,
          gameId: game.id,
          predictedMargin: expandIfLog(raw, config),
          actualMargin: (game.homeScore ?? 0) - (game.awayScore ?? 0),
        });
      }
    }
    const last = season.weeks[season.weeks.length - 1] ?? 0;
    const final = rateWeek({
      teams,
      games: season.games,
      currentWeekIndex: last,
      config: quick,
    });
    previous = new Map(final.teams.map((team) => [team.teamId, team.strength]));
    finalStrength.set(season.year, previous);
  }
  return { predictions, finalStrength };
}

function logLossAt(predictions: Prediction[], sigma: number): number {
  let total = 0;
  let count = 0;
  for (const p of predictions) {
    if (p.actualMargin === 0) continue;
    const homeWin = normalCdf(p.predictedMargin / sigma);
    const probability = p.actualMargin > 0 ? homeWin : 1 - homeWin;
    total -= Math.log(Math.min(1 - 1e-9, Math.max(1e-9, probability)));
    count += 1;
  }
  return count === 0 ? Number.NaN : total / count;
}

/** σ by maximum likelihood: golden-section search on log loss over [4, 30]. */
export function fitSigma(predictions: Prediction[]): number {
  let low = 4;
  let high = 30;
  const ratio = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i += 1) {
    const a = high - ratio * (high - low);
    const b = low + ratio * (high - low);
    if (logLossAt(predictions, a) < logLossAt(predictions, b)) high = b;
    else low = a;
  }
  return (low + high) / 2;
}

export function metrics(
  predictions: Prediction[],
  sigma?: number,
): BacktestMetrics {
  const fitted = sigma ?? fitSigma(predictions);
  let absolute = 0;
  let squared = 0;
  let correct = 0;
  let decided = 0;
  for (const p of predictions) {
    const error = p.predictedMargin - p.actualMargin;
    absolute += Math.abs(error);
    squared += error * error;
    if (p.actualMargin !== 0) {
      decided += 1;
      if (Math.sign(p.predictedMargin) === Math.sign(p.actualMargin))
        correct += 1;
    }
  }
  const n = predictions.length || 1;
  return {
    games: predictions.length,
    marginMae: absolute / n,
    marginRmse: Math.sqrt(squared / n),
    winnerAccuracy: decided === 0 ? 0 : correct / decided,
    logLoss: logLossAt(predictions, fitted),
    sigma: fitted,
  };
}

/** Median strength of the 25th-best team in each season's final ratings. */
export function benchmarkFrom(
  finalStrength: Map<number, Map<string, number>>,
): number {
  const values = [...finalStrength.values()].map((strengths) => {
    const sorted = [...strengths.values()].sort((a, b) => b - a);
    return sorted[Math.min(24, sorted.length - 1)] ?? 0;
  });
  return quantile(
    [...values].sort((a, b) => a - b),
    0.5,
  );
}

export type Candidate = {
  name: string;
  apply: (config: EngineConfig) => EngineConfig;
};

/**
 * Coordinate descent: for each parameter in turn, keep the grid value with the
 * lowest training log loss (margin MAE breaks ties), holding the rest fixed.
 * Two passes are enough for these few, mostly independent parameters.
 */
export function calibrate(input: {
  seasons: BacktestSeason[];
  trainYears: number[];
  start: EngineConfig;
  grids: Array<{ parameter: string; candidates: Candidate[] }>;
  passes?: number;
}): {
  config: EngineConfig;
  history: Array<{
    parameter: string;
    choice: string;
    logLoss: number;
    mae: number;
  }>;
} {
  let config = input.start;
  const history: Array<{
    parameter: string;
    choice: string;
    logLoss: number;
    mae: number;
  }> = [];
  const score = (candidate: EngineConfig) => {
    const { predictions } = walkForward(input.seasons, candidate);
    const train = predictions.filter((p) => input.trainYears.includes(p.year));
    return metrics(train);
  };
  for (let pass = 0; pass < (input.passes ?? 2); pass += 1) {
    for (const grid of input.grids) {
      let best: {
        config: EngineConfig;
        name: string;
        m: BacktestMetrics;
      } | null = null;
      for (const candidate of grid.candidates) {
        const next = candidate.apply(config);
        const m = score(next);
        if (
          !best ||
          m.logLoss < best.m.logLoss - 1e-6 ||
          (Math.abs(m.logLoss - best.m.logLoss) <= 1e-6 &&
            m.marginMae < best.m.marginMae)
        ) {
          best = { config: next, name: candidate.name, m };
        }
      }
      if (best) {
        config = best.config;
        history.push({
          parameter: grid.parameter,
          choice: best.name,
          logLoss: best.m.logLoss,
          mae: best.m.marginMae,
        });
      }
    }
  }
  return { config, history };
}
