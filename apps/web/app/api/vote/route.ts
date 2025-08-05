import * as Sentry from '@sentry/nextjs'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { voterBallots } from '@/server/db/schema'

import { getSeasonInfo } from '@/utils/espn'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user = await auth()

    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const voterBallot = []

    // Get current season info using the consolidated ESPN utilities
    const seasonInfo = await getSeasonInfo('football')
    const { year, currentWeek: votingWeek } = seasonInfo

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
