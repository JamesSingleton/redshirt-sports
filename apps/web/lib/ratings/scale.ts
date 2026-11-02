import type { PublishedTeamRow } from "@redshirt-sports/db/ratings";

type ScaleRow = Pick<PublishedTeamRow, "power" | "sos" | "sor" | "sorRank">;

function nth(sortedDescending: number[], n: number): number | null {
  return sortedDescending[Math.min(n, sortedDescending.length) - 1] ?? null;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

/**
 * Reference points from this week's table, so a reader can tell whether a value
 * is good: the best, the 10th best, the middle team, and (for SOS) the easiest.
 */
export function scaleGuide(rows: ScaleRow[]) {
  const power = rows.map((row) => row.power).sort((a, b) => b - a);
  const sos = rows
    .map((row) => row.sos)
    .filter((value): value is number => value != null)
    .sort((a, b) => b - a);
  const ranked = rows
    .filter((row) => row.sorRank != null && row.sor != null)
    .sort((a, b) => (a.sorRank as number) - (b.sorRank as number));
  return {
    power: {
      best: nth(power, 1),
      tenth: nth(power, 10),
      middle: median(power),
    },
    sos: {
      hardest: nth(sos, 1),
      tenth: nth(sos, 10),
      middle: median(sos),
      easiest: sos[sos.length - 1] ?? null,
    },
    sor: {
      best: ranked[0]?.sor ?? null,
      twentyFifth: ranked[24]?.sor ?? null,
    },
  };
}

export type ScaleGuide = ReturnType<typeof scaleGuide>;
