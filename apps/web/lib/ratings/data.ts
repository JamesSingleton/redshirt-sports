import {
  getPublicPool,
  getPublishedRun,
  listPoolPredictions,
  listPublicPools,
  listPublishedWeeks,
  type PublicPool,
  type PublishedWeek,
  parseRatingWeekSegment,
} from "@redshirt-sports/db/ratings";
import {
  RATINGS_CACHE_TAG,
  ratingsPoolTag,
} from "@redshirt-sports/db/ratings/cache-tags";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

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
  "use cache";
  cacheTag(RATINGS_CACHE_TAG);
  cacheLife(RATINGS_CACHE_LIFE);
  return listPublicPools();
}

export async function getCachedPool(sport: string, pool: string) {
  "use cache";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return getPublicPool(sport, pool);
}

export async function getCachedWeeks(
  sport: string,
  pool: string,
  poolId: string,
) {
  "use cache";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return listPublishedWeeks(poolId);
}

export async function getCachedRun(sport: string, pool: string, runId: string) {
  "use cache";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return getPublishedRun(runId);
}

export async function getCachedPredictions(
  sport: string,
  pool: string,
  poolId: string,
) {
  "use cache";
  cacheTag(RATINGS_CACHE_TAG, ratingsPoolTag(sport, pool));
  cacheLife(RATINGS_CACHE_LIFE);
  return listPoolPredictions(poolId);
}

export type RatingsWeekModel = {
  pool: PublicPool;
  week: PublishedWeek;
  weeks: PublishedWeek[];
  run: NonNullable<Awaited<ReturnType<typeof getPublishedRun>>>["run"];
  rows: NonNullable<Awaited<ReturnType<typeof getPublishedRun>>>["rows"];
  isLatest: boolean;
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

/** One team's row in a published week (latest when no year/week), or a 404. */
export async function loadRatingsTeam(input: {
  sport: string;
  pool: string;
  slug: string;
  year?: string;
  week?: string;
}) {
  const model = await loadRatingsWeek(input);
  const row = model.rows.find((candidate) => candidate.slug === input.slug);
  if (!row) notFound();
  return { model, row };
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
