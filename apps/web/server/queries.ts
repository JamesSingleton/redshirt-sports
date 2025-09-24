import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { desc, eq, and, sql } from 'drizzle-orm'
import {
  weeklyFinalRankings,
  voterBallots,
  sportsTable,
  SEASON_TYPE_CODES,
  divisionsTable,
} from './db/schema'

import { db } from '@/server/db'
import { client } from '@/lib/sanity/client'
import { SportParam } from '@/utils/espn'

interface GetUsersVote {
  year: number
  week: number
  division: string
  sportId: string
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

export async function hasVoterVoted({ year, week, division, sportId }: GetUsersVote) {
  const user = await auth()

  if (!user.userId) throw new Error('Unauthorized')

  const conditions = [
    eq(voterBallots.userId, user.userId),
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

export async function getVoterBallots({ year, week, division, sportId }: GetUsersVote) {
  const user = await auth()

  if (!user.userId) throw new Error('Unauthorized')
  const conditions = [
    eq(voterBallots.userId, user.userId),
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

export async function getWeekBySport(
  sportId: string,
  year: number,
  week: number,
  seasonType = SEASON_TYPE_CODES.REGULAR_SEASON,
) {
  return db.query.seasonsTable.findFirst({
    where: (model, { eq, and }) => and(eq(model.sportId, sportId), eq(model.year, year)),
    with: {
      seasonTypes: {
        where: (s, { eq }) => eq(s.type, seasonType),
        with: {
          weeks: {
            where: (w, { eq }) => eq(w.number, week),
          },
        },
      },
    },
  })
}

export async function getFinalRankingsForWeekAndYearFromDb({
  year,
  week,
  division,
  sport,
}: {
  year: number
  week: number
  division: string
  sport: SportParam
}): Promise<any> {
  const sportId = await getSportIdBySlug(sport)
  if (!sportId) throw new Error(`Unable to find sport by slug. Slug: ${sport}`)

  const dbSeason = await getWeekBySport(sportId, year, week)
  if (!dbSeason) throw new Error('Unable to find season or week for rankings')

  const dbWeek = dbSeason?.seasonTypes[0]?.weeks[0]

  const subdivisionSport = await db.query.divisionSportsTable.findFirst({
    where: (model, { eq, and }) =>
      and(
        eq(model.sportId, sportId),
        eq(
          model.divisionId,
          db
            .select({ id: divisionsTable.id })
            .from(divisionsTable)
            .where(eq(divisionsTable.slug, division)),
        ),
      ),
  })

  const rankings = await db.query.weeklyRankings.findMany({
    where: (model, { eq }) =>
      and(
        eq(model.weekId, dbWeek?.id || ''),
        eq(model.divisionSportId, subdivisionSport?.id || ''),
      ),
    with: {
      school: true,
    },
    orderBy: (model, { asc }) => asc(model.ranking),
  })

  return rankings
}

export async function getFinalRankingsForWeekAndYear({
  year,
  week,
  division,
}: {
  year: number
  week: number
  division: string
}): Promise<FinalRankings> {
  const rankings = await db.query.weeklyFinalRankings.findFirst({
    where: (model, { eq, and }) =>
      and(eq(model.year, year), eq(model.week, week), eq(model.division, division)),
  })

  if (!rankings) {
    throw new Error('Rankings not found')
  }

  return rankings as FinalRankings
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
export async function getCurrentSeasonStartAndEnd({
  sportId,
  year,
}: {
  sportId: string
  year: number
}) {
  const season = await db.query.seasonsTable.findFirst({
    where: (model, { eq }) => and(eq(model.year, year), eq(model.sportId, sportId)),
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

export async function getLatestFinalRankingsBySportSlug(sportSlug: string) {
  // Use DISTINCT ON to get the latest ranking for each division in a single query
  const results = await db
    .selectDistinctOn([weeklyFinalRankings.division], {
      division: weeklyFinalRankings.division,
      week: weeklyFinalRankings.week,
      year: weeklyFinalRankings.year,
    })
    .from(weeklyFinalRankings)
    .innerJoin(sportsTable, eq(weeklyFinalRankings.sportId, sportsTable.id))
    .where(eq(sportsTable.slug, sportSlug))
    .orderBy(
      weeklyFinalRankings.division,
      desc(weeklyFinalRankings.year),
      desc(weeklyFinalRankings.week),
    )

  return results
}

type VoterBallotWithSchool = {
  id: number
  userId: string
  division: string
  week: number
  year: number
  createdAt: Date
  teamId: string
  rank: number
  points: number
  schoolName: string
  schoolShortName: string
  schoolAbbreviation: string
  schoolNickname: string
  schoolImageUrl: string
}

export async function getLatestVoterBallotWithSchools(
  userId: string,
  division: string,
  sport: SportParam,
  currentYear: number,
): Promise<VoterBallotWithSchool[]> {
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
  const ballotsResult = await db
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

  // Fetch school information from Sanity
  const schoolIds = ballotsResult.map((ballot) => ballot.teamId)
  const schoolsQuery = `*[_type == "school" && _id in $schoolIds]{
    _id,
    name,
    shortName,
    abbreviation,
    nickname,
    image{
      ...,
      "alt": coalesce(asset->altText, caption, asset->originalFilename, "Image-Broken"),
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
    }
  }`
  const schools = await client.fetch(schoolsQuery, { schoolIds })

  // Combine the ballot data with school information
  const ballotsWithSchools: VoterBallotWithSchool[] = ballotsResult.map((ballot) => {
    const school = schools.find((s: any) => s._id === ballot.teamId)
    return {
      ...ballot,
      schoolName: school?.name || '',
      schoolShortName: school?.shortName || '',
      schoolAbbreviation: school?.abbreviation || '',
      schoolNickname: school?.nickname || '',
      schoolImageUrl: school?.image || '',
    }
  })

  return ballotsWithSchools
}

export async function getSportIdBySlug(slug: SportParam): Promise<string | null> {
  const result = await db
    .select({ id: sportsTable.id })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1)

  return result[0]?.id || null
}
