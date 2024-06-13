import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/server/db'

export async function getUsersVote() {
  const user = auth()

  if (!user.userId) throw new Error('Unauthorized')

  const vote = await db.query.ballots.findFirst({
    where: (model, { eq, and }) => eq(model.userId, user.userId) && eq(model.week, 3),
  })

  return vote
}
