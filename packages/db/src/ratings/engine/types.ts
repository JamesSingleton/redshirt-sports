export const GAME_STATUSES = [
  "scheduled",
  "in_progress",
  "final",
  "postponed",
  "cancelled",
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

/** A pool member for one season. */
export type EngineTeam = {
  id: string;
  name: string;
  conferenceId: string | null;
  /** Last season's final strength, or null for a team new to the pool. */
  priorStrength: number | null;
};

/** Any game involving at least one pool member. Non-pool sides are listed, never counted. */
export type EngineGame = {
  id: string;
  /** Season-ordered week; see weekIndex(). */
  weekIndex: number;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  /** Level of a side outside the pool ("FBS", "DII", "Non-NCAA"…), for labels only. */
  homeLevel?: string | null;
  awayLevel?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  neutralSite: boolean;
  overtime: boolean;
  status: GameStatus;
};

export type Site = "home" | "away" | "neutral";
export type Result = "win" | "loss" | "tie";

/** One counted pool game from one team's side. Everything needed to redo the math by hand. */
export type PoolGameExplanation = {
  gameId: string;
  weekIndex: number;
  opponentId: string;
  opponentName: string;
  site: Site;
  pointsFor: number;
  pointsAgainst: number;
  overtime: boolean;
  result: Result;
  /** Opponent's strength with every game against this team removed. */
  opponentStrength: number;
  /** Home-field edge the opponent had in this game: +h if they were home, −h if away, 0 neutral. */
  opponentSiteEdge: number;
  /** Chance a benchmark (#25-level) team loses this game: Φ((S_opp + edge − B)/σ). */
  p: number;
  tier: 1 | 2 | 3 | 4;
  /** Opponent's pool record excluding games against this team (Record SOS input). */
  opponentRecord: { wins: number; losses: number; ties: number };
  /** Power weight (recency) and this game's single-game performance, in Power points. */
  powerWeight: number;
  performance: number;
};

export type ScheduledGameExplanation = {
  gameId: string;
  weekIndex: number;
  opponentId: string;
  opponentName: string;
  site: Site;
  opponentStrength: number;
  p: number;
};

export type ExcludedGameExplanation = {
  gameId: string;
  weekIndex: number;
  opponentName: string;
  /** "FBS", "DII", "DIII", or "Non-NCAA". */
  opponentLevel: string | null;
  site: Site;
  pointsFor: number | null;
  pointsAgainst: number | null;
  result: Result | null;
  reason: "opponent_not_in_pool";
};

export type TeamExplanation = {
  games: PoolGameExplanation[];
  remaining: ScheduledGameExplanation[];
  excluded: ExcludedGameExplanation[];
  /** P(benchmark team wins exactly k of these games), for the SOR chart. */
  sorDistribution: number[];
};

export type RecordLine = { wins: number; losses: number; ties: number };

export type TeamRating = {
  teamId: string;
  name: string;
  conferenceId: string | null;

  power: number;
  powerLow: number;
  powerHigh: number;
  powerRank: number;
  powerRankLow: number;
  powerRankHigh: number;

  /** Season strength (no recency). Opponent strength for SOS/SOR, and next season's prior. */
  strength: number;

  sor: number | null;
  sorRank: number | null;
  sorRankLow: number | null;
  sorRankHigh: number | null;

  sos: number | null;
  sosRank: number | null;
  sosRankLow: number | null;
  sosRankHigh: number | null;

  sov: number | null;
  sovRank: number | null;
  sol: number | null;

  recordSos: number | null;
  recordSosRank: number | null;
  owp: number | null;
  oowp: number | null;
  averageOpponentStrength: number | null;

  remainingSos: number | null;
  fullSeasonSos: number | null;

  poolRecord: RecordLine;
  overallRecord: RecordLine;
  poolGames: number;
  tierRecords: [RecordLine, RecordLine, RecordLine, RecordLine];
  isProvisional: boolean;
  explanation: TeamExplanation;
};

export type RatingDiagnostics = {
  homeField: number;
  powerHomeField: number;
  residualSd: number;
  effectiveParameters: number;
  poolGamesPlayed: number;
  averagePoolGames: number;
  connected: boolean;
  components: number;
  leagueProvisional: boolean;
};

export type RatingResult = {
  currentWeekIndex: number;
  diagnostics: RatingDiagnostics;
  teams: TeamRating[];
};
