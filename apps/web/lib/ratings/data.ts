import {
  getPublicPool,
  getPublishedRun,
  listPoolPredictionGroups,
  listPublicPools,
  listPublishedRunExplanations,
  listPublishedWeeks,
  listTeamRatings,
  type PublicPool,
  type PublishedTeamRow,
  type PublishedTeamSheetRow,
  type PublishedWeek,
  parseRatingWeekSegment,
} from "@redshirt-sports/db/ratings";
import {
  RATINGS_CACHE_TAG,
  ratingsPoolTag,
} from "@redshirt-sports/db/ratings/cache-tags";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { MARGIN_EDGES } from "@/lib/ratings/accuracy";

/**
 * Publish and rollback expire these tags immediately (cron or admin). The long
 * lifetime is only the backup for a missed revalidation.
 */
export const RATINGS_CACHE_LIFE = {
  stale: 300,
  revalidate: 604800,
  expire: 2592000,
} as const;

export async function getCachedPublicPools() {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG);
  cacheLife(RATINGS_CACHE_LIFE);
  return listPublicPools();
}

export async function getCachedPool(sport: string, pool: string) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return getPublicPool(sport, pool);
}

export async function getCachedWeeks(
  sport: string,
  pool: string,
  poolId: string,
) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return listPublishedWeeks(poolId);
}

export async function getCachedRun(sport: string, pool: string, runId: string) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return getPublishedRun(runId);
}

/**
 * Every team's game-by-game explanation in a run. Only the team sheets
 * page and the JSON download need these; tables and archives skip them.
 */
export async function getCachedRunExplanations(
  sport: string,
  pool: string,
  runId: string,
) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return Object.fromEntries(await listPublishedRunExplanations(runId));
}

/** A team's ratings trend in every public pool, for its team page. */
export async function getCachedTeamRatings(sanityId: string) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG);
  cacheLife(RATINGS_CACHE_LIFE);
  return listTeamRatings(sanityId);
}

/** Accuracy totals by week and margin bucket, summed in Postgres. */
export async function getCachedPredictionGroups(
  sport: string,
  pool: string,
  poolId: string,
) {
  "use cache: remote";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return listPoolPredictionGroups(poolId, MARGIN_EDGES);
}

export type RatingsWeekModel = {
  pool: PublicPool;
  week: PublishedWeek;
  weeks: PublishedWeek[];
  run: NonNullable<Awaited<ReturnType<typeof getPublishedRun>>>["run"];
  rows: PublishedTeamRow[];
  isLatest: boolean;
};

/** A week with every team's explanation (team sheets page, JSON download). */
export type RatingsSheetsModel = Omit<RatingsWeekModel, "rows"> & {
  rows: PublishedTeamSheetRow[];
};

/** A pool that is public, or a 404. */
export async function requirePool(
  sport: string,
  pool: string,
): Promise<PublicPool> {
  const found = await getCachedPool(sport, pool);
  if (!found) notFound();
  return found;
}

/**
 * The published run for a week (or the latest week), with the pool and its week list.
 * 404s for an unknown pool, an unpublished week, or a pool with nothing published yet.
 */
export async function loadRatingsWeek(input: {
  sport: string;
  pool: string;
  year?: string;
  week?: string;
}): Promise<RatingsWeekModel> {
  const { pool, week, weeks } = await resolveRatingsWeek(input);
  const published = await getCachedRun(input.sport, input.pool, week.runId);
  if (!published) notFound();
  return {
    pool,
    week,
    weeks,
    run: published.run,
    rows: published.rows,
    isLatest: week.runId === weeks[0]?.runId,
  };
}

/** The pool, the requested (or latest) published week, and its week list, or a 404. */
async function resolveRatingsWeek(input: {
  sport: string;
  pool: string;
  year?: string;
  week?: string;
}) {
  const pool = await requirePool(input.sport, input.pool);
  const weeks = await getCachedWeeks(input.sport, input.pool, pool.id);
  let week: PublishedWeek | undefined;
  if (input.year == null || input.week == null) {
    week = weeks[0];
  } else {
    const parsed = parseRatingWeekSegment(input.week);
    const year = Number(input.year);
    week = parsed
      ? weeks.find(
          (candidate) =>
            candidate.year === year &&
            candidate.seasonType === parsed.seasonType &&
            (parsed.seasonType === 3 || candidate.number === parsed.number),
        )
      : undefined;
  }
  if (!week) notFound();
  return { pool, week, weeks };
}

/** A published week with every team's explanation, or a 404. */
export async function loadRatingsSheets(input: {
  sport: string;
  pool: string;
  year?: string;
  week?: string;
}): Promise<RatingsSheetsModel> {
  const model = await loadRatingsWeek(input);
  const explanations = await getCachedRunExplanations(
    input.sport,
    input.pool,
    model.run.id,
  );
  return {
    ...model,
    rows: model.rows.flatMap((row) => {
      const explanation = explanations[row.schoolId];
      return explanation ? [{ ...row, explanation }] : [];
    }),
  };
}

/** Published weeks of one season, oldest first, or a 404 if the season has none. */
export async function loadRatingsSeason(input: {
  sport: string;
  pool: string;
  year: string;
}) {
  const pool = await requirePool(input.sport, input.pool);
  const weeks = await getCachedWeeks(input.sport, input.pool, pool.id);
  const season = weeks
    .filter((week) => String(week.year) === input.year)
    .reverse();
  if (season.length === 0) notFound();
  return {
    pool,
    weeks: season,
    years: [...new Set(weeks.map((week) => week.year))],
  };
}

/** Every published week of a season with its table, oldest first (for the season download). */
export async function loadRatingsSeasonRuns(input: {
  sport: string;
  pool: string;
  year: string;
}) {
  const { pool, weeks } = await loadRatingsSeason(input);
  const runs = await Promise.all(
    weeks.map(async (week) => ({
      week,
      published: await getCachedRun(input.sport, input.pool, week.runId),
    })),
  );
  return {
    pool,
    weeks: runs.flatMap(({ week, published }) =>
      published ? [{ week, run: published.run, rows: published.rows }] : [],
    ),
  };
}
