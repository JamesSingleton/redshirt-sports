import { getCurrentSeason } from './getCurrentSeason'
import type { Season, SeasonType, ESPNBody } from '@/types'

export async function getCurrentWeek(): Promise<number> {
  let currentSeasonData: Season
  let votingWeek: number = 0
  let isPreseason: boolean = false
  let isRegularSeason: boolean
  let isPostseason: boolean
  let regularSeason: SeasonType
  let preseason: SeasonType

  const currentDate = new Date()
  // TODO: Possibly cache this data or move to supabase
  const currentSeason = await getCurrentSeason()

  const { year } = currentSeason

  const espnBody: ESPNBody = await fetch(
    `https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=${year}`,
  ).then((res) => res.json())

  currentSeasonData = espnBody.seasons[0]!
  const currentSeasonEndDate = new Date(currentSeasonData.endDate)

  if (currentSeasonData.types.length) {
    preseason = currentSeasonData.types.find((type) => type.type === 1)!
    regularSeason = currentSeasonData.types.find((type) => type.type === 2)!

    isPreseason =
      currentDate >= new Date(preseason.startDate) && currentDate <= new Date(preseason.endDate)

    isRegularSeason =
      currentDate >= new Date(regularSeason.startDate) &&
      currentDate <= new Date(regularSeason.endDate)

    isPostseason =
      currentDate >= new Date(regularSeason.endDate) && currentDate <= currentSeasonEndDate

    if (isRegularSeason) {
      const currentWeek = regularSeason.weeks.find(
        (week) => currentDate >= new Date(week.startDate) && currentDate <= new Date(week.endDate),
      )

      if (currentWeek) {
        votingWeek = currentWeek.number
      }
    } else if (isPostseason) {
      votingWeek = 999
    } else {
      votingWeek = 0
    }
  }
  return votingWeek
}
