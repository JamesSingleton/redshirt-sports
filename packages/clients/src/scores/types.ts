export const SCORE_GAME_STATUSES = [
  "scheduled",
  "in_progress",
  "final",
  "postponed",
  "cancelled",
] as const;

export type ScoreGameStatus = (typeof SCORE_GAME_STATUSES)[number];

/** A game as read from a scoreboard, before it is matched to Redshirt schools. */
export type ScoreGame = {
  source: "espn" | "ncaa";
  sourceGameId: string;
  /** Provider week, when the provider has one. NCAA weeks are remapped by date. */
  seasonType: number | null;
  weekNumber: number | null;
  kickoffAt: string | null;
  neutralSite: boolean;
  overtime: boolean;
  status: ScoreGameStatus;
  home: ScoreSide;
  away: ScoreSide;
};

export type ScoreSide = {
  /** Provider team id: ESPN numeric id, or the NCAA SEO slug. */
  externalId: string | null;
  name: string;
  /** School name without the mascot ("Arizona"), for labels like "Arizona (FBS)". */
  shortName: string;
  score: number | null;
};

export function parseScore(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}
