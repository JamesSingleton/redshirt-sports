import type {
  PoolPrediction,
  PoolPredictionGroup,
} from "@redshirt-sports/db/ratings";

export type PickRecord = {
  games: number;
  correct: number;
  /** Share of decided games with the right winner, 0–1. */
  pct: number;
  /** Average miss between predicted and actual margin, in points. */
  averageMiss: number;
};

export type WeekRecord = PickRecord & { label: string };
export type SeasonRecord = PickRecord & { year: number };
export type MarginBucket = PickRecord & { label: string };

const MARGIN_BUCKETS: Array<[string, number, number]> = [
  ["Toss-up (under 3)", 0, 3],
  ["Close (3–7)", 3, 7],
  ["Clear favorite (7–14)", 7, 14],
  ["Big favorite (14–21)", 14, 21],
  ["Heavy favorite (21+)", 21, Number.POSITIVE_INFINITY],
];

/** Lower edge of every bucket after the first, for Postgres width_bucket. */
export const MARGIN_EDGES = MARGIN_BUCKETS.slice(1).map(([, low]) => low);

/** Which MARGIN_BUCKETS entry a predicted margin falls in (same rule as width_bucket). */
function bucketOf(predicted: number): number {
  return MARGIN_EDGES.filter((edge) => Math.abs(predicted) >= edge).length;
}

/** Totals per week and bucket, the shape Postgres returns (see listPoolPredictionGroups). */
export function groupPredictions(
  predictions: PoolPrediction[],
): PoolPredictionGroup[] {
  const groups = new Map<string, PoolPredictionGroup>();
  for (const p of predictions) {
    const bucket = bucketOf(p.predicted);
    const key = `${p.year}:${p.seasonType}:${p.weekNumber}:${bucket}`;
    const group = groups.get(key) ?? {
      year: p.year,
      seasonType: p.seasonType,
      weekNumber: p.weekNumber,
      bucket,
      predictions: 0,
      decided: 0,
      correct: 0,
      missSum: 0,
    };
    group.predictions += 1;
    group.missSum += Math.abs(p.predicted - p.actual);
    if (p.actual !== 0) {
      group.decided += 1;
      if (Math.sign(p.predicted) === Math.sign(p.actual)) group.correct += 1;
    }
    groups.set(key, group);
  }
  return [...groups.values()];
}

function record(groups: PoolPredictionGroup[]): PickRecord {
  const predictions = groups.reduce((sum, g) => sum + g.predictions, 0);
  const decided = groups.reduce((sum, g) => sum + g.decided, 0);
  const correct = groups.reduce((sum, g) => sum + g.correct, 0);
  const miss = groups.reduce((sum, g) => sum + g.missSum, 0);
  return {
    games: decided,
    correct,
    pct: decided === 0 ? 0 : correct / decided,
    averageMiss: predictions === 0 ? 0 : miss / predictions,
  };
}

/** Pick records by season, by week of the latest season, and by how big the favorite was. */
export function summarizePredictionGroups(groups: PoolPredictionGroup[]) {
  const years = [...new Set(groups.map((g) => g.year))].sort((a, b) => b - a);
  const seasons: SeasonRecord[] = years.map((year) => ({
    year,
    ...record(groups.filter((g) => g.year === year)),
  }));
  const currentYear = years[0] ?? null;
  const current = groups.filter((g) => g.year === currentYear);
  const weekKeys = [
    ...new Set(
      [...current]
        .sort(
          (a, b) => a.seasonType - b.seasonType || a.weekNumber - b.weekNumber,
        )
        .map((g) => `${g.seasonType}-${g.weekNumber}`),
    ),
  ];
  const weeks: WeekRecord[] = weekKeys.map((key) => {
    const [type, number] = key.split("-").map(Number);
    return {
      label: type === 3 ? "Postseason" : `Week ${number}`,
      ...record(
        current.filter((g) => g.seasonType === type && g.weekNumber === number),
      ),
    };
  });
  const buckets: MarginBucket[] = MARGIN_BUCKETS.map(([label], index) => ({
    label,
    ...record(groups.filter((g) => g.bucket === index)),
  }));
  return {
    currentYear,
    current: record(current),
    allTime: record(groups),
    seasons,
    weeks,
    buckets,
  };
}

/** The same summary from individual predictions. */
export function summarizePredictions(predictions: PoolPrediction[]) {
  return summarizePredictionGroups(groupPredictions(predictions));
}

export type PredictionSummary = ReturnType<typeof summarizePredictions>;

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
