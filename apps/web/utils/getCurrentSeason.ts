import z from 'zod'
import type { Season } from '@/types'

export const SportSchema = z.enum(['football', 'mens-basketball', 'womens-basketball'])
export type SportParam = z.infer<typeof SportSchema>

const SPORT_MAPPINGS = {
  football: 'football/college-football',
  'mens-basketball': 'basketball/mens-college-basketball',
  'womens-basketball': 'basketball/womens-college-basketball',
} as const

export async function getCurrentSeason(sport: SportParam = 'football'): Promise<Season> {
  const sportPath = SPORT_MAPPINGS[sport]

  if (!sportPath) {
    throw new Error(`Unsupported sport: ${sport}`)
  }

  const currentSeason = await fetch(
    `https://site.api.espn.com/apis/common/v3/sports/${sportPath}/season`,
  ).then((res) => {
    if (!res.ok) {
      throw new Error(`Failed to fetch season data for ${sport}: ${res.statusText}`)
    }
    return res.json()
  })

  return currentSeason
}
