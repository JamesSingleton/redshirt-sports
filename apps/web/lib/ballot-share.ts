export type BallotImageRow = {
  rank: number;
  teamName: string;
  diffLabel: string;
  isOutlier: boolean;
};

export function diffLabel(diff: number | "rv" | "equal"): string {
  if (diff === "rv") return "RV";
  if (diff === "equal") return "=";
  if (diff > 0) return `+${diff}`;
  return `${diff}`;
}

export function buildImageRows(
  picks: ReadonlyArray<{
    voterRank: number;
    shortName: string;
    diff: number | "rv" | "equal";
    isOutlier: boolean;
  }>,
): BallotImageRow[] {
  return picks.map((p) => ({
    rank: p.voterRank,
    teamName: p.shortName,
    diffLabel: diffLabel(p.diff),
    isOutlier: p.isOutlier,
  }));
}

export function buildPostText({
  week,
  poll,
  totalBallots,
  url,
}: {
  week: number;
  poll: string;
  totalBallots: number;
  url: string;
}): string {
  return `My Week ${week} @_redshirtsports ${poll} Top 25 ballot. All ${totalBallots} ballots: ${url}`;
}
