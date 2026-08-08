import { TOP_25 } from "@/lib/constants";

/** Rank assigned when a consensus Top 25 team is absent from a ballot. */
export const ABSENT_RANK = TOP_25 + 1;

/**
 * Maximum footrule distance when every consensus team is absent (rank 26).
 * Σ (26 − r) for r = 1..25 = 325
 */
export const MAX_FOOTRULE_ERROR = (TOP_25 * (TOP_25 + 1)) / 2;

export type ConsensusRank = {
  id: string;
  rank: number;
};

/**
 * How close a ballot's rank order was to the final Top 25, as 0–100%.
 * Spearman footrule: for each consensus Top 25 team, compare voter rank
 * (or #26 if left off the ballot) to the published rank.
 */
export function computeBallotMatchPercent(
  ballotTeamIdsInOrder: string[],
  consensus: ConsensusRank[],
): number {
  if (consensus.length === 0) {
    return 0;
  }

  const voterRankById = new Map<string, number>();
  for (let i = 0; i < ballotTeamIdsInOrder.length; i++) {
    const teamId = ballotTeamIdsInOrder[i];
    if (teamId && !voterRankById.has(teamId)) {
      voterRankById.set(teamId, i + 1);
    }
  }

  let error = 0;
  for (const { id, rank } of consensus) {
    const voterRank = voterRankById.get(id) ?? ABSENT_RANK;
    error += Math.abs(voterRank - rank);
  }

  const percent = Math.round((1 - error / MAX_FOOTRULE_ERROR) * 100);
  return Math.min(100, Math.max(0, percent));
}

export const BALLOT_MATCH_TOOLTIP =
  "How close this ballot's rank order was to the final Top 25. Teams left off the ballot count as #26.";
