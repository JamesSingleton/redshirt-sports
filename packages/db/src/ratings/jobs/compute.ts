import { createHash } from "node:crypto";
import { and, desc, eq, inArray, or } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  gamesTable,
  ratingRunsTable,
  ratingSnapshotsTable,
  schoolsTable,
  seasonsTable,
  weeksTable,
} from "../../schema";
import { rateWeek } from "../engine/rate";
import type {
  EngineGame,
  EngineTeam,
  GameStatus,
  RatingResult,
} from "../engine/types";
import { loadMembers } from "./membership";
import type { CalendarWeek, Pool, SeasonCalendar } from "./store";

export type RatingInputs = {
  teams: EngineTeam[];
  games: EngineGame[];
  kickoffById: Map<string, Date>;
  conferenceNameById: Map<string, string | null>;
};

/** Last season's final strength per school: the latest published run, else the latest run. */
async function priorStrengths(
  pool: Pool,
  year: number,
): Promise<Map<string, number>> {
  const [previous] = await db
    .select({ id: seasonsTable.id })
    .from(seasonsTable)
    .where(
      and(
        eq(seasonsTable.sportId, pool.sportId),
        eq(seasonsTable.year, year - 1),
      ),
    )
    .limit(1);
  if (!previous) return new Map();
  const runs = await db
    .select({
      id: ratingRunsTable.id,
      status: ratingRunsTable.status,
      computedAt: ratingRunsTable.computedAt,
      weekId: ratingRunsTable.weekId,
    })
    .from(ratingRunsTable)
    .where(
      and(
        eq(ratingRunsTable.poolId, pool.id),
        eq(ratingRunsTable.seasonId, previous.id),
      ),
    );
  if (runs.length === 0) return new Map();
  const weeks = await db
    .select({ id: weeksTable.id, startDate: weeksTable.startDate })
    .from(weeksTable)
    .where(inArray(weeksTable.id, [...new Set(runs.map((run) => run.weekId))]));
  const start = new Map(
    weeks.map((week) => [week.id, week.startDate.getTime()]),
  );
  const order = (run: (typeof runs)[number]) => [
    start.get(run.weekId) ?? 0,
    run.status === "published" ? 1 : 0,
    run.computedAt.getTime(),
  ];
  runs.sort((a, b) => {
    const [x, y] = [order(a), order(b)];
    return (
      (y[0] ?? 0) - (x[0] ?? 0) ||
      (y[1] ?? 0) - (x[1] ?? 0) ||
      (y[2] ?? 0) - (x[2] ?? 0)
    );
  });
  const finalRun = runs[0];
  if (!finalRun) return new Map();
  const rows = await db
    .select({
      schoolId: ratingSnapshotsTable.schoolId,
      strength: ratingSnapshotsTable.strength,
    })
    .from(ratingSnapshotsTable)
    .where(eq(ratingSnapshotsTable.runId, finalRun.id));
  return new Map(rows.map((row) => [row.schoolId, row.strength]));
}

/** Everything the engine needs for one pool-season, read from Postgres. */
export async function loadRatingInputs(
  pool: Pool,
  calendar: SeasonCalendar,
): Promise<RatingInputs> {
  const members = await loadMembers(pool.id, calendar.seasonId);
  if (members.length === 0) {
    throw new Error(
      `No ${pool.name} members stored for ${calendar.year}. Sync the season first.`,
    );
  }
  const memberIds = members.map((member) => member.schoolId);
  const [schools, priors, gameRows] = await Promise.all([
    db
      .select({
        id: schoolsTable.id,
        name: schoolsTable.name,
        shortName: schoolsTable.shortName,
      })
      .from(schoolsTable)
      .where(inArray(schoolsTable.id, memberIds)),
    priorStrengths(pool, calendar.year),
    db
      .select()
      .from(gamesTable)
      .where(
        and(
          eq(gamesTable.seasonId, calendar.seasonId),
          or(
            inArray(gamesTable.homeSchoolId, memberIds),
            inArray(gamesTable.awaySchoolId, memberIds),
          ),
        ),
      ),
  ]);
  const conferenceNameById = new Map(
    members.map((member) => [member.schoolId, member.conferenceName]),
  );
  const nameById = new Map(
    schools.map((school) => [
      school.id,
      school.shortName ?? school.name ?? school.id,
    ]),
  );
  // Members show their Redshirt short name; anyone else their school name ("Arizona")
  // with the level kept separately for a badge.
  const sideLabel = (
    schoolId: string | null,
    name: string,
    shortName: string | null,
  ) => (schoolId ? nameById.get(schoolId) : undefined) ?? shortName ?? name;
  const levelOf = (schoolId: string | null, level: string | null) =>
    schoolId && nameById.has(schoolId) ? null : (level ?? "Non-NCAA");
  const weekById = new Map(calendar.weeks.map((week) => [week.id, week]));

  const teams: EngineTeam[] = members.map((member) => ({
    id: member.schoolId,
    name: nameById.get(member.schoolId) ?? member.schoolId,
    conferenceId: member.conferenceId,
    priorStrength: priors.get(member.schoolId) ?? null,
  }));

  const kickoffById = new Map<string, Date>();
  const games: EngineGame[] = [];
  for (const row of gameRows) {
    const week = row.weekId ? weekById.get(row.weekId) : undefined;
    if (!week) continue;
    const homeId =
      row.homeSchoolId ??
      `ext:${row.source}:${row.homeExternalId ?? row.homeName}`;
    const awayId =
      row.awaySchoolId ??
      `ext:${row.source}:${row.awayExternalId ?? row.awayName}`;
    if (row.kickoffAt) kickoffById.set(row.id, row.kickoffAt);
    games.push({
      id: row.id,
      weekIndex: week.index,
      homeId,
      awayId,
      homeName: sideLabel(row.homeSchoolId, row.homeName, row.homeShortName),
      awayName: sideLabel(row.awaySchoolId, row.awayName, row.awayShortName),
      homeLevel: levelOf(row.homeSchoolId, row.homeLevel),
      awayLevel: levelOf(row.awaySchoolId, row.awayLevel),
      homeScore: row.homeScore,
      awayScore: row.awayScore,
      neutralSite: row.neutralSite,
      overtime: row.overtime,
      status: row.status as GameStatus,
    });
  }
  games.sort((a, b) => a.weekIndex - b.weekIndex || a.id.localeCompare(b.id));
  return { teams, games, kickoffById, conferenceNameById };
}

/** Restrict to games through `week` for the checksum and the "through" time. */
export function gamesThrough(
  inputs: RatingInputs,
  week: CalendarWeek,
): EngineGame[] {
  return inputs.games.filter((game) => game.weekIndex <= week.index);
}

/**
 * sha256 over everything that can change a published number: the counted games
 * (scores, site, overtime, status), every scheduled game (remaining SOS), the
 * members and their priors, the as-of week, and the full config.
 */
export function ratingChecksum(
  pool: Pool,
  week: CalendarWeek,
  inputs: RatingInputs,
): string {
  const payload = {
    methodVersion: pool.methodVersion,
    config: pool.config,
    week: week.index,
    teams: [...inputs.teams]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((team) => [team.id, team.priorStrength]),
    games: inputs.games.map((game) => [
      game.id,
      game.weekIndex,
      game.homeId,
      game.awayId,
      game.homeScore,
      game.awayScore,
      game.neutralSite,
      game.overtime,
      game.status,
    ]),
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export type ComputeOutcome =
  | { status: "skipped"; reason: string; runId: string }
  | {
      status: "computed";
      runId: string;
      result: RatingResult;
      checksum: string;
    };

/** Compute a pool as of a week and store it as a draft run. Skips if nothing changed. */
export async function computeRun(input: {
  pool: Pool;
  calendar: SeasonCalendar;
  week: CalendarWeek;
  trigger: "cron" | "admin" | "cli";
  force?: boolean;
  inputs?: RatingInputs;
}): Promise<ComputeOutcome> {
  const { pool, calendar, week } = input;
  const inputs = input.inputs ?? (await loadRatingInputs(pool, calendar));
  const checksum = ratingChecksum(pool, week, inputs);

  if (!input.force) {
    const [latest] = await db
      .select({ id: ratingRunsTable.id, checksum: ratingRunsTable.checksum })
      .from(ratingRunsTable)
      .where(
        and(
          eq(ratingRunsTable.poolId, pool.id),
          eq(ratingRunsTable.weekId, week.id),
        ),
      )
      .orderBy(desc(ratingRunsTable.computedAt))
      .limit(1);
    if (latest?.checksum === checksum) {
      return {
        status: "skipped",
        reason: "inputs unchanged since the last run",
        runId: latest.id,
      };
    }
  }

  const result = rateWeek({
    teams: inputs.teams,
    games: inputs.games,
    currentWeekIndex: week.index,
    config: pool.config,
  });
  // "Through" = the latest kickoff among the finals this run counts.
  let throughAt: Date | null = null;
  for (const game of gamesThrough(inputs, week)) {
    const kickoff = inputs.kickoffById.get(game.id);
    if (
      game.status === "final" &&
      kickoff &&
      (!throughAt || kickoff > throughAt)
    ) {
      throughAt = kickoff;
    }
  }

  const runId = await db.transaction(async (tx) => {
    const [run] = await tx
      .insert(ratingRunsTable)
      .values({
        poolId: pool.id,
        seasonId: calendar.seasonId,
        weekId: week.id,
        throughAt,
        methodVersion: pool.methodVersion,
        params: pool.config,
        diagnostics: result.diagnostics,
        checksum,
        gameCount: result.diagnostics.poolGamesPlayed,
        status: "draft",
        trigger: input.trigger,
      })
      .returning({ id: ratingRunsTable.id });
    if (!run) throw new Error("Could not create rating run.");
    const rows = result.teams.map((team) => ({
      runId: run.id,
      schoolId: team.teamId,
      conferenceId: team.conferenceId,
      conferenceName: inputs.conferenceNameById.get(team.teamId) ?? null,
      power: team.power,
      powerLow: team.powerLow,
      powerHigh: team.powerHigh,
      powerRank: team.powerRank,
      powerRankLow: team.powerRankLow,
      powerRankHigh: team.powerRankHigh,
      strength: team.strength,
      sor: team.sor,
      sorRank: team.sorRank,
      sorRankLow: team.sorRankLow,
      sorRankHigh: team.sorRankHigh,
      sos: team.sos,
      sosRank: team.sosRank,
      sosRankLow: team.sosRankLow,
      sosRankHigh: team.sosRankHigh,
      sov: team.sov,
      sovRank: team.sovRank,
      sol: team.sol,
      recordSos: team.recordSos,
      recordSosRank: team.recordSosRank,
      owp: team.owp,
      oowp: team.oowp,
      averageOpponentStrength: team.averageOpponentStrength,
      remainingSos: team.remainingSos,
      fullSeasonSos: team.fullSeasonSos,
      poolWins: team.poolRecord.wins,
      poolLosses: team.poolRecord.losses,
      poolTies: team.poolRecord.ties,
      overallWins: team.overallRecord.wins,
      overallLosses: team.overallRecord.losses,
      overallTies: team.overallRecord.ties,
      poolGames: team.poolGames,
      tierRecords: team.tierRecords,
      isProvisional: team.isProvisional,
      explanation: team.explanation,
    }));
    for (let start = 0; start < rows.length; start += 100) {
      await tx
        .insert(ratingSnapshotsTable)
        .values(rows.slice(start, start + 100));
    }
    return run.id;
  });

  return { status: "computed", runId, result, checksum };
}
