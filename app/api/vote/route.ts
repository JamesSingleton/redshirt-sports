import * as Sentry from '@sentry/nextjs'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { voterBallots } from '@/server/db/schema'

import type { Season, SeasonType, ESPNBody } from '@/types'
import { getCurrentSeason } from '@/utils/getCurrentSeason'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user = auth()

    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    let currentSeasonData: Season
    let votingWeek: number = 0
    let isPreseason: boolean = false
    let isRegularSeason: boolean
    let regularSeason: SeasonType
    let preseason: SeasonType
    const voterBallot = []

    const currentDate = new Date()
    // TODO: Possibly cache this data or move to supabase
    const currentSeason = await getCurrentSeason()

    const { year } = currentSeason

    const espnBody: ESPNBody = await fetch(
      `https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons?startingseason=${year}`,
    ).then((res) => res.json())

    currentSeasonData = espnBody.seasons[0]

    if (currentSeasonData.types.length) {
      preseason = currentSeasonData.types.find((type) => type.type === 1)!
      regularSeason = currentSeasonData.types.find((type) => type.type === 2)!

      isPreseason =
        currentDate >= new Date(preseason.startDate) && currentDate <= new Date(preseason.endDate)

      isRegularSeason =
        currentDate >= new Date(regularSeason.startDate) &&
        currentDate <= new Date(regularSeason.endDate)

      if (isRegularSeason) {
        const currentWeek = regularSeason.weeks.find(
          (week) =>
            currentDate >= new Date(week.startDate) && currentDate <= new Date(week.endDate),
        )

        if (currentWeek) {
          votingWeek = currentWeek.number
        }
      } else {
        votingWeek = 0
      }
    }

    for (let i = 1; i <= 25; i++) {
      const rankKey = `rank_${i}`
      if (body[rankKey]) {
        voterBallot.push({
          userId: user.userId,
          division: body.division,
          week: votingWeek,
          year,
          teamId: body[rankKey],
          rank: i,
          points: 26 - i,
        })
      }
    }

    await db.insert(voterBallots).values(voterBallot)

    return new Response('OK', { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    console.error(error)
    return Response.error()
  }
}
