import { auth } from '@clerk/nextjs/server'
import { db } from '@/server/db'
import { votes } from '@/server/db/schema'

import { type NextRequest, NextResponse } from 'next/server'

export async function POST(req: Request) {
  console.log('POST /api/vote')
  const body = await req.json()
  console.log('body:', body)

  const user = auth()

  if (!user.userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  await db.insert(votes).values({
    userId: user.userId, // Provide a default value if user.userId is null
    teamId: body.rank_1,
    rank: 1,
    week: 1,
  })

  return new Response('OK', { status: 200 })
}
