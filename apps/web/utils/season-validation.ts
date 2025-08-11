import type { SportParam } from './espn'
import { getCurrentSeasonStartAndEnd } from '@/server/queries'

/**
 * Check if the current date falls within a valid season
 */
export async function validateCurrentSeason(year: number): Promise<{
  isValid: boolean
  message?: string
  season?: {
    start: Date
    end: Date
    year: number
  }
}> {
  try {
    const currentDate = new Date()
    const season = await getCurrentSeasonStartAndEnd({ year })

    if (!season) {
      return {
        isValid: false,
        message: `No season data found for year ${year}`,
      }
    }

    const isWithinSeason = season.start <= currentDate && season.end >= currentDate

    if (!isWithinSeason) {
      const seasonStart = season.start.toLocaleDateString()
      const seasonEnd = season.end.toLocaleDateString()

      return {
        isValid: false,
        message: `Current date is outside the ${year} season (${seasonStart} - ${seasonEnd})`,
        season,
      }
    }

    return {
      isValid: true,
      message: `Current date is within the ${year} season`,
      season,
    }
  } catch (error) {
    return {
      isValid: false,
      message: `Failed to validate season: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Check if a specific date is within a season period
 */
export async function isDateInSeason(date: Date, year: number): Promise<boolean> {
  const season = await getCurrentSeasonStartAndEnd({ year })
  if (!season) return false

  return season.start <= date && season.end >= date
}

/**
 * Get the current season year based on the current date
 */
export function getCurrentSeasonYear(): number {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11

  // For most sports, if it's before July, we're likely in the previous season year
  // This is a general heuristic and might need sport-specific logic
  if (currentMonth < 7) {
    return currentDate.getFullYear() - 1
  }

  return currentDate.getFullYear()
}

/**
 * Validate season for rankings calculation
 */
export async function validateSeasonForRankings(
  sport?: SportParam,
  customYear?: number,
): Promise<{
  isValid: boolean
  message?: string
  year: number
  shouldSkip: boolean
}> {
  const year = customYear || getCurrentSeasonYear()
  const validation = await validateCurrentSeason(year)

  return {
    isValid: validation.isValid,
    message: validation.message,
    year,
    shouldSkip: !validation.isValid,
  }
}
