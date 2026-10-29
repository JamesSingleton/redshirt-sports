import { TOP_25 } from "@/lib/constants";

/** Spots from the published rank that flag a pick. */
export const OUTLIER_RANK_GAP = 8;
/** Leaving off a team at this published rank or better is an outlier. */
export const OUTLIER_TOP_OMIT_RANK = TOP_25;

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
