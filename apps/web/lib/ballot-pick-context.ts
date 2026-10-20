import { OUTLIER_RANK_GAP } from "@/lib/ballot-outliers";
import type { BallotPickRow } from "@/lib/ballots-by-voter-data";
import { TOP_25 } from "@/lib/constants";

export function describeBallotPickContext(pick: BallotPickRow): string {
  const { voterRank, consensusRank, diff, isOutlier, shortName } = pick;

  if (consensusRank == null || consensusRank > TOP_25) {
    return `${shortName}: ranked No. ${voterRank} on this ballot — not in the published Top 25.`;
  }

  const lines = [
    `${shortName}: ranked No. ${voterRank} on this ballot; published at No. ${consensusRank}.`,
  ];

  if (diff === "equal") {
    lines.push("Same position as the final Top 25.");
  } else if (typeof diff === "number") {
    const spots = Math.abs(diff);
    const label = spots === 1 ? "spot" : "spots";
    lines.push(
      diff > 0
        ? `${spots} ${label} higher than the published Top 25.`
        : `${spots} ${label} lower than the published Top 25.`,
    );
  }

  if (isOutlier) {
    const gap = Math.abs(voterRank - consensusRank);
    if (gap >= OUTLIER_RANK_GAP) {
      lines.push(
        `Outlier: ${gap} spots from the published position (≥${OUTLIER_RANK_GAP}).`,
      );
    } else {
      lines.push("Outlier pick under our ballot policy.");
    }
  }

  return lines.join(" ");
}
