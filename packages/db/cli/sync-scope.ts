/**
 * Which production rows a local sync copies.
 *
 * Reference data (sports, schools, conferences, polls, users, seasons, weeks,
 * players…) is copied whole. Tables that grow every season are copied only for
 * seasons with `year >= since`, which is where nearly all of production's
 * bytes are and so where a sync's egress goes.
 *
 * Season `year` is the year a season ends in: football 2026 is the fall of
 * 2026, basketball 2027 is 2026-27. `since = 2026` therefore keeps football
 * 2026 and both basketball 2026 (2025-26) and 2027 (2026-27).
 */

export interface ScopedTable {
  table: string;
  /** A boolean SQL condition on the table's own columns, with no parameters. */
  where: string;
}

/** Every season the sync keeps. */
const seasons = (since: number) =>
  `select id from public.seasons where year >= ${since}`;

const weeks = (since: number) => `
  select w.id from public.weeks w
  join public.season_types st on st.id = w.season_type_id
  where st.season_id in (${seasons(since)})`;

const runs = (since: number) =>
  `select id from public.rating_runs where season_id in (${seasons(since)})`;

const ballots = (since: number) =>
  `select id from public.ballots where week_id in (${weeks(since)})`;

const editions = (since: number) =>
  `select id from public.bracket_editions where season_id in (${seasons(since)})`;

export function assertSinceYear(value: unknown): number {
  const year = Number(value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error(`--since needs a four-digit year, got ${String(value)}.`);
  }
  return year;
}

/**
 * The season-scoped tables and the rows of each to copy. Every table that
 * references one of these is also in the list, so restoring foreign keys
 * afterwards cannot find a row pointing at something that wasn't copied.
 */
export function scopedTables(sinceInput: number): ScopedTable[] {
  const since = assertSinceYear(sinceInput);
  return [
    { table: "games", where: `season_id in (${seasons(since)})` },
    { table: "rating_pool_members", where: `season_id in (${seasons(since)})` },
    { table: "rating_runs", where: `season_id in (${seasons(since)})` },
    { table: "rating_snapshots", where: `run_id in (${runs(since)})` },
    {
      // Jobs point at a run when they made one; the rest are kept by date.
      table: "rating_jobs",
      where: `run_id in (${runs(since)}) or (run_id is null and started_at >= (
        select coalesce(min(start_date), make_date(${since}, 1, 1))
        from public.seasons where year >= ${since}))`,
    },
    { table: "ballots", where: `week_id in (${weeks(since)})` },
    { table: "ballot_entries", where: `ballot_id in (${ballots(since)})` },
    { table: "poll_rankings", where: `week_id in (${weeks(since)})` },
    { table: "poll_missed_ballots", where: `week_id in (${weeks(since)})` },
    // Legacy tables: no foreign keys, filtered the same way.
    { table: "weekly_team_rankings", where: `week_id in (${weeks(since)})` },
    { table: "voter_ballot", where: `year >= ${since}` },
    { table: "weekly_final_rankings", where: `year >= ${since}` },
    { table: "bracket_editions", where: `season_id in (${seasons(since)})` },
    { table: "bracket_slots", where: `edition_id in (${editions(since)})` },
    { table: "bracket_games", where: `edition_id in (${editions(since)})` },
  ];
}

/**
 * The earliest season year still in progress, so a default sync keeps the
 * current football season through its bowls and basketball through March.
 */
export const DEFAULT_SINCE_SQL = `
  select coalesce(
    (select min(year) from public.seasons where now() between start_date and end_date),
    (select max(year) from public.seasons)
  )::int as since`;
