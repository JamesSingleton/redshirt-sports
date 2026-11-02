import {
  fetchEspnGroupMembers,
  fetchEspnScoreboard,
  fetchNcaaScoreboard,
  type ScoreGame,
} from "@redshirt-sports/clients/scores";
import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import { gamesTable } from "../../schema";
import { dedupeKey } from "./dedupe";
import { loadExternalIdMap } from "./membership";
import type { CalendarWeek, Pool, SeasonCalendar } from "./store";

export { dedupeKey } from "./dedupe";

/** The calendar week a game belongs to: the provider's week when given, else its kickoff date. */
export function weekForGame(
  calendar: SeasonCalendar,
  game: ScoreGame,
): CalendarWeek | null {
  if (game.seasonType != null && game.weekNumber != null) {
    const byNumber = calendar.weeks.find(
      (week) =>
        week.seasonType === game.seasonType && week.number === game.weekNumber,
    );
    if (byNumber) return byNumber;
  }
  if (!game.kickoffAt) return null;
  const time = new Date(game.kickoffAt).getTime();
  return (
    calendar.weeks.find(
      (week) =>
        week.startDate.getTime() <= time && time < week.endDate.getTime(),
    ) ?? null
  );
}

export type WeekSync = {
  week: string;
  source: "espn" | "ncaa";
  games: number;
  skipped: number;
  note?: string;
};

function daysIn(week: CalendarWeek, until: Date): string[] {
  const days: string[] = [];
  const end = Math.min(week.endDate.getTime(), until.getTime() + 86_400_000);
  for (let time = week.startDate.getTime(); time < end; time += 86_400_000) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

async function fetchWeekFromEspn(
  pool: Pool,
  calendar: SeasonCalendar,
  week: CalendarWeek,
  now: Date,
) {
  const base = {
    espnLeague: pool.source.espnLeague,
    groups: pool.source.scoreboardGroups,
    regulationPeriods: pool.source.regulationPeriods,
  };
  if (pool.schedule.cadence === "weekly") {
    return fetchEspnScoreboard({
      ...base,
      query: {
        seasonYear: calendar.year,
        seasonType: week.seasonType,
        week: week.number,
      },
    });
  }
  const games: ScoreGame[] = [];
  let skipped = 0;
  for (const date of daysIn(week, now)) {
    const day = await fetchEspnScoreboard({ ...base, query: { date } });
    games.push(...day.games);
    skipped += day.skipped;
  }
  return { games, skipped };
}

/**
 * Pull one week's games into `games`. ESPN is the source of record. If ESPN fails
 * for the week in progress and the pool has an NCAA path, final NCAA games are
 * stored instead; ESPN rows replace them on the next successful sync.
 */
export async function syncWeek(input: {
  pool: Pool;
  calendar: SeasonCalendar;
  week: CalendarWeek;
  now: Date;
  allowFallback: boolean;
  /** ESPN team id → level that season ("FBS", "DII"…); see loadTeamLevels. */
  levels?: Map<string, string>;
}): Promise<WeekSync> {
  const { pool, calendar, week, now } = input;
  let source: "espn" | "ncaa" = "espn";
  let fetched: { games: ScoreGame[]; skipped: number };
  let note: string | undefined;
  try {
    fetched = await fetchWeekFromEspn(pool, calendar, week, now);
  } catch (error) {
    if (
      !input.allowFallback ||
      !pool.source.ncaaPath ||
      pool.schedule.cadence !== "weekly"
    ) {
      throw error;
    }
    note = `ESPN failed (${error instanceof Error ? error.message : String(error)}); used NCAA finals.`;
    source = "ncaa";
    const ncaa = await fetchNcaaScoreboard({
      ncaaPath: pool.source.ncaaPath,
      seasonYear: calendar.year,
      week: week.number,
    });
    fetched = {
      games: ncaa.games.filter(
        (game) =>
          game.status === "final" &&
          game.home.score != null &&
          game.away.score != null,
      ),
      skipped: ncaa.skipped,
    };
  }

  const ids = await loadExternalIdMap(source);
  // Levels come from ESPN ids; NCAA-fallback rows stay unlabeled until ESPN replaces them.
  const levelOf = (externalId: string | null) =>
    source === "espn" && externalId
      ? (input.levels?.get(externalId) ?? null)
      : null;
  const rows = fetched.games.flatMap((game) => {
    const gameWeek = weekForGame(calendar, game) ?? week;
    const homeSchoolId = game.home.externalId
      ? (ids.get(game.home.externalId) ?? null)
      : null;
    const awaySchoolId = game.away.externalId
      ? (ids.get(game.away.externalId) ?? null)
      : null;
    return [
      {
        seasonId: calendar.seasonId,
        weekId: gameWeek.id,
        seasonType: gameWeek.seasonType,
        homeSchoolId,
        awaySchoolId,
        homeExternalId: game.home.externalId,
        awayExternalId: game.away.externalId,
        homeName: game.home.name,
        awayName: game.away.name,
        homeShortName: game.home.shortName,
        awayShortName: game.away.shortName,
        homeLevel: levelOf(game.home.externalId),
        awayLevel: levelOf(game.away.externalId),
        homeScore: game.home.score,
        awayScore: game.away.score,
        neutralSite: game.neutralSite,
        overtime: game.overtime,
        status: game.status,
        kickoffAt: game.kickoffAt ? new Date(game.kickoffAt) : null,
        source: game.source,
        sourceGameId: game.sourceGameId,
        dedupeKey: dedupeKey(
          game.kickoffAt,
          { schoolId: homeSchoolId, name: game.home.name },
          { schoolId: awaySchoolId, name: game.away.name },
        ),
      },
    ];
  });
  // One row per key within a fetch (a provider listing a game twice keeps the last).
  const unique = [...new Map(rows.map((row) => [row.dedupeKey, row])).values()];

  if (unique.length > 0) {
    await db.transaction(async (tx) => {
      const keys = unique.map((row) => row.dedupeKey);
      if (source === "espn") {
        // ESPN wins: drop fallback rows and stale ESPN ids for the same games.
        const sourceIds = unique.map((row) => row.sourceGameId);
        await tx
          .delete(gamesTable)
          .where(
            and(
              eq(gamesTable.seasonId, calendar.seasonId),
              inArray(gamesTable.dedupeKey, keys),
              sql`not (${gamesTable.source} = 'espn' and ${gamesTable.sourceGameId} in ${sourceIds})`,
            ),
          );
        await tx
          .insert(gamesTable)
          .values(unique)
          .onConflictDoUpdate({
            target: [gamesTable.source, gamesTable.sourceGameId],
            set: {
              seasonId: sql`excluded.season_id`,
              weekId: sql`excluded.week_id`,
              seasonType: sql`excluded.season_type`,
              homeSchoolId: sql`excluded.home_school_id`,
              awaySchoolId: sql`excluded.away_school_id`,
              homeExternalId: sql`excluded.home_external_id`,
              awayExternalId: sql`excluded.away_external_id`,
              homeName: sql`excluded.home_name`,
              awayName: sql`excluded.away_name`,
              homeShortName: sql`excluded.home_short_name`,
              awayShortName: sql`excluded.away_short_name`,
              homeLevel: sql`excluded.home_level`,
              awayLevel: sql`excluded.away_level`,
              homeScore: sql`excluded.home_score`,
              awayScore: sql`excluded.away_score`,
              neutralSite: sql`excluded.neutral_site`,
              overtime: sql`excluded.overtime`,
              status: sql`excluded.status`,
              kickoffAt: sql`excluded.kickoff_at`,
              dedupeKey: sql`excluded.dedupe_key`,
              updatedAt: sql`now()`,
            },
          });
      } else {
        // NCAA never overwrites an ESPN game; it only fills gaps.
        const taken = await tx
          .select({ key: gamesTable.dedupeKey })
          .from(gamesTable)
          .where(
            and(
              eq(gamesTable.seasonId, calendar.seasonId),
              inArray(gamesTable.dedupeKey, keys),
              ne(gamesTable.source, "ncaa"),
            ),
          );
        const takenKeys = new Set(taken.map((row) => row.key));
        const fresh = unique.filter((row) => !takenKeys.has(row.dedupeKey));
        if (fresh.length > 0) {
          await tx
            .insert(gamesTable)
            .values(fresh)
            .onConflictDoUpdate({
              target: [gamesTable.source, gamesTable.sourceGameId],
              set: {
                homeScore: sql`excluded.home_score`,
                awayScore: sql`excluded.away_score`,
                status: sql`excluded.status`,
                overtime: sql`excluded.overtime`,
                updatedAt: sql`now()`,
              },
            });
        }
      }
    });
  }

  return {
    week: `${calendar.year} ${week.label}`,
    source,
    games: unique.length,
    skipped: fetched.skipped,
    note,
  };
}

/**
 * Each ESPN team's level for a season, from the pool's levelGroups
 * (a handful of membership calls per season).
 */
export async function loadTeamLevels(
  pool: Pool,
  seasonYear: number,
): Promise<Map<string, string>> {
  const levels = new Map<string, string>();
  for (const [label, groupId] of Object.entries(pool.source.levelGroups)) {
    const ids = await fetchEspnGroupMembers({
      espnLeague: pool.source.espnLeague,
      groupId,
      seasonYear,
    });
    for (const id of ids) {
      if (!levels.has(id)) levels.set(id, label);
    }
  }
  return levels;
}

/** Re-point stored games at schools after new external ids are mapped. */
export async function relinkGames(seasonId: string): Promise<void> {
  for (const side of ["home", "away"] as const) {
    const school = sql.raw(
      side === "home" ? "home_school_id" : "away_school_id",
    );
    const external = sql.raw(
      side === "home" ? "home_external_id" : "away_external_id",
    );
    await db.execute(sql`
      update games as g
      set ${school} = x.school_id, updated_at = now()
      from school_external_ids as x
      where g.season_id = ${seasonId}
        and x.provider = g.source
        and x.external_id = g.${external}
        and g.${school} is distinct from x.school_id
    `);
  }
}
