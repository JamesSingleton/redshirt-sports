import type { PoolPrediction } from "@redshirt-sports/db/ratings";

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

function record(predictions: PoolPrediction[]): PickRecord {
  const decided = predictions.filter((p) => p.actual !== 0);
  const correct = decided.filter(
    (p) => Math.sign(p.predicted) === Math.sign(p.actual),
  ).length;
  const miss = predictions.reduce(
    (sum, p) => sum + Math.abs(p.predicted - p.actual),
    0,
  );
  return {
    games: decided.length,
    correct,
    pct: decided.length === 0 ? 0 : correct / decided.length,
    averageMiss: predictions.length === 0 ? 0 : miss / predictions.length,
  };
}

/** Pick records by season, by week of the latest season, and by how big the favorite was. */
export function summarizePredictions(predictions: PoolPrediction[]) {
  const years = [...new Set(predictions.map((p) => p.year))].sort(
    (a, b) => b - a,
  );
  const seasons: SeasonRecord[] = years.map((year) => ({
    year,
    ...record(predictions.filter((p) => p.year === year)),
  }));
  const currentYear = years[0] ?? null;
  const current = predictions.filter((p) => p.year === currentYear);
  const weekKeys = [
    ...new Set(current.map((p) => `${p.seasonType}-${p.weekNumber}`)),
  ];
  const weeks: WeekRecord[] = weekKeys.map((key) => {
    const [type, number] = key.split("-").map(Number);
    return {
      label: type === 3 ? "Postseason" : `Week ${number}`,
      ...record(
        current.filter((p) => p.seasonType === type && p.weekNumber === number),
      ),
    };
  });
  const buckets: MarginBucket[] = MARGIN_BUCKETS.map(([label, low, high]) => ({
    label,
    ...record(
      predictions.filter(
        (p) => Math.abs(p.predicted) >= low && Math.abs(p.predicted) < high,
      ),
    ),
  }));
  return {
    currentYear,
    current: record(current),
    allTime: record(predictions),
    seasons,
    weeks,
    buckets,
  };
}

export type PredictionSummary = ReturnType<typeof summarizePredictions>;

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}
