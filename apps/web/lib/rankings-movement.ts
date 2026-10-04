import { TOP_25 } from "@/lib/constants";

export type RankingTeamRef = {
  _id: string;
  rank: number | null;
  _points: number;
  shortName?: string | null;
  abbreviation?: string | null;
  name?: string | null;
  slug?: string | null;
};

export type Movement =
  | { kind: "up"; delta: number }
  | { kind: "down"; delta: number }
  | { kind: "same" }
  | { kind: "nr" };

/**
 * Previous week with rankings for the same year/division.
 * Weeks are legacy ints (0 / 1–N / 999) sorted ascending = chronological.
 */
export function getPreviousWeek(
  weeks: { week: number }[],
  current: number,
): number | undefined {
  const idx = weeks.findIndex((w) => w.week === current);
  if (idx <= 0) return undefined;
  return weeks[idx - 1]?.week;
}

export function buildRankBySchoolId(
  rankings: RankingTeamRef[],
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const team of rankings) {
    map.set(team._id, team.rank);
  }
  return map;
}

function isTop25Rank(rank: number | null | undefined): rank is number {
  return typeof rank === "number" && rank > 0 && rank <= TOP_25;
}

/**
 * Movement for a team currently in the Top 25 vs its previous-week rank.
 * Previous outside Top 25 (or missing) → NR.
 */
export function getMovement(
  currentRank: number | null,
  previousRank: number | null | undefined,
): Movement {
  if (!isTop25Rank(currentRank)) {
    return { kind: "nr" };
  }

  if (!isTop25Rank(previousRank)) {
    return { kind: "nr" };
  }

  const delta = previousRank - currentRank;
  if (delta > 0) return { kind: "up", delta };
  if (delta < 0) return { kind: "down", delta: Math.abs(delta) };
  return { kind: "same" };
}

export type WeekHighlights<T extends RankingTeamRef> = {
  riser: { team: T; delta: number } | null;
  faller: { team: T; delta: number } | null;
  newcomers: T[];
};

/** Biggest move each way and newly ranked teams among this week's Top 25. */
export function getWeekHighlights<T extends RankingTeamRef>(
  top25: T[],
  previousRankById: Map<string, number | null>,
): WeekHighlights<T> {
  const highlights: WeekHighlights<T> = {
    riser: null,
    faller: null,
    newcomers: [],
  };

  for (const team of top25) {
    const movement = getMovement(team.rank, previousRankById.get(team._id));
    if (movement.kind === "nr") {
      highlights.newcomers.push(team);
    } else if (
      movement.kind === "up" &&
      movement.delta > (highlights.riser?.delta ?? 0)
    ) {
      highlights.riser = { team, delta: movement.delta };
    } else if (
      movement.kind === "down" &&
      movement.delta > (highlights.faller?.delta ?? 0)
    ) {
      highlights.faller = { team, delta: movement.delta };
    }
  }

  return highlights;
}

export function displayName(team: RankingTeamRef): string {
  return team.shortName ?? team.abbreviation ?? team.name ?? "Unknown";
}

/**
 * Teams that had votes last week but do not appear in the current rankings at all.
 */
export function getDroppedFromVotes(
  previous: RankingTeamRef[],
  current: RankingTeamRef[],
): RankingTeamRef[] {
  const currentIds = new Set(current.map((t) => t._id));
  return previous.filter((t) => t._points > 0 && !currentIds.has(t._id));
}

export type DroppedOutTeam = RankingTeamRef & { previousRank: number };

/**
 * Teams that were Top 25 last week and are not Top 25 this week
 * (still receiving votes or off the ballot entirely).
 * Sorted by previous rank ascending.
 */
export function getDroppedOutOfTop25(
  previous: RankingTeamRef[],
  current: RankingTeamRef[],
): DroppedOutTeam[] {
  const currentRankById = buildRankBySchoolId(current);

  return previous
    .flatMap((team) => {
      if (!isTop25Rank(team.rank)) return [];
      const currentRank = currentRankById.get(team._id);
      if (isTop25Rank(currentRank)) return [];
      return [{ ...team, previousRank: team.rank }];
    })
    .sort((a, b) => a.previousRank - b.previousRank);
}
