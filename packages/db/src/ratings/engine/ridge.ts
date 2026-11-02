import { cholesky, choleskyInverse, choleskySolve, solveSmall } from "./linear";

/** One game as a regression row: y = r_home − r_away + h·(not neutral) + noise. */
export type FitRow = {
  home: number;
  away: number;
  neutral: boolean;
  /** Transformed margin, home minus away. */
  target: number;
  weight: number;
};

export type RidgeFit = {
  teamCount: number;
  /** Team ratings centered on the pool mean, then home field at index teamCount. */
  values: Float64Array;
  homeField: number;
  /** What was subtracted to center. Leave-one-out and samples use the same frame. */
  offset: number;
  /** (XᵀWX + Λ)⁻¹, the unscaled posterior covariance. */
  inverse: Float64Array;
  lower: Float64Array;
  /** Residual variance per unit weight: the noise scale for the posterior. */
  residualVariance: number;
  /** Parameters the data actually pinned down: trace of the hat matrix. */
  effectiveParameters: number;
};

/**
 * Bayesian ridge: each team's rating has a normal prior (mean `priorMeans[i]`,
 * weight `priorGames` games), home field has its own prior, and each game is a
 * weighted observation of the margin. The solution is the posterior mean.
 */
export function fitRidge(input: {
  teamCount: number;
  rows: FitRow[];
  priorMeans: number[];
  priorGames: number;
  homeFieldPrior: number;
  homeFieldPriorGames: number;
}): RidgeFit {
  const n = input.teamCount;
  const size = n + 1;
  const h = n;
  const matrix = new Float64Array(size * size);
  const right = new Float64Array(size);

  const add = (i: number, j: number, value: number) => {
    matrix[i * size + j] = (matrix[i * size + j] ?? 0) + value;
  };

  for (const row of input.rows) {
    if (row.weight <= 0) {
      continue;
    }
    const columns: Array<[number, number]> = [
      [row.home, 1],
      [row.away, -1],
    ];
    if (!row.neutral) {
      columns.push([h, 1]);
    }
    for (const [ci, si] of columns) {
      right[ci] = (right[ci] ?? 0) + row.weight * si * row.target;
      for (const [cj, sj] of columns) {
        add(ci, cj, row.weight * si * sj);
      }
    }
  }

  for (let team = 0; team < n; team += 1) {
    add(team, team, input.priorGames);
    right[team] =
      (right[team] ?? 0) + input.priorGames * (input.priorMeans[team] ?? 0);
  }
  add(h, h, input.homeFieldPriorGames);
  right[h] = (right[h] ?? 0) + input.homeFieldPriorGames * input.homeFieldPrior;

  const lower = cholesky(matrix, size);
  const solved = choleskySolve(lower, right, size);
  const inverse = choleskyInverse(lower, size);

  let squaredError = 0;
  let observations = 0;
  for (const row of input.rows) {
    if (row.weight <= 0) {
      continue;
    }
    const residual = row.target - predictRow(solved, row, n);
    squaredError += row.weight * residual * residual;
    observations += 1;
  }

  // Hat-matrix trace = parameters − Σ prior weight × posterior variance.
  let shrunk = 0;
  for (let team = 0; team < n; team += 1) {
    shrunk += input.priorGames * (inverse[team * size + team] ?? 0);
  }
  shrunk += input.homeFieldPriorGames * (inverse[h * size + h] ?? 0);
  const effectiveParameters = size - shrunk;
  const degrees = Math.max(1, observations - effectiveParameters);

  let offset = 0;
  for (let team = 0; team < n; team += 1) {
    offset += solved[team] ?? 0;
  }
  offset = n === 0 ? 0 : offset / n;
  const values = new Float64Array(size);
  for (let team = 0; team < n; team += 1) {
    values[team] = (solved[team] ?? 0) - offset;
  }
  values[h] = solved[h] ?? 0;

  return {
    teamCount: n,
    values,
    homeField: values[h] ?? 0,
    offset,
    inverse,
    lower,
    residualVariance: observations === 0 ? 0 : squaredError / degrees,
    effectiveParameters,
  };
}

function predictRow(values: Float64Array, row: FitRow, n: number): number {
  return (
    (values[row.home] ?? 0) -
    (values[row.away] ?? 0) +
    (row.neutral ? 0 : (values[n] ?? 0))
  );
}

function rowVector(row: FitRow, size: number): Float64Array {
  const x = new Float64Array(size);
  x[row.home] = 1;
  x[row.away] = -1;
  if (!row.neutral) {
    x[size - 1] = 1;
  }
  return x;
}

/**
 * Exact ratings as if `rows` had never been played, without refitting.
 * Woodbury: r' = r − A⁻¹U (W⁻¹ − UᵀA⁻¹U)⁻¹ (y − Uᵀr).
 * Used so a team's own games against an opponent never shape that opponent's strength.
 */
export function ratingsWithout(fit: RidgeFit, rows: FitRow[]): Float64Array {
  const size = fit.teamCount + 1;
  const kept = rows.filter((row) => row.weight > 0);
  if (kept.length === 0) {
    return fit.values;
  }
  // Uncentered solution, so residuals match the fitted system.
  const raw = new Float64Array(size);
  for (let i = 0; i < fit.teamCount; i += 1) {
    raw[i] = (fit.values[i] ?? 0) + fit.offset;
  }
  raw[size - 1] = fit.homeField;

  const columns = kept.map((row) => {
    const x = rowVector(row, size);
    const ax = new Float64Array(size);
    for (let i = 0; i < size; i += 1) {
      let sum = 0;
      for (let j = 0; j < size; j += 1) {
        sum += (fit.inverse[i * size + j] ?? 0) * (x[j] ?? 0);
      }
      ax[i] = sum;
    }
    return { x, ax };
  });

  const k = kept.length;
  const system: number[][] = [];
  const residuals: number[] = [];
  for (let a = 0; a < k; a += 1) {
    const rowA = kept[a] as FitRow;
    const line: number[] = [];
    for (let b = 0; b < k; b += 1) {
      let dot = 0;
      const xa = columns[a]?.x as Float64Array;
      const axb = columns[b]?.ax as Float64Array;
      for (let i = 0; i < size; i += 1) {
        dot += (xa[i] ?? 0) * (axb[i] ?? 0);
      }
      line.push((a === b ? 1 / rowA.weight : 0) - dot);
    }
    system.push(line);
    residuals.push(rowA.target - predictRow(raw, rowA, fit.teamCount));
  }
  const coefficients = solveSmall(system, residuals);

  const result = new Float64Array(size);
  for (let i = 0; i < size; i += 1) {
    let delta = 0;
    for (let a = 0; a < k; a += 1) {
      delta += (columns[a]?.ax[i] ?? 0) * (coefficients[a] ?? 0);
    }
    result[i] = (raw[i] ?? 0) - delta - (i < fit.teamCount ? fit.offset : 0);
  }
  return result;
}

/**
 * Draws from the posterior N(r̂, s²A⁻¹), each re-centered on the pool mean
 * like the published ratings. Deterministic for a given normal source.
 */
export function samplePosterior(
  fit: RidgeFit,
  count: number,
  normal: () => number,
): Float64Array[] {
  const size = fit.teamCount + 1;
  const scale = Math.sqrt(fit.residualVariance);
  const samples: Float64Array[] = [];
  for (let s = 0; s < count; s += 1) {
    // x = L⁻ᵀ z has covariance (L Lᵀ)⁻¹ = A⁻¹.
    const z = new Float64Array(size);
    for (let i = 0; i < size; i += 1) {
      z[i] = normal();
    }
    const x = new Float64Array(size);
    for (let i = size - 1; i >= 0; i -= 1) {
      let sum = z[i] ?? 0;
      for (let j = i + 1; j < size; j += 1) {
        sum -= (fit.lower[j * size + i] ?? 0) * (x[j] ?? 0);
      }
      x[i] = sum / (fit.lower[i * size + i] ?? 1);
    }
    const sample = new Float64Array(size);
    let centre = 0;
    for (let i = 0; i < fit.teamCount; i += 1) {
      sample[i] = (fit.values[i] ?? 0) + scale * (x[i] ?? 0);
      centre += sample[i] ?? 0;
    }
    centre = fit.teamCount === 0 ? 0 : centre / fit.teamCount;
    for (let i = 0; i < fit.teamCount; i += 1) {
      sample[i] = (sample[i] ?? 0) - centre;
    }
    sample[size - 1] = fit.homeField + scale * (x[size - 1] ?? 0);
    samples.push(sample);
  }
  return samples;
}
