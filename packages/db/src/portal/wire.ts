import type { PublishedWireRow } from "./published";

/** A school as the wire shows it: name and a slim logo (no alt, caption, or preview). */
export interface WireSchool {
  name: string | null;
  shortName: string | null;
  abbreviation: string | null;
  slug: string | null;
  /** Sanity image fields `TeamMark` needs, or null for no logo. */
  image: unknown;
}

/** A division or subdivision (FBS, FCS, Mid-Major, Power Conferences). */
export interface WireLevel {
  name: string;
  slug: string;
  /** The division a subdivision belongs to (FBS → NCAA DI); null for a division. */
  parentId: string | null;
}

export interface WireConference {
  name: string | null;
  shortName: string | null;
}

/**
 * One sport's wire for one cycle: every published move, newest first, with
 * the schools, levels, and conferences they name. The page and
 * `/api/v1/college/[sport]/transfer-portal/[year]` both serve this.
 */
export interface PortalWireData {
  v: 1;
  sport: { slug: string; name: string };
  cycleYear: number;
  rows: PublishedWireRow[];
  schools: Record<string, WireSchool>;
  levels: Record<string, WireLevel>;
  conferences: Record<string, WireConference>;
}

/**
 * The cycle a date falls in: the season a player moving now would next play.
 * The football window opens in December, basketball's in March; both belong
 * to the following season from July on.
 */
export function currentCycleYear(now = new Date()) {
  return now.getUTCMonth() >= 6
    ? now.getUTCFullYear() + 1
    : now.getUTCFullYear();
}

/** The school, level, and conference ids a set of wire rows name. */
export function wireReferences(rows: PublishedWireRow[]) {
  const schools = new Set<string>();
  const levels = new Set<string>();
  const conferences = new Set<string>();
  for (const row of rows) {
    if (row.schoolId) schools.add(row.schoolId);
    for (const stop of row.path ?? []) {
      if (stop.schoolId) schools.add(stop.schoolId);
    }
    for (const place of [row.origin, row.destination]) {
      if (!place) continue;
      if (place.schoolId) schools.add(place.schoolId);
      if (place.divisionId) levels.add(place.divisionId);
      if (place.subdivisionId) levels.add(place.subdivisionId);
      if (place.conferenceId) conferences.add(place.conferenceId);
    }
  }
  return { schools, levels, conferences };
}

/**
 * The wire cut to its `players` most recently active players (every move of
 * theirs kept, so no history is cut in half), with only the schools, levels,
 * and conferences those rows name. The page renders this; the browser fetches
 * the whole cycle as JSON only when someone filters or asks for more.
 */
export function sliceWire(
  data: PortalWireData,
  players: number,
): PortalWireData {
  const keep = new Set<number>();
  for (const row of data.rows) {
    if (keep.size >= players) break;
    keep.add(row.recruitmentId);
  }
  const rows = data.rows.filter((row) => keep.has(row.recruitmentId));
  const { schools, conferences } = wireReferences(rows);
  const pick = <T>(all: Record<string, T>, ids: Set<string>) =>
    Object.fromEntries(Object.entries(all).filter(([id]) => ids.has(id)));
  return {
    ...data,
    rows,
    schools: pick(data.schools, schools),
    // Every level stays: the division filter offers the sport's whole tree.
    levels: data.levels,
    conferences: pick(data.conferences, conferences),
  };
}

/** Distinct players (recruitments) in a set of wire rows. */
export function wirePlayerCount(rows: PublishedWireRow[]) {
  return new Set(rows.map((row) => row.recruitmentId)).size;
}
