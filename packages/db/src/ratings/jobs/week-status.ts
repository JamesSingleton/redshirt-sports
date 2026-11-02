const TERMINAL = new Set(["final", "postponed", "cancelled"]);
/** A game this far off doesn't hold the week up: it was moved, and counts next week. */
const HORIZON_MS = 3 * 86_400_000;

export type WeekStatus = {
  total: number;
  final: number;
  inProgress: number;
  scheduled: number;
  postponedOrCancelled: number;
  nextKickoff: Date | null;
  latestKickoff: Date | null;
  /** At least one game is final, everything that kicked off is over, and nothing else starts within three days. */
  complete: boolean;
};

/**
 * Has the week finished? Every game that has kicked off is terminal, none is
 * live, and no remaining game starts within three days. A Monday game (Labor
 * Day, say) holds the week until it ends; a game rescheduled to midweek doesn't.
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
        kickoff.getTime() - now.getTime() < HORIZON_MS
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

/**
 * A published week stops changing this many hours after its last kickoff, so
 * voters see the same numbers until ballots are due. Before then the cron
 * republishes if ESPN corrects a score.
 */
export function weekIsFrozen(
  status: WeekStatus,
  hasPublishedRun: boolean,
  freezeAfterHours: number,
  now: Date,
): boolean {
  if (!hasPublishedRun || !status.latestKickoff) return false;
  return (
    now.getTime() - status.latestKickoff.getTime() >=
    freezeAfterHours * 3_600_000
  );
}
