import { eq, desc, and } from 'drizzle-orm'
import { sportsTable, voterBallots, weeklyFinalRankings } from '../schema'
import { primaryDb as db } from '../client'
import { SportParam } from './sports'

interface GetUsersVote {
  year: number
  week: number
  division: string
  sportId: string
  userId: string
}

export async function hasVoterVoted({ year, week, division, sportId, userId }: GetUsersVote) {
  const conditions = [
    eq(voterBallots.userId, userId),
    eq(voterBallots.year, year),
    eq(voterBallots.week, week),
  ]

  if (division) {
    conditions.push(eq(voterBallots.division, division))
  }

  if (sportId) {
    conditions.push(eq(voterBallots.sportId, sportId))
  }

  const vote = await db.query.voterBallots.findFirst({
    where: (model, { eq, and }) => and(...conditions),
  })

  return !!vote
}

export async function getVoterBallots({ year, week, division, sportId, userId }: GetUsersVote) {
  const conditions = [
    eq(voterBallots.userId, userId),
    eq(voterBallots.year, year),
    eq(voterBallots.week, week),
    eq(voterBallots.division, division),
    eq(voterBallots.sportId, sportId),
  ]

  const votes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) => and(...conditions),
  })

  return votes
}

export async function getBallotsByWeekYearDivisionAndSport({
  year,
  week,
  division,
  sportId,
}: GetUsersVote) {
  const votes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) =>
      and(
        eq(model.year, year),
        eq(model.week, week),
        eq(model.division, division),
        eq(model.sportId, sportId),
      ),
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

export async function getYearsThatHaveVotes({ division }: { division: string }) {
  const distinctYearsWithVotes = await db
    .selectDistinctOn([weeklyFinalRankings.year])
    .from(weeklyFinalRankings)
    .where(eq(weeklyFinalRankings.division, division))
    .orderBy(desc(weeklyFinalRankings.year))

  return distinctYearsWithVotes
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

  return weeksWithVotes.sort((a, b) => a.week - b.week)
}

export async function getVotesForWeekAndYearByVoter({
  year,
  week,
  division,
  sportId,
}: {
  year: number
  week: number
  division: string
  sportId: string
}) {
  const allVotes = await db.query.voterBallots.findMany({
    where: (model, { eq, and }) =>
      and(
        eq(model.year, year),
        eq(model.week, week),
        eq(model.division, division),
        eq(model.sportId, sportId),
      ),
  })

  if (allVotes.length === 0) {
    return {}
  }

  const uniqueUserIds = Array.from(new Set(allVotes.map((vote) => vote.userId)))

  const allUsers = await db.query.usersTable.findMany({
    where: (model, { inArray }) => inArray(model.id, uniqueUserIds),
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      organization: true,
      organizationRole: true,
    },
  })

  const userMap = new Map(allUsers.map((user) => [user.id, user]))

  const userBallots: { [key: string]: any } = {}

  for (const vote of allVotes) {
    if (!userBallots[vote.userId]) {
      userBallots[vote.userId] = {
        votes: [],
        userData: userMap.get(vote.userId),
      }
    }
    userBallots[vote.userId].votes.push(vote)
  }

  return userBallots
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
export async function getLatestVoterBallot(
  userId: string,
  division: string,
  sport: SportParam,
  currentYear: number,
) {
  // First, fetch the latest ballot metadata for the current season and sport
  const latestBallotMeta = await db
    .select({
      week: voterBallots.week,
      year: voterBallots.year,
      createdAt: voterBallots.createdAt,
    })
    .from(voterBallots)
    .innerJoin(sportsTable, eq(voterBallots.sportId, sportsTable.id))
    .where(
      and(
        eq(voterBallots.userId, userId),
        eq(voterBallots.division, division),
        eq(sportsTable.slug, sport), // Filter by sport slug
        eq(voterBallots.year, currentYear),
      ),
    )
    .orderBy(desc(voterBallots.createdAt))
    .limit(1)

  if (latestBallotMeta.length === 0) {
    return [] // No ballot found for current season/sport
  }

  const { week, year } = latestBallotMeta[0]!

  // Fetch all 25 entries for the latest ballot
  return db
    .select({
      // Select only the ballot fields we need
      id: voterBallots.id,
      userId: voterBallots.userId,
      division: voterBallots.division,
      week: voterBallots.week,
      year: voterBallots.year,
      createdAt: voterBallots.createdAt,
      teamId: voterBallots.teamId,
      rank: voterBallots.rank,
      points: voterBallots.points,
      sportId: voterBallots.sportId,
    })
    .from(voterBallots)
    .innerJoin(sportsTable, eq(voterBallots.sportId, sportsTable.id))
    .where(
      and(
        eq(voterBallots.userId, userId),
        eq(voterBallots.division, division),
        eq(sportsTable.slug, sport),
        eq(voterBallots.week, week),
        eq(voterBallots.year, year),
      ),
    )
    .orderBy(voterBallots.rank)

  // split into two functions and call from a service
  // here down
}
