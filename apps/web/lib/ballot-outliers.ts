import { TOP_25 } from "@/lib/constants";

/** Configurable thresholds — see methodology / §32.11a */
export const OUTLIER_RANK_GAP = 8;
export const OUTLIER_TOP_OMIT_RANK = 15;

export function isOutlierPick({
  voterRank,
  publishedRank,
}: {
  voterRank: number | null;
  publishedRank: number | null;
}): boolean {
  if (publishedRank != null && publishedRank <= OUTLIER_TOP_OMIT_RANK) {
    if (voterRank === null) {
      return true;
    }
  }
  if (voterRank === null || publishedRank == null) {
    return false;
  }
  return Math.abs(voterRank - publishedRank) >= OUTLIER_RANK_GAP;
}

export function rankHeatCellClass(rank: number): string {
  if (rank <= 5) {
    return "bg-primary/85 text-primary-foreground font-bold";
  }
  if (rank <= 10) {
    return "bg-primary/55 text-primary-foreground font-semibold";
  }
  if (rank <= 15) {
    return "bg-primary/30 font-semibold";
  }
  if (rank <= 20) {
    return "bg-primary/15";
  }
  if (rank <= TOP_25) {
    return "bg-primary/7";
  }
  return "bg-muted text-muted-foreground";
}
