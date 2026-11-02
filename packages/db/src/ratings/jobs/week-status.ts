const TERMINAL = new Set(["final", "postponed", "cancelled"]);
const DAY_MS = 86_400_000;

export type WeekStatus = {
  total: number;
  final: number;
  inProgress: number;
  scheduled: number;
  postponedOrCancelled: number;
  nextKickoff: Date | null;
  latestKickoff: Date | null;
  /** At least one game is final, everything that kicked off is over, and nothing else starts within a day. */
  complete: boolean;
};

/**
 * Has the weekend finished? Every game that has kicked off is terminal, none is
 * live, and no remaining game starts within 24 hours. A lone Monday game doesn't
 * hold up Sunday's publish; it counts in the next weekend's ratings.
 */
export function weekStatus(
  games: Array<{ status: string; kickoffAt: Date | null }>,
  now: Date,
): WeekStatus {
  let final = 0;
  let inProgress = 0;
  let scheduled = 0;
  let postponedOrCancelled = 0;
  let nextKickoff: Date | null = null;
  let latestKickoff: Date | null = null;
  let blocking = false;
  for (const game of games) {
    if (game.status === "final") final += 1;
    else if (game.status === "in_progress") inProgress += 1;
    else if (TERMINAL.has(game.status)) postponedOrCancelled += 1;
    else scheduled += 1;
    const kickoff = game.kickoffAt;
    if (
      kickoff &&
      kickoff <= now &&
      (!latestKickoff || kickoff > latestKickoff)
    )
      latestKickoff = kickoff;
    if (!TERMINAL.has(game.status)) {
      if (
        !kickoff ||
        kickoff <= now ||
        kickoff.getTime() - now.getTime() < DAY_MS
      )
        blocking = true;
      if (kickoff && kickoff > now && (!nextKickoff || kickoff < nextKickoff))
        nextKickoff = kickoff;
    }
  }
  return {
    total: games.length,
    final,
    inProgress,
    scheduled,
    postponedOrCancelled,
    nextKickoff,
    latestKickoff,
    // A week with nothing played isn't "complete", however far off its games are.
    complete: final > 0 && !blocking,
  };
}

/** The latest of these weeks (in calendar order) that has at least one final game. */
export function latestPlayedWeek<W>(
  weeks: Array<{ week: W; status: WeekStatus }>,
): { week: W; status: WeekStatus } | null {
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    const entry = weeks[i];
    if (entry && entry.status.final > 0) return entry;
  }
  return null;
}
