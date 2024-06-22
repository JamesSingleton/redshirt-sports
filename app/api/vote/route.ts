import * as Sentry from '@sentry/nextjs'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { voterBallots } from '@/server/db/schema'

type Week = {
  number: number
  startDate: Date
  endDate: Date
  text: string
}

type SeasonTypes = {
  id: string
  type: number
  name: string
  startDate: Date
  endDate: Date
  weeks: Week[]
}

type Season = {
  year: number
  displayName: string
  startDate: Date
  endDate: Date
  types: SeasonTypes[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user = auth()

    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const voterBallot = []
    const year = new Date().getFullYear()

    for (let i = 1; i <= 25; i++) {
      const rankKey = `rank_${i}`
      if (body[rankKey]) {
        voterBallot.push({
          userId: user.userId,
          division: body.division,
          week: 0,
          year,
          teamId: body[rankKey],
          rank: i,
          points: 26 - i,
        })
      }
    }

    // const currentDate = new Date()
    let currentDate = new Date('2024-08-24T07:00:00.000+00:00')

    const espnBody = await fetch(
      'https://site.api.espn.com/apis/common/v3/sports/football/college-football/seasons',
    ).then((res) => res.json())

    const currentYearData = espnBody.seasons.find(
      (season: Season) => season.year === new Date().getFullYear(),
    )

    const regularSeasonWeeks = currentYearData.types.find(
      ({ type }: SeasonTypes) => type === 2,
    ).weeks

    const currentWeek = regularSeasonWeeks.find((week: Week) => {
      const startDate = new Date(week.startDate)
      const endDate = new Date(week.endDate)
      return currentDate >= startDate && currentDate <= endDate
    })

    await db.insert(voterBallots).values(voterBallot)

    return new Response('OK', { status: 200 })
  } catch (error) {
    // Sentry.captureException(error)
    console.error(error)
    return Response.error()
  }
}
