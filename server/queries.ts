import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { alias } from 'drizzle-orm/pg-core'
import { desc, eq, and, sql, or, SQL } from 'drizzle-orm'
import {
  weeklyFinalRankings,
  voterBallots,
  transferPortalEntries,
  players,
  schoolReferences,
  positions,
  classYears,
} from './db/schema'
import { getSchoolsBySanityIds } from '@/lib/sanity.fetch'

import { db } from '@/server/db'
import { client } from '@/lib/sanity.client'

import type { TransferPortalFilters } from '@/types/transfer-portal'

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
  const distinctYearsWithVotes = await db
    .selectDistinct({
      year: weeklyFinalRankings.year,
    })
    .from(weeklyFinalRankings)

  return distinctYearsWithVotes.sort((a, b) => a.year - b.year)
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
): Promise<VoterBallotWithSchool[]> {
  // First, fetch the latest ballot metadata
  const latestBallotMeta = await db
    .select({
      week: voterBallots.week,
      year: voterBallots.year,
      createdAt: voterBallots.createdAt,
    })
    .from(voterBallots)
    .where(and(eq(voterBallots.userId, userId), eq(voterBallots.division, division)))
    .orderBy(desc(voterBallots.createdAt))
    .limit(1)

  if (latestBallotMeta.length === 0) {
    return [] // No ballot found
  }

  const { week, year, createdAt } = latestBallotMeta[0]

  // Fetch all 25 entries for the latest ballot
  const ballots = await db
    .select()
    .from(voterBallots)
    .where(
      and(
        eq(voterBallots.userId, userId),
        eq(voterBallots.division, division),
        eq(voterBallots.week, week),
        eq(voterBallots.year, year),
      ),
    )
    .orderBy(voterBallots.rank)

  // Fetch school information from Sanity
  const schoolIds = ballots.map((ballot) => ballot.teamId)
  const schoolsQuery = `*[_type == "school" && _id in $schoolIds]{
    _id,
    name,
    shortName,
    abbreviation,
    nickname,
    "imageUrl": image.asset->url
  }`
  const schools = await client.fetch(schoolsQuery, { schoolIds })

  // Combine the ballot data with school information
  const ballotsWithSchools: VoterBallotWithSchool[] = ballots.map((ballot) => {
    const school = schools.find((s: any) => s._id === ballot.teamId)
    return {
      ...ballot,
      schoolName: school?.name || '',
      schoolShortName: school?.shortName || '',
      schoolAbbreviation: school?.abbreviation || '',
      schoolNickname: school?.nickname || '',
      schoolImageUrl: school?.imageUrl || '',
    }
  })

  return ballotsWithSchools
}

// Transfer Portal Tracker
export async function getPositions() {
  const playerPositions = await db.query.positions.findMany({
    orderBy: (positions) => positions.id,
  })

  return playerPositions
}

export async function getTransferCycleYears() {
  const cycleYears = await db.query.cycleYears.findMany({
    orderBy: (cycleYears, { desc }) => desc(cycleYears.year),
  })

  return cycleYears
}

export async function getSchools() {
  const schools = await db.query.schoolReferences.findMany({
    orderBy: (schools, { asc }) => asc(schools.name),
  })

  return schools
}

export async function getTransferPortalEntries(
  page: number = 1,
  pageSize: number = 20,
  filters: TransferPortalFilters = {},
) {
  const offset = (page - 1) * pageSize

  // Create aliases for the schoolReferences table
  const previousSchool = alias(schoolReferences, 'previous_school')
  const commitmentSchool = alias(schoolReferences, 'commitment_school')

  const filtersArray: (SQL | undefined)[] = []

  console.log({ filters })

  // if (filters.year) {
  //   filtersArray.push(eq(transferPortalEntries.cycleYear, filters.year))
  // }

  if (filters.status) {
    filtersArray.push(eq(transferPortalEntries.transferStatus, filters.status))
  }

  if (filters.position) {
    // position will be something like "QB" or "RB"
    const position = filters.position.toUpperCase()
    filtersArray.push(eq(positions.abbreviation, position))
  }

  if (filters.isGradTransfer) {
    filtersArray.push(eq(transferPortalEntries.isGradTransfer, filters.isGradTransfer))
  }

  const query = db
    .select({
      id: transferPortalEntries.id,
      entryDate: transferPortalEntries.entryDate,
      transferStatus: transferPortalEntries.transferStatus,
      isGradTransfer: transferPortalEntries.isGradTransfer,
      createdAt: transferPortalEntries.createdAt,
      updatedAt: transferPortalEntries.updatedAt,
      lastStatusChangeAt: transferPortalEntries.lastStatusChangeAt,
      firstName: players.firstName,
      lastName: players.lastName,
      height: players.height,
      weight: players.weight,
      highSchool: players.highSchool,
      hometown: players.hometown,
      state: players.state,
      playerImageUrl: players.playerImageUrl,
      instagramHandle: players.instagramHandle,
      twitterHandle: players.twitterHandle,
      position: positions.name,
      positionAbbreviation: positions.abbreviation,
      classYear: classYears.name,
      classYearAbbreviation: classYears.abbreviation,
      previousSchoolName: previousSchool.name,
      previousSchoolSanityId: previousSchool.sanityId,
      commitmentSchoolName: commitmentSchool.name,
      commitmentSchoolSanityId: commitmentSchool.sanityId,
      commitmentDate: transferPortalEntries.commitmentDate,
    })
    .from(transferPortalEntries)
    .innerJoin(players, eq(transferPortalEntries.playerId, players.id))
    .innerJoin(positions, eq(players.positionId, positions.id))
    .innerJoin(classYears, eq(players.classYearId, classYears.id))
    .innerJoin(previousSchool, eq(transferPortalEntries.previousSchoolId, previousSchool.id))
    .leftJoin(commitmentSchool, eq(transferPortalEntries.commitmentSchoolId, commitmentSchool.id))
    .where(and(...filtersArray))

  const entries = await query
    .orderBy(desc(transferPortalEntries.lastStatusChangeAt), desc(transferPortalEntries.createdAt))
    .limit(pageSize)
    .offset(offset)

  // Fetch school images from Sanity
  const schoolSanityIds = [
    ...new Set(
      entries
        .map((e) => e.previousSchoolSanityId)
        .concat(
          entries.map((e) => e.commitmentSchoolSanityId).filter((id): id is string => id !== null),
        ),
    ),
  ]
  const schoolImages = await getSchoolsBySanityIds(schoolSanityIds)

  // Combine database results with Sanity images
  return entries.map((entry) => ({
    ...entry,
    previousSchool: schoolImages[entry.previousSchoolSanityId],
    commitmentSchool: entry.commitmentSchoolSanityId
      ? schoolImages[entry.commitmentSchoolSanityId]
      : null,
  }))
}
