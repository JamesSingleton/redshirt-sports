/**
 * pnpm ratings:calibrate --sport football --pool fcs --seasons 2022-2025 [--write]
 *
 * Fits the method's parameters out of sample and writes the validation report the
 * public site shows. The first season is burn-in (it has no prior season), the
 * middle seasons are training, and the last season is the held-out test.
 *
 * --write  also saves the calibrated config to the pool (local database only).
 */
import fs from "node:fs";
import path from "node:path";

import { assertLocalDatabaseUrl } from "../src/utils/local-database";
import { hasFlag, loadCliEnv, readFlag, repoRoot } from "./cli-env";

loadCliEnv();
assertLocalDatabaseUrl(process.env.DATABASE_URL);

const ratings = await import("../src/ratings");
const backtest = await import("../src/ratings/backtest/backtest");
const { primaryDb: db } = await import("../src/client");
const { ratingPoolsTable } = await import("../src/schema");
const { eq } = await import("drizzle-orm");

type EngineConfig = import("../src/ratings/engine/config").EngineConfig;
type Candidate = import("../src/ratings/backtest/backtest").Candidate;

const sport = readFlag("--sport") ?? "football";
const poolSlug = readFlag("--pool") ?? "fcs";
const [firstYear, lastYear] = (readFlag("--seasons") ?? "2022-2025")
  .split("-")
  .map(Number);
if (!firstYear || !lastYear || lastYear - firstYear < 2) {
  throw new Error("Pass --seasons FIRST-LAST spanning at least three seasons.");
}
const pool = await ratings.getPool(sport, poolSlug);

const seasons: import("../src/ratings/backtest/backtest").BacktestSeason[] = [];
const champions = new Map<number, string>();
for (let year = firstYear; year <= lastYear; year += 1) {
  const calendar = await ratings.loadSeasonCalendar(pool.sportId, year);
  const inputs = await ratings.loadRatingInputs(pool, calendar);
  const weeks = [...new Set(inputs.games.map((game) => game.weekIndex))].sort(
    (a, b) => a - b,
  );
  seasons.push({ year, teams: inputs.teams, games: inputs.games, weeks });
  // The title game is the last pool game played, and only once the postseason has
  // been played: a season still in progress has no champion.
  const members = new Set(inputs.teams.map((team) => team.id));
  const finals = inputs.games
    .filter(
      (g) =>
        g.status === "final" && members.has(g.homeId) && members.has(g.awayId),
    )
    .sort(
      (a, b) =>
        (inputs.kickoffById.get(a.id)?.getTime() ?? 0) -
        (inputs.kickoffById.get(b.id)?.getTime() ?? 0),
    );
  const last = finals[finals.length - 1];
  const title =
    last && last.weekIndex > calendar.regularWeekCount ? last : null;
  if (title)
    champions.set(
      year,
      (title.homeScore ?? 0) > (title.awayScore ?? 0)
        ? title.homeId
        : title.awayId,
    );
}
const names = new Map(
  seasons.flatMap((season) =>
    season.teams.map((team) => [team.id, team.name] as const),
  ),
);
const trainYears = seasons.slice(1, -1).map((season) => season.year);
const testYear = lastYear;

const grid = <T,>(
  parameter: string,
  values: T[],
  apply: (config: EngineConfig, value: T) => EngineConfig,
  label = (v: T) => String(v),
) => ({
  parameter,
  candidates: values.map<Candidate>((value) => ({
    name: label(value),
    apply: (config) => apply(config, value),
  })),
});

const grids = [
  grid(
    "marginTransform",
    [
      { type: "cap", cap: 21 },
      { type: "cap", cap: 24 },
      { type: "cap", cap: 28 },
      { type: "cap", cap: 35 },
      { type: "log", c: 10 },
      { type: "log", c: 14 },
      { type: "log", c: 20 },
    ] as EngineConfig["marginTransform"][],
    (config, marginTransform) => ({ ...config, marginTransform }),
    (t) => (t.type === "cap" ? `cap ${t.cap}` : `log c=${t.c}`),
  ),
  grid("priorGames", [0.5, 1, 1.5, 2, 3, 5], (config, priorGames) => ({
    ...config,
    priorGames,
  })),
  grid(
    "priorCarryover",
    [0.45, 0.6, 0.75, 0.85, 0.95, 1],
    (config, priorCarryover) => ({ ...config, priorCarryover }),
  ),
  grid(
    "newcomerPrior",
    [-21, -18, -15, -12, -9, -6, -3, 0],
    (config, newcomerPrior) => ({ ...config, newcomerPrior }),
  ),
  grid(
    "powerHalfLifeWeeks",
    [null, 4, 6, 8, 12],
    (config, powerHalfLifeWeeks) => ({ ...config, powerHalfLifeWeeks }),
    (v) => (v == null ? "off" : `${v} weeks`),
  ),
  grid(
    "homeFieldPrior",
    [0, 0.75, 1.5, 2.5, 3.5],
    (config, homeFieldPrior) => ({ ...config, homeFieldPrior }),
  ),
];

const started = performance.now();
const baselineRun = backtest.walkForward(seasons, pool.config);
// Score the starting values the same way as the result: σ fitted on training seasons only.
const baselineSigma = backtest.fitSigma(
  baselineRun.predictions.filter((p) => trainYears.includes(p.year)),
);
const baselineTest = backtest.metrics(
  baselineRun.predictions.filter((p) => p.year === testYear),
  baselineSigma,
);
console.log(`Starting config, held-out ${testYear}:`, baselineTest);

const { config: fitted, history } = backtest.calibrate({
  seasons,
  trainYears,
  start: pool.config,
  grids,
});
for (const step of history) {
  console.log(
    `  ${step.parameter.padEnd(20)} → ${step.choice.padEnd(10)} train log loss ${step.logLoss.toFixed(4)}, MAE ${step.mae.toFixed(2)}`,
  );
}

const run = backtest.walkForward(seasons, fitted);
const train = run.predictions.filter((p) => trainYears.includes(p.year));
const sigma = backtest.fitSigma(train);
const benchmark = backtest.benchmarkFrom(run.finalStrength);
const calibrated: EngineConfig = {
  ...fitted,
  sigma: Math.round(sigma * 100) / 100,
  benchmark: Math.round(benchmark * 100) / 100,
};
const trainMetrics = backtest.metrics(train, calibrated.sigma);
const testMetrics = backtest.metrics(
  run.predictions.filter((p) => p.year === testYear),
  calibrated.sigma,
);
const perSeason = seasons.slice(1).map((season) => ({
  year: season.year,
  role: season.year === testYear ? "test" : "train",
  ...backtest.metrics(
    run.predictions.filter((p) => p.year === season.year),
    calibrated.sigma,
  ),
}));

// How each season's champion ranked in the final published metrics.
const championRanks = seasons.map((season) => {
  const champion = champions.get(season.year);
  const last = season.weeks[season.weeks.length - 1] ?? 0;
  const priorMap =
    season.year === firstYear
      ? new Map<string, number>()
      : (run.finalStrength.get(season.year - 1) ?? new Map());
  const result = ratings.rateWeek({
    teams: season.teams.map((team) => ({
      ...team,
      priorStrength: priorMap.get(team.id) ?? null,
    })),
    games: season.games,
    currentWeekIndex: last,
    config: { ...calibrated, posteriorSamples: 0 },
  });
  const row = result.teams.find((team) => team.teamId === champion);
  return {
    year: season.year,
    champion: champion ? (names.get(champion) ?? champion) : null,
    sorRank: row?.sorRank ?? null,
    powerRank: row?.powerRank ?? null,
    sosRank: row?.sosRank ?? null,
  };
});

const report = {
  pool: { sport, slug: poolSlug, name: pool.name },
  generatedAt: new Date().toISOString(),
  seasons: { burnIn: firstYear, train: trainYears, test: testYear },
  config: calibrated,
  steps: history,
  baseline: {
    description: "Starting values before calibration",
    test: baselineTest,
  },
  train: trainMetrics,
  test: testMetrics,
  perSeason,
  championRanks,
};
console.log(
  `\nCalibrated in ${Math.round((performance.now() - started) / 1000)} s.`,
);
console.log("Config:", JSON.stringify(calibrated));
console.log(`Held-out ${testYear}:`, testMetrics);
console.log("Champions:", championRanks);

const out = path.join(
  repoRoot,
  `apps/web/content/ratings-validation/${sport}-${poolSlug}.json`,
);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, out)}`);

if (hasFlag("--write")) {
  await db
    .update(ratingPoolsTable)
    .set({ config: calibrated, updatedAt: new Date() })
    .where(eq(ratingPoolsTable.id, pool.id));
  console.log("Saved the calibrated config to the local pool row.");
}
await db.$client.end();
