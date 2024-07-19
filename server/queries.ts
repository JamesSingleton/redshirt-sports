import 'server-only'
import { auth } from '@clerk/nextjs/server'

import { db } from '@/server/db'

interface GetUsersVote {
  year: number
  week: number
  division: string
}

type FinalRankings = {
  id: number
  division: string
  week: number
  year: number
  rankings: {
    _id: string
    _points: number
    name: string
    shortName: string
    abbreviation: string
    image: any
    rank: number
    firstPlaceVotes: number
    isTie: boolean
  }[]
}

export async function hasVoterVoted({ year, week }: GetUsersVote) {
  const user = auth()

  if (!user.userId) throw new Error('Unauthorized')

  const vote = await db.query.voterBallots.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.userId, user.userId), eq(model.year, year), eq(model.week, week)),
  })

  return !!vote
}

export async function getVoterBallots({ year, week }: GetUsersVote) {
  const user = auth()

  if (!user.userId) throw new Error('Unauthorized')

  const votes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.userId, user.userId), eq(model.year, year), eq(model.week, week)),
  })

  return votes
}

export async function getAllBallotsForWeekAndYear({ year, week, division }: GetUsersVote) {
  const votes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) => and(eq(model.year, year), eq(model.week, week)),
  })

  return votes
}

// given a year, return the weeks that have been voted on
export async function getVotedWeeks(year: number) {
  const weeks = await db.query.voterBallots.findMany({
    where: (model, { eq }) => eq(model.year, year),
  })

  return weeks
}

export async function getFinalRankingsForWeekAndYear({
  year,
  week,
}: {
  year: number
  week: number
}): Promise<FinalRankings> {
  const rankings = await db.query.weeklyFinalRankings.findFirst({
    where: (model, { eq, and }) => and(eq(model.year, year), eq(model.week, week)),
  })

  if (!rankings) {
    throw new Error('Rankings not found')
  }

  return rankings as FinalRankings
}

// given a year and week, return all votes for that week
export async function getVotesForWeekAndYear({ year, week, division }: GetUsersVote) {
  const votes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.year, year), eq(model.week, week), eq(model.division, division)),
  })

  return votes
}

export async function getVoterInfo(userId: string) {
  const user = await db.query.usersTable.findFirst({
    where: (model, { eq }) => eq(model.id, userId),
  })

  return user
}