import { fetchEspnTeam } from "@redshirt-sports/clients/scores";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  ratingJobsTable,
  ratingPoolsTable,
  ratingRunsTable,
  ratingSnapshotsTable,
  schoolExternalIdsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  weeksTable,
} from "../../schema";
import { loadMembers, resolveMembership } from "./membership";
import { loadWeekGames } from "./pipeline";
import { loadSeasonCalendar, type Pool, seasonYearAt, weekAt } from "./store";
import { suggestSchools } from "./team-matching";
import { weekStatus } from "./week-status";

export type RunSummary = {
  id: string;
  year: number;
  weekId: string;
  weekLabel: string;
  status: "draft" | "published" | "superseded";
  trigger: string;
  checksum: string;
  gameCount: number;
  computedAt: string;
  publishedAt: string | null;
  publishedBy: string | null;
  blockers: number;
};

function weekLabel(seasonType: number, number: number) {
  return seasonType === 3 ? "Postseason" : `Week ${number}`;
}

export async function listRuns(
  poolId: string,
  limit = 40,
): Promise<RunSummary[]> {
  const rows = await db
    .select({
      id: ratingRunsTable.id,
      year: seasonsTable.year,
      weekId: ratingRunsTable.weekId,
      weekNumber: weeksTable.number,
      seasonTypeId: weeksTable.seasonTypeId,
      status: ratingRunsTable.status,
      trigger: ratingRunsTable.trigger,
      checksum: ratingRunsTable.checksum,
      gameCount: ratingRunsTable.gameCount,
      computedAt: ratingRunsTable.computedAt,
      publishedAt: ratingRunsTable.publishedAt,
      publishedBy: ratingRunsTable.publishedBy,
      diagnostics: ratingRunsTable.diagnostics,
      weekStart: weeksTable.startDate,
    })
    .from(ratingRunsTable)
    .innerJoin(weeksTable, eq(weeksTable.id, ratingRunsTable.weekId))
    .innerJoin(seasonsTable, eq(seasonsTable.id, ratingRunsTable.seasonId))
    .where(eq(ratingRunsTable.poolId, poolId))
    .orderBy(desc(weeksTable.startDate), desc(ratingRunsTable.computedAt))
    .limit(limit);
  const types = await seasonTypesFor(rows.map((row) => row.seasonTypeId));
  return rows.map((row) => ({
    id: row.id,
    year: row.year,
    weekId: row.weekId,
    weekLabel: weekLabel(types.get(row.seasonTypeId) ?? 2, row.weekNumber),
    status: row.status as RunSummary["status"],
    trigger: row.trigger,
    checksum: row.checksum,
    gameCount: row.gameCount,
    computedAt: row.computedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    publishedBy: row.publishedBy,
    blockers: (
      (row.diagnostics as { unmappedMembers?: Array<{ games: number }> })
        ?.unmappedMembers ?? []
    ).filter((blocker) => blocker.games > 0).length,
  }));
}

async function seasonTypesFor(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: seasonTypesTable.id, type: seasonTypesTable.type })
    .from(seasonTypesTable)
    .where(inArray(seasonTypesTable.id, [...new Set(ids)]));
  return new Map(rows.map((row) => [row.id, row.type]));
}

export async function listJobs(poolId: string, limit = 30) {
  const rows = await db
    .select()
    .from(ratingJobsTable)
    .where(eq(ratingJobsTable.poolId, poolId))
    .orderBy(desc(ratingJobsTable.startedAt))
    .limit(limit);
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    trigger: row.trigger,
    status: row.status,
    actor: row.actor,
    lines: (row.lines as string[]) ?? [],
    error: row.error,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  }));
}

export type PoolOverview = {
  year: number | null;
  week: { id: string; label: string } | null;
  weeks: Array<{ id: string; label: string }>;
  members: number;
  status: ReturnType<typeof weekStatus> | null;
};

/** What the admin card shows: this week's games and the season's weeks. */
export async function poolOverview(
  pool: Pool,
  now = new Date(),
): Promise<PoolOverview> {
  const year = await seasonYearAt(pool.sportId, now);
  if (year == null)
    return { year: null, week: null, weeks: [], members: 0, status: null };
  const calendar = await loadSeasonCalendar(pool.sportId, year);
  const week = weekAt(calendar, now);
  const members = await loadMembers(pool.id, calendar.seasonId);
  const status = week
    ? weekStatus(
        await loadWeekGames(
          calendar,
          week,
          members.map((m) => m.schoolId),
        ),
        now,
      )
    : null;
  return {
    year,
    week: week ? { id: week.id, label: week.label } : null,
    weeks: calendar.weeks.map((w) => ({ id: w.id, label: w.label })),
    members: members.length,
    status,
  };
}

export type RunDiffRow = {
  schoolId: string;
  name: string;
  sorRank: number | null;
  previousSorRank: number | null;
  powerRank: number;
  previousPowerRank: number | null;
  sosRank: number | null;
  previousSosRank: number | null;
};

/**
 * Every team in a run, in SOR order, against the run currently published for the same week
 * (or, if none, the latest published run before it), for review before publishing.
 */
export async function runDiff(
  runId: string,
): Promise<{ against: string | null; rows: RunDiffRow[] }> {
  const [run] = await db
    .select({
      poolId: ratingRunsTable.poolId,
      weekId: ratingRunsTable.weekId,
      computedAt: ratingRunsTable.computedAt,
    })
    .from(ratingRunsTable)
    .where(eq(ratingRunsTable.id, runId))
    .limit(1);
  if (!run) throw new Error(`No rating run ${runId}.`);
  const [sameWeek] = await db
    .select({ id: ratingRunsTable.id })
    .from(ratingRunsTable)
    .where(
      and(
        eq(ratingRunsTable.poolId, run.poolId),
        eq(ratingRunsTable.weekId, run.weekId),
        eq(ratingRunsTable.status, "published"),
      ),
    )
    .limit(1);
  let againstId = sameWeek?.id !== runId ? (sameWeek?.id ?? null) : null;
  if (!againstId) {
    const earlier = await db
      .select({ id: ratingRunsTable.id, start: weeksTable.startDate })
      .from(ratingRunsTable)
      .innerJoin(weeksTable, eq(weeksTable.id, ratingRunsTable.weekId))
      .where(
        and(
          eq(ratingRunsTable.poolId, run.poolId),
          eq(ratingRunsTable.status, "published"),
        ),
      )
      .orderBy(desc(weeksTable.startDate))
      .limit(5);
    againstId = earlier.find((row) => row.id !== runId)?.id ?? null;
  }

  const load = (id: string) =>
    db
      .select({
        schoolId: ratingSnapshotsTable.schoolId,
        name: schoolsTable.shortName,
        fullName: schoolsTable.name,
        sorRank: ratingSnapshotsTable.sorRank,
        powerRank: ratingSnapshotsTable.powerRank,
        sosRank: ratingSnapshotsTable.sosRank,
      })
      .from(ratingSnapshotsTable)
      .innerJoin(
        schoolsTable,
        eq(schoolsTable.id, ratingSnapshotsTable.schoolId),
      )
      .where(eq(ratingSnapshotsTable.runId, id));
  const [current, previous] = await Promise.all([
    load(runId),
    againstId ? load(againstId) : Promise.resolve([]),
  ]);
  const before = new Map(previous.map((row) => [row.schoolId, row]));
  const rows = current
    .sort(
      (a, b) =>
        (a.sorRank ?? 999) - (b.sorRank ?? 999) || a.powerRank - b.powerRank,
    )
    .map((row) => {
      const prior = before.get(row.schoolId);
      return {
        schoolId: row.schoolId,
        name: row.name ?? row.fullName ?? row.schoolId,
        sorRank: row.sorRank,
        previousSorRank: prior?.sorRank ?? null,
        powerRank: row.powerRank,
        previousPowerRank: prior?.powerRank ?? null,
        sosRank: row.sosRank,
        previousSosRank: prior?.sosRank ?? null,
      };
    });
  return { against: againstId, rows };
}

export type UnmappedTeam = {
  externalId: string;
  displayName: string;
  location: string | null;
  suggestions: Array<{ id: string; name: string; score: number }>;
};

/** Pool members at ESPN with no Redshirt school, each with suggested matches. */
export async function unmappedTeams(
  pool: Pool,
  year: number,
): Promise<UnmappedTeam[]> {
  const calendar = await loadSeasonCalendar(pool.sportId, year);
  const { unmappedExternalIds } = await resolveMembership(pool, calendar);
  if (unmappedExternalIds.length === 0) return [];
  const mapped = await db
    .select({ schoolId: schoolExternalIdsTable.schoolId })
    .from(schoolExternalIdsTable)
    .where(eq(schoolExternalIdsTable.provider, "espn"));
  const taken = new Set(mapped.map((row) => row.schoolId));
  const schools = (
    await db
      .select({
        id: schoolsTable.id,
        name: schoolsTable.name,
        shortName: schoolsTable.shortName,
        nickname: schoolsTable.nickname,
      })
      .from(schoolsTable)
  ).filter((school) => !taken.has(school.id));
  const teams: UnmappedTeam[] = [];
  for (const externalId of unmappedExternalIds) {
    const team = await fetchEspnTeam({
      espnLeague: pool.source.espnLeague,
      espnId: externalId,
    }).catch(() => null);
    // ESPN lists placeholder "TBA" teams in some groups; they never play.
    if (!team || team.displayName === "TBA") continue;
    teams.push({
      externalId,
      displayName: team.displayName,
      location: team.location,
      suggestions: suggestSchools(team, schools).map((s) => ({
        id: s.id,
        name: s.shortName ?? s.name ?? s.id,
        score: Math.round(s.score * 100) / 100,
      })),
    });
  }
  return teams;
}

/** Save a provider id for a school. Fails if either side is already mapped. */
export async function mapExternalId(input: {
  provider: "espn" | "ncaa";
  externalId: string;
  schoolId: string;
}): Promise<void> {
  await db.insert(schoolExternalIdsTable).values(input);
}

export async function searchSchools(query: string, limit = 10) {
  const pattern = `%${query.replaceAll("%", "").replaceAll("_", "")}%`;
  return db
    .select({
      id: schoolsTable.id,
      name: schoolsTable.name,
      shortName: schoolsTable.shortName,
    })
    .from(schoolsTable)
    .where(
      or(
        ilike(schoolsTable.name, pattern),
        ilike(schoolsTable.shortName, pattern),
      ),
    )
    .limit(limit);
}

/** Turn a pool's cron (isActive) or public pages (isPublic) on or off. */
export async function setPoolFlags(
  poolId: string,
  flags: { isActive?: boolean; isPublic?: boolean },
): Promise<void> {
  await db
    .update(ratingPoolsTable)
    .set({ ...flags, updatedAt: new Date() })
    .where(eq(ratingPoolsTable.id, poolId));
}
