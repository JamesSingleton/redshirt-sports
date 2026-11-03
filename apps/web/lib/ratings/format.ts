import type { PublishedTeamRow } from "@redshirt-sports/db/ratings";

type RecordLine = { wins: number; losses: number; ties: number };

/** The method is the same for every pool; one page explains it, with each pool's fitted numbers. */
export const RATINGS_METHODOLOGY_PATH = "/ratings/methodology";

/** Paths for one pool's pages. */
export function ratingsPaths(sport: string, pool: string) {
  const base = `/college/${sport}/ratings/${pool}`;
  return {
    latest: base,
    week: (year: number | string, segment: string) =>
      `${base}/${year}/${segment}`,
    teamSheets: (year: number | string, segment: string) =>
      `${base}/${year}/${segment}/team-sheets`,
    seasonWorkbook: (year: number | string) =>
      `/api/ratings/${sport}/${pool}/${year}`,
    data: (year: number | string, segment: string, format: "csv" | "json") =>
      `/api/ratings/${sport}/${pool}/${year}/${segment}?format=${format}`,
    accuracy: `${base}/accuracy`,
  };
}

export function formatRecord(record: RecordLine): string {
  return record.ties > 0
    ? `${record.wins}-${record.losses}-${record.ties}`
    : `${record.wins}-${record.losses}`;
}

/** A 0–1 schedule probability as a 0–100 score with one decimal. */
export function formatScore(value: number | null): string {
  return value == null ? "—" : (value * 100).toFixed(1);
}

/** SOR as "how often a #25-level team matches this record". */
export function formatSor(value: number | null): string {
  if (value == null) return "—";
  const pct = value * 100;
  if (pct < 0.1) return "<0.1%";
  return `${pct < 10 ? pct.toFixed(1) : pct.toFixed(0)}%`;
}

export function formatPoints(value: number | null, signed = true): string {
  if (value == null) return "—";
  const text = Math.abs(value).toFixed(1);
  if (!signed) return text;
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

export function formatRankRange(
  low: number | null,
  high: number | null,
): string | null {
  if (low == null || high == null) return null;
  return low === high ? `${low}` : `${low}–${high}`;
}

export const SORT_KEYS = [
  "sor",
  "power",
  "sos",
  "sov",
  "record-sos",
  "remaining",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export function parseSort(value: string | string[] | undefined): SortKey {
  const key = Array.isArray(value) ? value[0] : value;
  return SORT_KEYS.includes(key as SortKey) ? (key as SortKey) : "sor";
}

/** "asc" is each column's natural order (best rank first); "desc" flips it. */
export type SortDir = "asc" | "desc";

export function parseSortDir(value: string | string[] | undefined): SortDir {
  const dir = Array.isArray(value) ? value[0] : value;
  return dir === "desc" ? "desc" : "asc";
}

/**
 * Where a header link goes: a new column starts in its natural order, the
 * current column flips to descending, and a descending column resets to the
 * default (SOR, best first).
 */
export function sortHref(
  basePath: string,
  column: SortKey,
  current: { sort: SortKey; dir: SortDir },
): string {
  if (column === current.sort) {
    return current.dir === "asc"
      ? `${basePath}?sort=${column}&dir=desc`
      : basePath;
  }
  return column === "sor" ? basePath : `${basePath}?sort=${column}`;
}

type Sortable = Pick<
  PublishedTeamRow,
  | "name"
  | "sorRank"
  | "powerRank"
  | "sosRank"
  | "sovRank"
  | "recordSosRank"
  | "remainingSos"
  | "power"
>;

/**
 * Order rows by a metric's rank. Unranked teams (too few pool games) sort after
 * ranked ones, by power. Remaining SOS has no rank, so it sorts by value.
 * Descending reverses the ranked teams; unranked ones stay at the bottom.
 */
export function sortRows<T extends Sortable>(
  rows: T[],
  key: SortKey,
  dir: SortDir = "asc",
): T[] {
  const ascending = sortRowsAscending(rows, key);
  if (dir === "asc") return ascending;
  const hasValue = (row: T) =>
    key === "remaining" ? row.remainingSos != null : rankOf(row, key) != null;
  return [
    ...ascending.filter(hasValue).reverse(),
    ...ascending.filter((row) => !hasValue(row)),
  ];
}

const RANK_COLUMN = {
  sor: "sorRank",
  power: "powerRank",
  sos: "sosRank",
  sov: "sovRank",
  "record-sos": "recordSosRank",
} as const satisfies Record<Exclude<SortKey, "remaining">, keyof Sortable>;

function rankOf(
  row: Sortable,
  key: Exclude<SortKey, "remaining">,
): number | null {
  return row[RANK_COLUMN[key]];
}

function sortRowsAscending<T extends Sortable>(rows: T[], key: SortKey): T[] {
  if (key === "remaining") {
    return [...rows].sort(
      (a, b) =>
        (b.remainingSos ?? -1) - (a.remainingSos ?? -1) ||
        a.powerRank - b.powerRank,
    );
  }
  return [...rows].sort((a, b) => {
    const ra = rankOf(a, key);
    const rb = rankOf(b, key);
    if (ra != null && rb != null)
      return ra - rb || a.name.localeCompare(b.name);
    if (ra != null) return -1;
    if (rb != null) return 1;
    return a.powerRank - b.powerRank || a.name.localeCompare(b.name);
  });
}

export function siteLabel(site: "home" | "away" | "neutral"): string {
  return site === "home" ? "vs" : site === "away" ? "at" : "vs (N)";
}

export function formatThrough(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}
