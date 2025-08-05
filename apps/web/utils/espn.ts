import z from 'zod'
import type { Season, SeasonType, ESPNBody, WeekDetail } from '@/types'

export const SportSchema = z.enum(['football', 'mens-basketball', 'womens-basketball'])
export type SportParam = z.infer<typeof SportSchema>

const SPORT_MAPPINGS = {
  football: 'football/college-football',
  'mens-basketball': 'basketball/mens-college-basketball',
  'womens-basketball': 'basketball/womens-college-basketball',
} as const

/**
 * ESPN API base URL
 */
const ESPN_BASE_URL = 'https://site.api.espn.com/apis/common/v3/sports'

/**
 * Get the ESPN sport path for a given sport
 */
function getSportPath(sport: SportParam): string {
  const sportPath = SPORT_MAPPINGS[sport]
  if (!sportPath) {
    throw new Error(`Unsupported sport: ${sport}`)
  }
  return sportPath
}

/**
 * Fetch data from ESPN API with error handling
 */
async function fetchESPNData<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`ESPN API request failed: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Get current season data for a specific sport
 */
export async function getCurrentSeason(sport: SportParam = 'football'): Promise<Season> {
  const sportPath = getSportPath(sport)
  const url = `${ESPN_BASE_URL}/${sportPath}/season`

  return fetchESPNData<Season>(url)
}

/**
 * Get detailed season data including all season types (preseason, regular season, postseason)
 */
export async function getSeasonData(
  sport: SportParam = 'football',
  year?: number,
): Promise<Season> {
  const sportPath = getSportPath(sport)

  // If no year provided, get current season first
  if (!year) {
    const currentSeason = await getCurrentSeason(sport)
    year = currentSeason.year
  }

  const url = `${ESPN_BASE_URL}/${sportPath}/seasons?startingseason=${year}`
  const espnBody: ESPNBody = await fetchESPNData(url)

  return espnBody.seasons[0]!
}

/**
 * Get current week number for a specific sport
 */
export async function getCurrentWeek(sport: SportParam = 'football'): Promise<number> {
  const currentDate = new Date()
  const currentSeasonData = await getSeasonData(sport)
  const currentSeasonEndDate = new Date(currentSeasonData.endDate)

  if (!currentSeasonData.types.length) {
    return 0
  }

  const preseason = currentSeasonData.types.find((type) => type.type === 1)
  const regularSeason = currentSeasonData.types.find((type) => type.type === 2)

  if (!preseason || !regularSeason) {
    return 0
  }

  const isPreseason =
    currentDate >= new Date(preseason.startDate) && currentDate <= new Date(preseason.endDate)

  const isRegularSeason =
    currentDate >= new Date(regularSeason.startDate) &&
    currentDate <= new Date(regularSeason.endDate)

  const isPostseason =
    currentDate >= new Date(regularSeason.endDate) && currentDate <= currentSeasonEndDate

  if (isRegularSeason) {
    const currentWeek = regularSeason.weeks.find(
      (week) => currentDate >= new Date(week.startDate) && currentDate <= new Date(week.endDate),
    )

    if (currentWeek) {
      return currentWeek.number
    }
  } else if (isPostseason) {
    return 999 // Postseason indicator
  }

  return 0 // Preseason or no valid week found
}

/**
 * Get season information including current period and week
 */
export async function getSeasonInfo(sport: SportParam = 'football'): Promise<{
  year: number
  currentWeek: number
  isPreseason: boolean
  isRegularSeason: boolean
  isPostseason: boolean
  preseason?: SeasonType
  regularSeason?: SeasonType
}> {
  const currentDate = new Date()
  const currentSeasonData = await getSeasonData(sport)
  const currentSeasonEndDate = new Date(currentSeasonData.endDate)

  const preseason = currentSeasonData.types.find((type) => type.type === 1)
  const regularSeason = currentSeasonData.types.find((type) => type.type === 2)

  const isPreseason = preseason
    ? currentDate >= new Date(preseason.startDate) && currentDate <= new Date(preseason.endDate)
    : false

  const isRegularSeason = regularSeason
    ? currentDate >= new Date(regularSeason.startDate) &&
      currentDate <= new Date(regularSeason.endDate)
    : false

  const isPostseason = regularSeason
    ? currentDate >= new Date(regularSeason.endDate) && currentDate <= currentSeasonEndDate
    : false

  let currentWeek = 0

  if (isRegularSeason && regularSeason) {
    const week = regularSeason.weeks.find(
      (week) => currentDate >= new Date(week.startDate) && currentDate <= new Date(week.endDate),
    )
    if (week) {
      currentWeek = week.number
    }
  } else if (isPostseason) {
    currentWeek = 999
  }

  return {
    year: currentSeasonData.year,
    currentWeek,
    isPreseason,
    isRegularSeason,
    isPostseason,
    preseason,
    regularSeason,
  }
}

/**
 * Get all available weeks for a season
 */
export async function getSeasonWeeks(
  sport: SportParam = 'football',
  year?: number,
): Promise<{
  preseason: WeekDetail[]
  regularSeason: WeekDetail[]
  postseason: WeekDetail[]
}> {
  const seasonData = await getSeasonData(sport, year)

  const preseason = seasonData.types.find((type) => type.type === 1)?.weeks || []
  const regularSeason = seasonData.types.find((type) => type.type === 2)?.weeks || []
  const postseason = seasonData.types.find((type) => type.type === 3)?.weeks || []

  return {
    preseason,
    regularSeason,
    postseason,
  }
}

/**
 * Check if a specific date falls within a season period
 */
export function isDateInSeasonPeriod(date: Date, seasonType: SeasonType): boolean {
  return date >= new Date(seasonType.startDate) && date <= new Date(seasonType.endDate)
}

/**
 * Get the week number for a specific date
 */
export function getWeekForDate(date: Date, seasonType: SeasonType): number | null {
  const week = seasonType.weeks.find(
    (week) => date >= new Date(week.startDate) && date <= new Date(week.endDate),
  )
  return week?.number || null
}
