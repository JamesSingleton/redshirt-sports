import { and, asc, desc, eq, sql } from "drizzle-orm";

import { primaryDb as db } from "../../client";
import {
  conferencesTable,
  ratingPoolsTable,
  ratingRunsTable,
  ratingSnapshotsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from "../../schema";
import type { EngineConfig } from "../engine/config";
import type {
  RatingDiagnostics,
  RecordLine,
  TeamExplanation,
} from "../engine/types";
import { ratingWeekLabel, ratingWeekSegment } from "../segments";

/** Postgres "undefined_table": the ratings migration hasn't been applied to this database yet. */
function isMissingTable(error: unknown): boolean {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

/**
 * Public reads run at build time (prerendered pages, sitemaps). A deploy can
 * build before its migration lands, so a missing table reads as "nothing
 * published yet" instead of failing the build. Any other error still throws.
 */
async function orNothingPublished<T>(
  read: () => Promise<T>,
  nothing: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (isMissingTable(error)) return nothing;
    throw error;
  }
}

export * from "../segments";

export type PublicPool = {
  id: string;
  slug: string;
  name: string;
  sportSlug: string;
  sportName: string;
  methodVersion: number;
  config: EngineConfig;
};

/** A pool the public site may show, or null. */
async function readGetPublicPool(
  sportSlug: string,
  poolSlug: string,
): Promise<PublicPool | null> {
  const [row] = await db
    .select({
      id: ratingPoolsTable.id,
      slug: ratingPoolsTable.slug,
      name: ratingPoolsTable.name,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
      methodVersion: ratingPoolsTable.methodVersion,
      config: ratingPoolsTable.config,
      isPublic: ratingPoolsTable.isPublic,
    })
    .from(ratingPoolsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, ratingPoolsTable.sportId))
    .where(
      and(eq(sportsTable.slug, sportSlug), eq(ratingPoolsTable.slug, poolSlug)),
    )
    .limit(1);
  if (!row?.isPublic) return null;
  const { isPublic: _public, ...pool } = row;
  return { ...pool, config: row.config as EngineConfig };
}

async function readListPublicPools(): Promise<PublicPool[]> {
  const rows = await db
    .select({
      id: ratingPoolsTable.id,
      slug: ratingPoolsTable.slug,
      name: ratingPoolsTable.name,
      sportSlug: sportsTable.slug,
      sportName: sportsTable.name,
      methodVersion: ratingPoolsTable.methodVersion,
      config: ratingPoolsTable.config,
    })
    .from(ratingPoolsTable)
    .innerJoin(sportsTable, eq(sportsTable.id, ratingPoolsTable.sportId))
    .where(eq(ratingPoolsTable.isPublic, true))
    .orderBy(asc(sportsTable.slug), asc(ratingPoolsTable.slug));
  return rows.map((row) => ({ ...row, config: row.config as EngineConfig }));
}

export type PublishedWeek = {
  runId: string;
  year: number;
  seasonType: number;
  number: number;
  segment: string;
  label: string;
  publishedAt: string;
  throughAt: string | null;
};

/** Every published week of a pool, newest first. */
async function readListPublishedWeeks(
  poolId: string,
): Promise<PublishedWeek[]> {
  const rows = await db
    .select({
      runId: ratingRunsTable.id,
      year: seasonsTable.year,
      seasonType: seasonTypesTable.type,
      number: weeksTable.number,
      publishedAt: ratingRunsTable.publishedAt,
      throughAt: ratingRunsTable.throughAt,
    })
    .from(ratingRunsTable)
    .innerJoin(weeksTable, eq(weeksTable.id, ratingRunsTable.weekId))
    .innerJoin(
      seasonTypesTable,
      eq(seasonTypesTable.id, weeksTable.seasonTypeId),
    )
    .innerJoin(seasonsTable, eq(seasonsTable.id, ratingRunsTable.seasonId))
    .where(
      and(
        eq(ratingRunsTable.poolId, poolId),
        eq(ratingRunsTable.status, "published"),
      ),
    )
    .orderBy(desc(weeksTable.startDate));
  return rows.map((row) => ({
    runId: row.runId,
    year: row.year,
    seasonType: row.seasonType,
    number: row.number,
    segment: ratingWeekSegment(row.seasonType, row.number),
    label: ratingWeekLabel(row.seasonType, row.number),
    publishedAt: (row.publishedAt ?? new Date(0)).toISOString(),
    throughAt: row.throughAt?.toISOString() ?? null,
  }));
}

export type PublishedRun = {
  id: string;
  methodVersion: number;
  params: EngineConfig;
  diagnostics: RatingDiagnostics;
  checksum: string;
  gameCount: number;
  computedAt: string;
};

export type PublishedTeamRow = {
  schoolId: string;
  name: string;
  fullName: string | null;
  abbreviation: string | null;
  slug: string | null;
  image: unknown;
  conference: string | null;
  power: number;
  powerLow: number;
  powerHigh: number;
  powerRank: number;
  powerRankLow: number;
  powerRankHigh: number;
  strength: number;
  sor: number | null;
  sorRank: number | null;
  sorRankLow: number | null;
  sorRankHigh: number | null;
  sos: number | null;
  sosRank: number | null;
  sosRankLow: number | null;
  sosRankHigh: number | null;
  sov: number | null;
  sovRank: number | null;
  sol: number | null;
  recordSos: number | null;
  recordSosRank: number | null;
  owp: number | null;
  oowp: number | null;
  averageOpponentStrength: number | null;
  remainingSos: number | null;
  fullSeasonSos: number | null;
  poolRecord: RecordLine;
  overallRecord: RecordLine;
  poolGames: number;
  tierRecords: [RecordLine, RecordLine, RecordLine, RecordLine];
  isProvisional: boolean;
  explanation: TeamExplanation;
};

async function readGetPublishedRun(
  runId: string,
): Promise<{ run: PublishedRun; rows: PublishedTeamRow[] } | null> {
  const [run] = await db
    .select({
      id: ratingRunsTable.id,
      methodVersion: ratingRunsTable.methodVersion,
      params: ratingRunsTable.params,
      diagnostics: ratingRunsTable.diagnostics,
      checksum: ratingRunsTable.checksum,
      gameCount: ratingRunsTable.gameCount,
      computedAt: ratingRunsTable.computedAt,
      status: ratingRunsTable.status,
    })
    .from(ratingRunsTable)
    .where(eq(ratingRunsTable.id, runId))
    .limit(1);
  if (run?.status !== "published") return null;
  const snapshots = await db
    .select({
      snapshot: ratingSnapshotsTable,
      name: schoolsTable.shortName,
      fullName: schoolsTable.name,
      abbreviation: schoolsTable.abbreviation,
      slug: schoolsTable.slug,
      image: schoolsTable.image,
      conference: conferencesTable.shortName,
      conferenceName: conferencesTable.name,
    })
    .from(ratingSnapshotsTable)
    .innerJoin(schoolsTable, eq(schoolsTable.id, ratingSnapshotsTable.schoolId))
    .leftJoin(
      conferencesTable,
      eq(conferencesTable.id, ratingSnapshotsTable.conferenceId),
    )
    .where(eq(ratingSnapshotsTable.runId, runId));
  const rows = snapshots.map(({ snapshot: s, ...school }) => ({
    schoolId: s.schoolId,
    name: school.name ?? school.fullName ?? s.schoolId,
    fullName: school.fullName,
    abbreviation: school.abbreviation,
    slug: school.slug,
    image: school.image,
    conference: s.conferenceName ?? school.conference ?? school.conferenceName,
    power: s.power,
    powerLow: s.powerLow,
    powerHigh: s.powerHigh,
    powerRank: s.powerRank,
    powerRankLow: s.powerRankLow,
    powerRankHigh: s.powerRankHigh,
    strength: s.strength,
    sor: s.sor,
    sorRank: s.sorRank,
    sorRankLow: s.sorRankLow,
    sorRankHigh: s.sorRankHigh,
    sos: s.sos,
    sosRank: s.sosRank,
    sosRankLow: s.sosRankLow,
    sosRankHigh: s.sosRankHigh,
    sov: s.sov,
    sovRank: s.sovRank,
    sol: s.sol,
    recordSos: s.recordSos,
    recordSosRank: s.recordSosRank,
    owp: s.owp,
    oowp: s.oowp,
    averageOpponentStrength: s.averageOpponentStrength,
    remainingSos: s.remainingSos,
    fullSeasonSos: s.fullSeasonSos,
    poolRecord: { wins: s.poolWins, losses: s.poolLosses, ties: s.poolTies },
    overallRecord: {
      wins: s.overallWins,
      losses: s.overallLosses,
      ties: s.overallTies,
    },
    poolGames: s.poolGames,
    tierRecords: s.tierRecords as PublishedTeamRow["tierRecords"],
    isProvisional: s.isProvisional,
    explanation: s.explanation as TeamExplanation,
  }));
  return {
    run: {
      id: run.id,
      methodVersion: run.methodVersion,
      params: run.params as EngineConfig,
      diagnostics: run.diagnostics as RatingDiagnostics,
      checksum: run.checksum,
      gameCount: run.gameCount,
      computedAt: run.computedAt.toISOString(),
    },
    rows,
  };
}

export type PoolPrediction = {
  year: number;
  /** The week the game was played in, and its label. */
  seasonType: number;
  weekNumber: number;
  /** Home margin predicted by the ratings published the week before. */
  predicted: number;
  actual: number;
};

/**
 * Every pool-vs-pool game predicted out of sample: each published week's Power
 * (plus its home field) against the following week's final games. This is the
 * pick record the accuracy page shows.
 */
async function readListPoolPredictions(
  poolId: string,
): Promise<PoolPrediction[]> {
  const rows = await db.execute<{
    year: number;
    season_type: number;
    week_number: number;
    predicted: number;
    actual: number;
  }>(sql`
    with ordered as (
      select w.id, st.season_id, st.type, w.number,
        lag(w.id) over (partition by st.season_id order by st.type, w.number) as previous_week
      from weeks w
      join season_types st on st.id = w.season_type_id
      where st.type in (2, 3)
    ),
    runs as (
      select r.id, r.week_id, (r.diagnostics->>'powerHomeField')::float as home_field
      from rating_runs r
      where r.pool_id = ${poolId} and r.status = 'published'
    ),
    members as (
      select season_id, school_id from rating_pool_members where pool_id = ${poolId}
    )
    select s.year, o.type as season_type, o.number as week_number,
      ph.power - pa.power + case when g.neutral_site then 0 else runs.home_field end as predicted,
      g.home_score - g.away_score as actual
    from games g
    join ordered o on o.id = g.week_id
    join runs on runs.week_id = o.previous_week
    join seasons s on s.id = g.season_id
    join members mh on mh.season_id = g.season_id and mh.school_id = g.home_school_id
    join members ma on ma.season_id = g.season_id and ma.school_id = g.away_school_id
    join rating_snapshots ph on ph.run_id = runs.id and ph.school_id = g.home_school_id
    join rating_snapshots pa on pa.run_id = runs.id and pa.school_id = g.away_school_id
    where g.status = 'final' and g.home_score is not null and g.away_score is not null
    order by s.year, o.type, o.number
  `);
  return rows.map((row) => ({
    year: Number(row.year),
    seasonType: Number(row.season_type),
    weekNumber: Number(row.week_number),
    predicted: Number(row.predicted),
    actual: Number(row.actual),
  }));
}

/** A pool the public site may show, or null. */
export function getPublicPool(sportSlug: string, poolSlug: string) {
  return orNothingPublished(() => readGetPublicPool(sportSlug, poolSlug), null);
}

export function listPublicPools() {
  return orNothingPublished(() => readListPublicPools(), []);
}

/** Every published week of a pool, newest first. */
export function listPublishedWeeks(poolId: string) {
  return orNothingPublished(() => readListPublishedWeeks(poolId), []);
}

export function getPublishedRun(runId: string) {
  return orNothingPublished(() => readGetPublishedRun(runId), null);
}

/** Every pool-vs-pool game predicted out of sample (see readListPoolPredictions). */
export function listPoolPredictions(poolId: string) {
  return orNothingPublished(() => readListPoolPredictions(poolId), []);
}
