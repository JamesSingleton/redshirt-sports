import { TOP_25 } from "@/lib/constants";

/** Spots from the published rank that flag a pick. */
export const OUTLIER_RANK_GAP = 8;

export function isOutlierPick({
  voterRank,
  publishedRank,
}: {
  voterRank: number | null;
  publishedRank: number | null;
}): boolean {
  if (voterRank === null || publishedRank == null) {
    return false;
  }
  return Math.abs(voterRank - publishedRank) >= OUTLIER_RANK_GAP;
}

/** A published Top 25 team this voter left off the ballot. */
export function isLeftOffTop25({
  voterRank,
  publishedRank,
}: {
  voterRank: number | null;
  publishedRank: number | null;
}): boolean {
  return voterRank === null && publishedRank != null && publishedRank <= TOP_25;
}

export function rankHeatCellClass(rank: number): string {
  if (rank <= 5) {
    return "bg-heat-1 text-heat-1-foreground font-bold";
  }
  if (rank <= 10) {
    return "bg-heat-2 text-heat-2-foreground font-semibold";
  }
  if (rank <= 15) {
    return "bg-heat-3 text-heat-3-foreground font-semibold";
  }
  if (rank <= 20) {
    return "bg-heat-4 text-heat-4-foreground";
  }
  if (rank <= TOP_25) {
    return "bg-heat-5 text-heat-5-foreground";
  }
  return "bg-heat-rv text-heat-rv-foreground";
}
