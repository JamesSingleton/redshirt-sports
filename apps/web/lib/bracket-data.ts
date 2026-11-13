import {
  BRACKET_FORMAT_SEEDS,
  type BracketFormatSeed,
  type BracketFormatSpec,
  type BracketSlotEntry,
  type BracketTeam,
  type BracketTeamStatsSet,
  type BracketView,
  buildBracketView,
  resolveFormat,
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
  listAllPublishedBracketEditions,
  listBracketBuilderSchools,
  listPublishedBracketSeasons,
} from "@redshirt-sports/db/queries";
import { rankingsDivisionTag } from "@redshirt-sports/db/rankings-cache-tags";
import { ratingsSportTag } from "@redshirt-sports/db/ratings/cache-tags";
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

const EMPTY_STATS: BracketTeamStatsSet = {
  asOf: { pollWeek: null, ratingsWeek: null, ratingsPoolSize: null },
  teams: {},
};

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
    /** The reader's own bracket: pick the field and the winners. */
    builder: `${base}/builder`,
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
  "use cache: remote";
  cacheTag(BRACKETS_CACHE_TAG, bracketSeasonTag(sport, division, year));
  cacheLife(BRACKETS_CACHE_LIFE);
  return getPublishedBracketEditions({
    sportSlug: sport,
    divisionSlug: division,
    year,
  });
}

export async function getCachedBracketSeasons(sport: string, division: string) {
  "use cache: remote";
  cacheTag(BRACKETS_CACHE_TAG);
  cacheLife(BRACKETS_CACHE_LIFE);
  return listPublishedBracketSeasons({
    sportSlug: sport,
    divisionSlug: division,
  });
}

/** Every published edition, for the sitemap. */
export async function getCachedAllPublishedBrackets() {
  "use cache: remote";
  cacheTag(BRACKETS_CACHE_TAG);
  cacheLife(BRACKETS_CACHE_LIFE);
  return listAllPublishedBracketEditions();
}

/** A published edition laid out for rendering, or null (drafts never render). */
export async function getCachedPublishedBracket(editionId: string) {
  "use cache: remote";
  cacheTag(BRACKETS_CACHE_TAG, bracketEditionTag(editionId));
  cacheLife(BRACKETS_CACHE_LIFE);
  const detail = await getBracketEdition(editionId);
  if (detail?.edition.status !== "published") return null;
  return {
    edition: detail.edition,
    view: buildBracketView(detail.spec, detail.slots, detail.games),
    // The field itself, for readers who start their own bracket from ours.
    slots: detail.slots,
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
  "use cache: remote";
  cacheTag(
    BRACKETS_CACHE_TAG,
    bracketEditionTag(editionId),
    ratingsSportTag(sport),
    rankingsDivisionTag(sport, division),
  );
  cacheLife(BRACKETS_CACHE_LIFE);
  return (await getBracketTeamStats(editionId)) ?? EMPTY_STATS;
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
  const { edition, view } = published;
  return { edition, view, stats, ...editions, seasons };
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

export type BracketBuilderSchool = BracketTeam & { conference: string | null };

export type BracketBuilderModel = {
  sport: string;
  division: string;
  year: number;
  formatKey: string;
  spec: BracketFormatSpec;
  /** Our newest published field that season, to start from. Null before one. */
  projection: {
    edition: BracketEditionSummary;
    slots: BracketSlotEntry[];
  } | null;
  /** Every school a reader can place. */
  schools: BracketBuilderSchool[];
};

/** Football seasons run into January: before July, the season is last year's. */
export function currentSeasonYear(now = new Date()) {
  const year = now.getUTCFullYear();
  return now.getUTCMonth() >= 6 ? year : year - 1;
}

/**
 * The season year, cached: a prerender can't read the clock directly, and
 * the answer only changes once a year.
 */
async function getCachedSeasonYear() {
  "use cache";
  cacheLife("hours");
  return currentSeasonYear();
}

/**
 * The format in force for a season, from the definitions in code, so an
 * unknown sport or division 404s without a database query.
 */
function builderFormat(sport: string, division: string, year: number) {
  try {
    return resolveFormat(BRACKET_FORMAT_SEEDS, {
      sportSlug: sport as BracketFormatSeed["sportSlug"],
      divisionSlug: division,
      year,
    });
  } catch {
    return null;
  }
}

async function getCachedBuilderSchools(
  sport: string,
  division: string,
  year: number,
): Promise<BracketBuilderSchool[]> {
  "use cache: remote";
  cacheTag(BRACKETS_CACHE_TAG, ratingsSportTag(sport));
  cacheLife(BRACKETS_CACHE_LIFE);
  return listBracketBuilderSchools({
    sportSlug: sport,
    divisionSlug: division,
    year,
  });
}

/**
 * Everything the bracket builder needs: this season's format, the schools a
 * reader can place, and our current bracket to start from when one is
 * published. 404s only when the sport and division have no playoff format.
 * Costs nothing new once warm: the format is code, and the rest is cached.
 */
export async function loadBracketBuilder(input: {
  sport: string;
  division: string;
}): Promise<BracketBuilderModel> {
  const year = await getCachedSeasonYear();
  const format = builderFormat(input.sport, input.division, year);
  if (!format) notFound();

  const [editions, schools] = await Promise.all([
    getCachedPublishedEditions(input.sport, input.division, year),
    getCachedBuilderSchools(input.sport, input.division, year),
  ]);
  const summary = editions.official ?? editions.projections[0];
  // An edition on an older format has slots this season's tree doesn't know.
  // This reads the same cache entry as the public bracket page.
  const published =
    summary && summary.formatKey === format.key
      ? await getCachedPublishedBracket(summary.id)
      : null;

  return {
    ...input,
    year,
    formatKey: format.key,
    spec: format.spec,
    projection: published
      ? { edition: published.edition, slots: published.slots }
      : null,
    schools,
  };
}
