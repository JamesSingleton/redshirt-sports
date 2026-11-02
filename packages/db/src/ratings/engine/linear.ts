/**
 * Dense symmetric positive-definite helpers. Matrices are row-major Float64Arrays.
 * Rating systems are ~130–360 teams, so O(n³) is milliseconds.
 */

/** Lower-triangular Cholesky factor L with A = L Lᵀ. Throws if A isn't positive definite. */
export function cholesky(matrix: Float64Array, size: number): Float64Array {
  const lower = new Float64Array(size * size);
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = matrix[i * size + j] ?? 0;
      for (let k = 0; k < j; k += 1) {
        sum -= (lower[i * size + k] ?? 0) * (lower[j * size + k] ?? 0);
      }
      if (i === j) {
        if (sum <= 0) {
          throw new Error(
            "Rating system is not positive definite. Is every team's prior weight above zero?",
          );
        }
        lower[i * size + i] = Math.sqrt(sum);
      } else {
        lower[i * size + j] = sum / (lower[j * size + j] ?? 1);
      }
    }
  }
  return lower;
}

/** Solve (L Lᵀ) x = b. */
export function choleskySolve(
  lower: Float64Array,
  right: Float64Array,
  size: number,
): Float64Array {
  const y = new Float64Array(size);
  for (let i = 0; i < size; i += 1) {
    let sum = right[i] ?? 0;
    for (let k = 0; k < i; k += 1) {
      sum -= (lower[i * size + k] ?? 0) * (y[k] ?? 0);
    }
    y[i] = sum / (lower[i * size + i] ?? 1);
  }
  const x = new Float64Array(size);
  for (let i = size - 1; i >= 0; i -= 1) {
    let sum = y[i] ?? 0;
    for (let k = i + 1; k < size; k += 1) {
      sum -= (lower[k * size + i] ?? 0) * (x[k] ?? 0);
    }
    x[i] = sum / (lower[i * size + i] ?? 1);
  }
  return x;
}

/** A⁻¹ from its Cholesky factor, one column at a time. */
export function choleskyInverse(
  lower: Float64Array,
  size: number,
): Float64Array {
  const inverse = new Float64Array(size * size);
  const unit = new Float64Array(size);
  for (let column = 0; column < size; column += 1) {
    unit.fill(0);
    unit[column] = 1;
    const solved = choleskySolve(lower, unit, size);
    for (let row = 0; row < size; row += 1) {
      inverse[row * size + column] = solved[row] ?? 0;
    }
  }
  return inverse;
}

/** Solve a small dense system by Gaussian elimination with partial pivoting. */
export function solveSmall(matrix: number[][], right: number[]): number[] {
  const size = right.length;
  const a = matrix.map((row, index) => [...row, right[index] ?? 0]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(a[row]?.[column] ?? 0) > Math.abs(a[pivot]?.[column] ?? 0)) {
        pivot = row;
      }
    }
    [a[column], a[pivot]] = [a[pivot] ?? [], a[column] ?? []];
    const lead = a[column]?.[column] ?? 0;
    if (Math.abs(lead) < 1e-14) {
      throw new Error("Singular system in leave-one-out update.");
    }
    for (let row = 0; row < size; row += 1) {
      if (row === column) {
        continue;
      }
      const factor = (a[row]?.[column] ?? 0) / lead;
      for (let k = column; k <= size; k += 1) {
        const rowValues = a[row] ?? [];
        rowValues[k] = (rowValues[k] ?? 0) - factor * (a[column]?.[k] ?? 0);
      }
    }
  }
  return a.map((row, index) => (row[size] ?? 0) / (row[index] ?? 1));
}
