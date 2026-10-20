import type { BallotsPageMatrix } from "@/lib/ballots-page-data";

export type BallotMatrixColumnMode = "all" | "summary" | "on-range";

const COLUMN_MODE_VALUES = new Set<BallotMatrixColumnMode>([
  "all",
  "summary",
  "on-range",
]);

/** Parses `columns` search param (accepts legacy `compact` as summary). */
export function parseBallotMatrixColumnMode(
  value: string | null,
): BallotMatrixColumnMode {
  if (value === "compact") {
    return "summary";
  }
  if (value && COLUMN_MODE_VALUES.has(value as BallotMatrixColumnMode)) {
    return value as BallotMatrixColumnMode;
  }
  return "all";
}

export function ballotMatrixShowVoterColumns(
  mode: BallotMatrixColumnMode,
): boolean {
  return mode === "all";
}

/** Summary keeps Pts/1st; On & range drops them so only aggregate placement columns remain. */
export function ballotMatrixShowPtsFirstColumns(
  mode: BallotMatrixColumnMode,
): boolean {
  return mode !== "on-range";
}

export function ballotMatrixColumnModeQueryValue(
  mode: BallotMatrixColumnMode,
): string | null {
  if (mode === "all") {
    return null;
  }
  return mode;
}

export function voterHasOutlierByIndex(matrix: BallotsPageMatrix): boolean[] {
  return matrix.voters.map((_, voterIndex) =>
    matrix.rows.some((row) => row.cells[voterIndex]?.isOutlier),
  );
}
