import * as Sentry from '@sentry/nextjs'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { votes } from '@/server/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!Array.isArray(body)) {
      console.log('Invalid request body.')
    }
    const user = auth()

    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    console.log(body)

    // const votesConverted = Object.entries(body)
    //   .map(([key, value]) => {
    //     const match = key.match(/rank_(\d+)/)
    //     if (!match) return null
    //     const rank = parseInt(match[1], 10)
    //     return { teamId: String(value), rank: rank } // Convert 'value' to a string
    //   })
    //   .map((vote) => ({
    //     userId: user.userId,
    //     week: 1,
    //     teamId: vote!.teamId,
    //     rank: vote!.rank,
    //   }))

    // await db.insert(votes).values(votesConverted)

    return new Response('OK', { status: 200 })
  } catch (error) {
    Sentry.captureException(error)
    return Response.error()
  }
}
