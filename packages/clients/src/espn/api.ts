import z from "zod";

import type {
  ESPNBody,
  ESPNWeekResponse,
  ESPNWeeksResponse,
  Season,
  SeasonType,
  WeekDetail,
} from "./types";
import { LEGACY_FINAL_RANKINGS_WEEK, LEGACY_PRESEASON_WEEK } from "./week-url";

export const SportSchema = z.enum([
  "football",
  "mens-basketball",
  "womens-basketball",
]);
export type SportParam = z.infer<typeof SportSchema>;

const SPORT_MAPPINGS = {
  football: "football/college-football",
  "mens-basketball": "basketball/mens-college-basketball",
  "womens-basketball": "basketball/womens-college-basketball",
} as const;

/**
 * ESPN API base URLs
 */
const ESPN_BASE_SITE_URL = "https://site.api.espn.com/apis/common/v3/sports";
const ESPN_BASE_SPORTS_URL = "https://sports.core.api.espn.com/v2/sports";

/**
 * Get the ESPN sport path for a given sport
 */
function getSportPath(sport: SportParam): string {
  const sportPath = SPORT_MAPPINGS[sport];
  if (!sportPath) {
    throw new Error(`Unsupported sport: ${sport}`);
  }
  return sportPath;
}

function getSportPathParts(sport: SportParam): string[] {
  const sportPath = getSportPath(sport);
  return sportPath.split("/");
}

function espnErrorLocation(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url;
  }
}

export async function fetchWeeksFromSportsUrl(
  sport: SportParam,
  seasonYear: number,
  seasonTypeType: number,
) {
  const [sportPart, leaguePart] = getSportPathParts(sport);
  const url = `${ESPN_BASE_SPORTS_URL}/${sportPart}/leagues/${leaguePart}/seasons/${seasonYear}/types/${seasonTypeType}/weeks`;

  const weeksResponse = await fetchESPNData<ESPNWeeksResponse>(url);

  const weekPromises = weeksResponse.items.map((week) =>
    fetchESPNData<ESPNWeekResponse>(week.$ref),
  );

  return Promise.all(weekPromises);
}

/**
 * Fetch data from ESPN API with error handling
 */
async function fetchESPNData<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `ESPN API request failed: ${response.status} ${response.statusText} (${espnErrorLocation(url)})`,
    );
  }
  return response.json();
}

/**
 * Get current season data for a specific sport
 */
export async function getCurrentSeason(
  sport: SportParam = "football",
): Promise<Season> {
  const sportPath = getSportPath(sport);
  const url = `${ESPN_BASE_SITE_URL}/${sportPath}/season`;

  return fetchESPNData<Season>(url);
}

/**
 * Get detailed season data including all season types (preseason, regular season, postseason)
 */
export async function getSeasonData(
  sport: SportParam = "football",
  year?: number,
): Promise<Season> {
  const sportPath = getSportPath(sport);

  // If no year provided, get current season first
  if (!year) {
    const currentSeason = await getCurrentSeason(sport);
    year = currentSeason.year;
  }

  const url = `${ESPN_BASE_SITE_URL}/${sportPath}/seasons?startingseason=${year}`;
  const espnBody = await fetchESPNData<ESPNBody>(url);

  const season = espnBody.seasons.find((s) => s.year === year);
  if (!season) {
    throw new Error(`Unable to find a season for year ${year}`);
  }

  return season;
}

/**
 * Get multiple seasons worth of season data
 */
export async function getMultipleSeasonsData(
  sport: SportParam = "football",
  startingYear: number,
) {
  const sportPath = getSportPath(sport);

  const url = `${ESPN_BASE_SITE_URL}/${sportPath}/seasons?startingseason=${startingYear}`;
  const espnBody = await fetchESPNData<ESPNBody>(url);

  return espnBody.seasons!;
}

/**
 * Get current week number for a specific sport.
 * Returns legacy week ints used at the app edge: `0` (preseason),
 * regular week `N`, or `999` (postseason / final rankings).
 */
export async function getCurrentWeek(
  sport: SportParam = "football",
): Promise<number> {
  const currentDate = new Date();
  const currentSeasonData = await getSeasonData(sport);

  if (!currentSeasonData.types.length) {
    return LEGACY_PRESEASON_WEEK;
  }

  const preseason = currentSeasonData.types.find((type) => type.type === 1);
  const regularSeason = currentSeasonData.types.find((type) => type.type === 2);

  if (!preseason || !regularSeason) {
    return LEGACY_PRESEASON_WEEK;
  }

  const isRegularSeason =
    currentDate >= new Date(regularSeason.startDate) &&
    currentDate <= new Date(regularSeason.endDate);

  // After regular season ends → postseason (do not require season endDate alone)
  const isPostseason =
    currentDate >= new Date(regularSeason.endDate) && !isRegularSeason;

  if (isRegularSeason) {
    const currentWeek = regularSeason.weeks?.find(
      (week) =>
        currentDate >= new Date(week.startDate) &&
        currentDate <= new Date(week.endDate),
    );

    if (currentWeek) {
      return currentWeek.number;
    }
  } else if (isPostseason) {
    return LEGACY_FINAL_RANKINGS_WEEK;
  }

  return LEGACY_PRESEASON_WEEK;
}

/**
 * Get season information including current period and week.
 * `currentWeek` uses the same legacy ints as {@link getCurrentWeek}.
 */
export async function getSeasonInfo(sport: SportParam = "football"): Promise<{
  year: number;
  currentWeek: number;
  isPreseason: boolean;
  isRegularSeason: boolean;
  isPostseason: boolean;
  preseason?: SeasonType;
  regularSeason?: SeasonType;
}> {
  const currentDate = new Date();
  const currentSeasonData = await getSeasonData(sport);

  const preseason = currentSeasonData.types.find((type) => type.type === 1);
  const regularSeason = currentSeasonData.types.find((type) => type.type === 2);

  const isPreseason = preseason
    ? currentDate >= new Date(preseason.startDate) &&
      currentDate <= new Date(preseason.endDate)
    : false;

  const isRegularSeason = regularSeason
    ? currentDate >= new Date(regularSeason.startDate) &&
      currentDate <= new Date(regularSeason.endDate)
    : false;

  const isPostseason = regularSeason
    ? currentDate >= new Date(regularSeason.endDate) && !isRegularSeason
    : false;

  let currentWeek = LEGACY_PRESEASON_WEEK;

  if (isRegularSeason && regularSeason) {
    const week = regularSeason.weeks?.find(
      (week) =>
        currentDate >= new Date(week.startDate) &&
        currentDate <= new Date(week.endDate),
    );
    if (week) {
      currentWeek = week.number;
    }
  } else if (isPostseason) {
    currentWeek = LEGACY_FINAL_RANKINGS_WEEK;
  }

  return {
    year: currentSeasonData.year,
    currentWeek,
    isPreseason,
    isRegularSeason,
    isPostseason,
    preseason,
    regularSeason,
  };
}

/**
 * Get all available weeks for a season
 */
export async function getSeasonWeeks(
  sport: SportParam = "football",
  year?: number,
): Promise<{
  preseason: WeekDetail[];
  regularSeason: WeekDetail[];
  postseason: WeekDetail[];
}> {
  const seasonData = await getSeasonData(sport, year);

  const preseason =
    seasonData.types.find((type) => type.type === 1)?.weeks || [];
  const regularSeason =
    seasonData.types.find((type) => type.type === 2)?.weeks || [];
  const postseason =
    seasonData.types.find((type) => type.type === 3)?.weeks || [];

  return {
    preseason,
    regularSeason,
    postseason,
  };
}

/**
 * Check if a specific date falls within a season period
 */
export function isDateInSeasonPeriod(
  date: Date,
  seasonType: SeasonType,
): boolean {
  return (
    date >= new Date(seasonType.startDate) &&
    date <= new Date(seasonType.endDate)
  );
}

/**
 * Get the week number for a specific date
 */
export function getWeekForDate(
  date: Date,
  seasonType: SeasonType,
): number | null {
  const week = seasonType.weeks?.find(
    (week) =>
      date >= new Date(week.startDate) && date <= new Date(week.endDate),
  );
  return week?.number || null;
}
