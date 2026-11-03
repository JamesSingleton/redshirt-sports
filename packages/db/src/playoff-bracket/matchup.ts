/**
 * Per-team numbers for a bracket's matchup panel: record, poll and computer
 * ratings as of the edition's week, and the season's results. Pure, so the
 * panel can work out head-to-head and recent form without another query.
 */

export type TeamResult = {
  gameId: string;
  kickoffAt: Date | null;
  opponentSchoolId: string | null;
  opponentName: string;
  /** "FBS", "FCS", "DII"…; null when unknown. */
  opponentLevel: string | null;
  site: "home" | "away" | "neutral";
  teamScore: number;
  opponentScore: number;
  won: boolean;
  overtime: boolean;
};

export type WinLoss = { wins: number; losses: number };

export type BracketTeamStats = {
  schoolId: string;
  record: WinLoss;
  /** Against FCS opponents only. */
  divisionRecord: WinLoss;
  poll: {
    rank: number;
    points: number;
    firstPlaceVotes: number;
    isTie: boolean;
  } | null;
  ratings: {
    powerRank: number;
    sorRank: number | null;
    sosRank: number | null;
  } | null;
  /** Final games, oldest first. */
  results: TeamResult[];
};

export type BracketStatsAsOf = {
  pollWeek: number | null;
  ratingsWeek: number | null;
  /** Teams in the ratings pool that week, the denominator for ranks. */
  ratingsPoolSize: number | null;
};

export type BracketTeamStatsSet = {
  asOf: BracketStatsAsOf;
  teams: Record<string, BracketTeamStats>;
};

/** A final game from the `games` table, either side. */
export type SeasonGameRow = {
  id: string;
  kickoffAt: Date | null;
  homeSchoolId: string | null;
  awaySchoolId: string | null;
  homeName: string;
  awayName: string;
  homeShortName: string | null;
  awayShortName: string | null;
  homeLevel: string | null;
  awayLevel: string | null;
  homeScore: number | null;
  awayScore: number | null;
  neutralSite: boolean;
  overtime: boolean;
};

/** One team's view of the final games it played, oldest first. */
export function teamResults(
  schoolId: string,
  games: SeasonGameRow[],
): TeamResult[] {
  return games
    .filter(
      (game) =>
        (game.homeSchoolId === schoolId || game.awaySchoolId === schoolId) &&
        game.homeScore !== null &&
        game.awayScore !== null,
    )
    .map((game) => {
      const home = game.homeSchoolId === schoolId;
      const teamScore = (home ? game.homeScore : game.awayScore)!;
      const opponentScore = (home ? game.awayScore : game.homeScore)!;
      return {
        gameId: game.id,
        kickoffAt: game.kickoffAt,
        opponentSchoolId: home ? game.awaySchoolId : game.homeSchoolId,
        opponentName: home
          ? (game.awayShortName ?? game.awayName)
          : (game.homeShortName ?? game.homeName),
        opponentLevel: home ? game.awayLevel : game.homeLevel,
        site: game.neutralSite ? "neutral" : home ? "home" : "away",
        teamScore,
        opponentScore,
        won: teamScore > opponentScore,
        overtime: game.overtime,
      } satisfies TeamResult;
    })
    .sort(
      (a, b) => (a.kickoffAt?.getTime() ?? 0) - (b.kickoffAt?.getTime() ?? 0),
    );
}

export function winLoss(results: TeamResult[]): WinLoss {
  const wins = results.filter((result) => result.won).length;
  return { wins, losses: results.length - wins };
}

export function divisionWinLoss(results: TeamResult[], level = "FCS"): WinLoss {
  return winLoss(results.filter((result) => result.opponentLevel === level));
}

/** Games `team` played against the other school this season. */
export function headToHead(
  team: Pick<BracketTeamStats, "results">,
  opponentSchoolId: string,
): TeamResult[] {
  return team.results.filter(
    (result) => result.opponentSchoolId === opponentSchoolId,
  );
}

export function formatWinLoss(record: WinLoss) {
  return `${record.wins}-${record.losses}`;
}
