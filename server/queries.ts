import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'

import { db } from '@/server/db'

interface GetUsersVote {
  year: number
  week: number
}

export async function getUsersVote({ year, week }: GetUsersVote) {
  const user = auth()

  if (!user.userId) throw new Error('Unauthorized')

  const vote = await db.query.ballots.findFirst({
    where: (model, { eq, and }) =>
      eq(model.userId, user.userId) && eq(model.year, year) && eq(model.week, week),
  })

  return vote
}
