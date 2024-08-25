import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { desc, asc } from 'drizzle-orm'

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

export async function getYearsThatHaveVotes({ division }: { division: string }) {
  const yearsWithVotes = await db.query.weeklyFinalRankings.findMany({
    columns: {
      year: true,
    },
    where: (model, { eq }) => eq(model.division, division),
  })

  return yearsWithVotes
}

export async function getWeeksThatHaveVotes({
  year,
  division,
}: {
  year: number
  division: string
}) {
  const weeksWithVotes = await db.query.weeklyFinalRankings.findMany({
    columns: {
      week: true,
    },
    where: (model, { eq, and }) => and(eq(model.year, year), eq(model.division, division)),
  })

  return weeksWithVotes
}

export async function getVotesForWeekAndYearByVoter({
  year,
  week,
  division,
}: {
  year: number
  week: number
  division: string
}) {
  const allVotes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) =>
      and(eq(model.year, year), eq(model.week, week), eq(model.division, division)),
  })

  const uniqueUserIds = Array.from(new Set(allVotes.map((vote) => vote.userId)))

  const userBallots: { [key: string]: any } = {}

  for (const userId of uniqueUserIds) {
    const votes = allVotes.filter((vote) => vote.userId === userId)

    const userData = await db.query.usersTable.findFirst({
      where: (model, { eq }) => eq(model.id, userId),
    })

    userBallots[userId] = {
      votes,
      userData,
    }
  }

  return userBallots
}

export async function getCurrentSeasonStartAndEnd({ year }: { year: number }) {
  const season = await db.query.seasonsTable.findFirst({
    where: (model, { eq }) => eq(model.year, year),
  })

  return season
}

// get the years that have been voted on along with the weeks and the divisions
export async function getYearsWithVotes() {
  const years = await db.query.weeklyFinalRankings.findMany({
    columns: {
      year: true,
      week: true,
      division: true,
    },
  })

  return years
}

// get the last weeklyFinalRankings for a given division & return the division, week, and year
export async function getLatestFinalRankings({ division }: { division: string }) {
  const latestWeeklyRankings = await db.query.weeklyFinalRankings.findFirst({
    where: (model, { eq }) => eq(model.division, division),
    columns: {
      division: true,
      week: true,
      year: true,
    },
    orderBy: (model) => [desc(model.year), desc(model.week)],
  })

  return latestWeeklyRankings
}
