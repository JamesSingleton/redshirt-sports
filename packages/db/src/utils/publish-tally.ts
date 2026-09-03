export type BallotVote = {
  schoolId?: string;
  rank: number;
  points: number;
  userId: string;
};

export type TeamPoint = {
  schoolId: string;
  totalPoints: number;
  firstPlaceVotes: number;
  rank?: number;
  isTie?: boolean;
};

export type RankingRow = {
  schoolId: string;
  rank: number | null;
  points: number;
  firstPlaceVotes: number;
  isTie: boolean;
};

/** Aggregate ballot votes into ranked teams (points desc, then first-place votes). */
export function tallyTeamPoints(votes: BallotVote[]): TeamPoint[] {
  const bySchool = new Map<string, TeamPoint>();

  for (const vote of votes) {
    const schoolId = vote.schoolId;
    if (!schoolId) continue;

    const existing = bySchool.get(schoolId);
    if (existing) {
      existing.totalPoints += vote.points;
      if (vote.rank === 1) existing.firstPlaceVotes += 1;
    } else {
      bySchool.set(schoolId, {
        schoolId,
        totalPoints: vote.points,
        firstPlaceVotes: vote.rank === 1 ? 1 : 0,
      });
    }
  }

  const teamPoints = [...bySchool.values()].sort((a, b) => {
    if (a.totalPoints === b.totalPoints) {
      return b.firstPlaceVotes - a.firstPlaceVotes;
    }
    return b.totalPoints - a.totalPoints;
  });

  let currentRank = 1;
  let previousPoints = teamPoints[0]?.totalPoints;
  let wasPreviousTeamTied = false;

  teamPoints.forEach((team, index) => {
    if (index > 0) {
      if (team.totalPoints === previousPoints) {
        team.isTie = true;
        if (!wasPreviousTeamTied) {
          const prevTeam = teamPoints[index - 1];
          if (prevTeam) prevTeam.isTie = true;
        }
        wasPreviousTeamTied = true;
      } else {
        currentRank = index + 1;
        wasPreviousTeamTied = false;
      }
    } else {
      team.isTie = false;
    }
    team.rank = currentRank;
    previousPoints = team.totalPoints;
  });

  return teamPoints;
}

/**
 * Map tallied teams to poll_rankings rows.
 * Ranks 1–25 stay Top 25; higher ordinals remain for ORV display.
 */
export function toRankingRows(teamPoints: TeamPoint[]): RankingRow[] {
  return teamPoints.map((team) => ({
    schoolId: team.schoolId,
    rank: team.rank && team.rank <= 25 ? team.rank : (team.rank ?? null),
    points: team.totalPoints,
    firstPlaceVotes: team.firstPlaceVotes,
    isTie: team.isTie ?? false,
  }));
}
