import type { MarginTransform } from "./config";

/** erf with max error 1.2e-7 (Numerical Recipes erfc, Chebyshev fit). */
function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/** Standard normal CDF. Φ(0) = 0.5. */
export function normalCdf(x: number): number {
  return 0.5 * erfc(-x / Math.SQRT2);
}

/** Standard normal density. */
export function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * The margin a game contributes to the rating fit, from the home side.
 * Overtime games count as at most ±overtimeMargin: the extra period is close to a coin flip.
 */
export function transformMargin(
  margin: number,
  overtime: boolean,
  transform: MarginTransform,
  overtimeMargin: number,
): number {
  if (margin === 0) {
    return 0;
  }
  const sign = margin > 0 ? 1 : -1;
  const size = Math.abs(margin);
  if (overtime) {
    return sign * Math.min(size, overtimeMargin);
  }
  if (transform.type === "cap") {
    return sign * Math.min(size, transform.cap);
  }
  return sign * transform.c * Math.log(1 + size / transform.c);
}

/** Weight 1 for the current week, halving every `halfLifeWeeks`. Off when the half-life is null. */
export function recencyWeight(
  currentWeekIndex: number,
  gameWeekIndex: number,
  halfLifeWeeks: number | null,
): number {
  if (halfLifeWeeks == null || halfLifeWeeks <= 0) {
    return 1;
  }
  const age = Math.max(0, currentWeekIndex - gameWeekIndex);
  return 0.5 ** (age / halfLifeWeeks);
}

/**
 * Season-long ordering of weeks: preseason 0, regular weeks 1..n, then postseason after them.
 */
export function weekIndex(
  seasonType: number,
  weekNumber: number,
  regularWeekCount: number,
): number {
  if (seasonType <= 1) {
    return 0;
  }
  if (seasonType === 2) {
    return weekNumber;
  }
  return regularWeekCount + weekNumber;
}

/** Deterministic PRNG so published ranges reproduce exactly. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draws from a uniform generator (Box–Muller). */
export function gaussianSource(random: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare != null) {
      const value = spare;
      spare = null;
      return value;
    }
    const u = Math.max(random(), Number.MIN_VALUE);
    const v = random();
    const radius = Math.sqrt(-2 * Math.log(u));
    spare = radius * Math.sin(2 * Math.PI * v);
    return radius * Math.cos(2 * Math.PI * v);
  };
}

/**
 * Distribution of the number of successes in independent trials with these probabilities.
 * Index k holds P(exactly k successes).
 */
export function poissonBinomial(probabilities: number[]): number[] {
  let distribution = [1];
  for (const p of probabilities) {
    const next = new Array<number>(distribution.length + 1).fill(0);
    for (let k = 0; k < distribution.length; k += 1) {
      const mass = distribution[k] ?? 0;
      next[k] = (next[k] ?? 0) + mass * (1 - p);
      next[k + 1] = (next[k + 1] ?? 0) + mass * p;
    }
    distribution = next;
  }
  return distribution;
}

/** Linear-interpolated quantile of an ascending array. */
export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) {
    return Number.NaN;
  }
  const position = (sorted.length - 1) * q;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  const lowValue = sorted[low] ?? 0;
  const highValue = sorted[high] ?? 0;
  return lowValue + (highValue - lowValue) * (position - low);
}

export function mean(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
