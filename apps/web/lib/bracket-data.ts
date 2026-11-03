import {
  type BracketTeamStatsSet,
  type BracketView,
  buildBracketView,
} from "@redshirt-sports/db/playoff-bracket";
import {
  BRACKETS_CACHE_TAG,
  bracketEditionTag,
  bracketSeasonTag,
} from "@redshirt-sports/db/playoff-bracket/cache-tags";
import {
  type BracketEditionSummary,
  getBracketEdition,
  getBracketTeamStats,
  getPublishedBracketEditions,
  listPublishedBracketSeasons,
} from "@redshirt-sports/db/queries";
import { rankingsDivisionTag } from "@redshirt-sports/db/rankings-cache-tags";
import { RATINGS_CACHE_TAG } from "@redshirt-sports/db/ratings/cache-tags";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

/**
 * Admin saves expire these tags immediately. The long lifetime is only the
 * backup for a missed revalidation.
 */
export const BRACKETS_CACHE_LIFE = {
  stale: 300,
  revalidate: 604800,
  expire: 2592000,
} as const;

export type BracketPageModel = {
  edition: BracketEditionSummary;
  view: BracketView;
  /** Poll, ratings and results per school, for the matchup panel. */
  stats: BracketTeamStatsSet;
  official: BracketEditionSummary | null;
  projections: BracketEditionSummary[];
  /** Seasons with a published bracket, newest first, for the season picker. */
  seasons: number[];
};

export function bracketPaths(sport: string, division: string) {
  const base = `/college/${sport}/playoffs/${division}`;
  return {
    landing: base,
    season: (year: number) => `${base}/${year}`,
    projection: (year: number, week: number) =>
      `${base}/${year}/projections/week-${week}`,
  };
}

export function bracketEditionLabel(edition: BracketEditionSummary) {
  return edition.kind === "official"
    ? "Official bracket"
    : `Projection after Week ${edition.weekNumber}`;
}

export function bracketEditionPath(edition: BracketEditionSummary) {
  const paths = bracketPaths(edition.sportSlug, edition.divisionSlug ?? "");
  return edition.kind === "official" || edition.weekNumber === null
    ? paths.season(edition.year)
    : paths.projection(edition.year, edition.weekNumber);
}

async function getCachedPublishedEditions(
  sport: string,
  division: string,
  year: number,
) {
  "use cache";
  cacheTag(BRACKETS_CACHE_TAG, bracketSeasonTag(sport, division, year));
  cacheLife(BRACKETS_CACHE_LIFE);
  return getPublishedBracketEditions({
    sportSlug: sport,
    divisionSlug: division,
    year,
  });
}

export async function getCachedBracketSeasons(sport: string, division: string) {
  "use cache";
  cacheTag(BRACKETS_CACHE_TAG);
  cacheLife(BRACKETS_CACHE_LIFE);
  return listPublishedBracketSeasons({
    sportSlug: sport,
    divisionSlug: division,
  });
}

/** A published edition laid out for rendering, or null (drafts never render). */
export async function getCachedPublishedBracket(editionId: string) {
  "use cache";
  cacheTag(BRACKETS_CACHE_TAG, bracketEditionTag(editionId));
  cacheLife(BRACKETS_CACHE_LIFE);
  const detail = await getBracketEdition(editionId);
  if (detail?.edition.status !== "published") return null;
  return {
    edition: detail.edition,
    view: buildBracketView(detail.spec, detail.slots, detail.games),
  };
}

/**
 * Matchup-panel numbers for an edition. Also expires when the poll or the
 * computer ratings publish, since a projection reads them through its week.
 */
export async function getCachedBracketTeamStats(
  editionId: string,
  sport: string,
  division: string,
): Promise<BracketTeamStatsSet> {
  "use cache";
  cacheTag(
    BRACKETS_CACHE_TAG,
    bracketEditionTag(editionId),
    RATINGS_CACHE_TAG,
    rankingsDivisionTag(sport, division),
  );
  cacheLife(BRACKETS_CACHE_LIFE);
  return (
    (await getBracketTeamStats(editionId)) ?? {
      asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
      teams: {},
    }
  );
}

function parseYear(value: string) {
  return /^\d{4}$/.test(value) ? Number(value) : null;
}

/** "week-7" → 7. */
export function parseProjectionWeek(segment: string) {
  const match = /^week-(\d{1,2})$/.exec(segment);
  return match ? Number(match[1]) : null;
}

/**
 * The season's current bracket: the official one once published, else the
 * newest projection. With `week`, that week's projection instead. 404s when
 * nothing matching is published.
 */
export async function loadBracketPage(input: {
  sport: string;
  division: string;
  year: string;
  week?: string;
}): Promise<BracketPageModel> {
  const year = parseYear(input.year);
  if (year === null) notFound();
  const editions = await getCachedPublishedEditions(
    input.sport,
    input.division,
    year,
  );

  let summary: BracketEditionSummary | null | undefined;
  if (input.week === undefined) {
    summary = editions.official ?? editions.projections[0];
  } else {
    const week = parseProjectionWeek(input.week);
    summary = editions.projections.find((row) => row.weekNumber === week);
  }
  if (!summary) notFound();

  const [published, stats, seasons] = await Promise.all([
    getCachedPublishedBracket(summary.id),
    getCachedBracketTeamStats(summary.id, input.sport, input.division),
    getCachedBracketSeasons(input.sport, input.division),
  ]);
  if (!published) notFound();
  return { ...published, stats, ...editions, seasons };
}

/**
 * The division's front door: the newest season's current bracket, rendered
 * in place (no redirect). 404s until any bracket is published.
 */
export async function loadLatestBracketPage(input: {
  sport: string;
  division: string;
}): Promise<BracketPageModel> {
  const [latest] = await getCachedBracketSeasons(input.sport, input.division);
  if (latest === undefined) notFound();
  return loadBracketPage({ ...input, year: String(latest) });
}
