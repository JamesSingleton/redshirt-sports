import type { ProviderMembership, SportSlug } from "./plan";

/**
 * Division II and III basketball conferences for the current season, from
 * stats.ncaa.org's team lists (one page per conference). That site refuses
 * scripted requests, so the lists are saved from a browser into a snapshot
 * file and read from there.
 */
export type NcaaStatsSnapshot = {
  /** Academic year the lists are for, e.g. "2026-27". */
  season: string;
  collectedAt?: string;
  rows: Array<{
    sport: "MBB" | "WBB";
    /** 2 or 3. */
    div: number;
    /** Conference as stats.ncaa.org names it ("CACC", "NE10", "Little East"). */
    conf: string;
    /** Teams by stats.ncaa.org's short name ("Alas. Anchorage"). */
    teams: string[];
  }>;
};

const SPORTS: Record<NcaaStatsSnapshot["rows"][number]["sport"], SportSlug> = {
  MBB: "mens-basketball",
  WBB: "womens-basketball",
};

/**
 * Memberships from a snapshot. stats.ncaa.org shows only short names; the
 * NCAA scoreboard feed uses the same short names and also has the full
 * name ("Alas. Anchorage" → "University of Alaska Anchorage"), which the
 * school matcher needs. Teams the feed never saw keep their short name.
 */
export function ncaaStatsMemberships(
  snapshot: NcaaStatsSnapshot,
  feed: ProviderMembership[],
): ProviderMembership[] {
  const byShortName = new Map<string, ProviderMembership["team"]>();
  for (const membership of feed) {
    const short = membership.team.location;
    if (membership.source === "ncaa" && short && !byShortName.has(short)) {
      byShortName.set(short, membership.team);
    }
  }

  return snapshot.rows.flatMap((row) =>
    row.teams.map((name) => {
      const known = byShortName.get(name);
      return {
        source: "ncaa-stats" as const,
        season: snapshot.season,
        sport: SPORTS[row.sport],
        division: `d${row.div}`,
        conference: { name: row.conf, abbreviation: row.conf },
        team: {
          location: name,
          displayName: known?.displayName ?? name,
          mascot: known?.mascot ?? null,
          abbreviation: known?.abbreviation ?? null,
        },
      };
    }),
  );
}
