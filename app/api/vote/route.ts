import * as Sentry from '@sentry/nextjs'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { ballots } from '@/server/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const user = auth()

    if (!user.userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    await db.insert(ballots).values({
      userId: user.userId,
      week: 3,
      rank_1: body.rank_1,
      rank_2: body.rank_2,
      rank_3: body.rank_3,
      rank_4: body.rank_4,
      rank_5: body.rank_5,
      rank_6: body.rank_6,
      rank_7: body.rank_7,
      rank_8: body.rank_8,
      rank_9: body.rank_9,
      rank_10: body.rank_10,
      rank_11: body.rank_11,
      rank_12: body.rank_12,
      rank_13: body.rank_13,
      rank_14: body.rank_14,
      rank_15: body.rank_15,
      rank_16: body.rank_16,
      rank_17: body.rank_17,
      rank_18: body.rank_18,
      rank_19: body.rank_19,
      rank_20: body.rank_20,
      rank_21: body.rank_21,
      rank_22: body.rank_22,
      rank_23: body.rank_23,
      rank_24: body.rank_24,
      rank_25: body.rank_25,
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    // Sentry.captureException(error)
    console.error(error)
    return Response.error()
  }
}
