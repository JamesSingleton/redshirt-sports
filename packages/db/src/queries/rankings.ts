import { eq, desc } from 'drizzle-orm'

import { divisionsTable, sportsTable, weeklyFinalRankings } from '../schema'
import { primaryDb as db } from '../client'

import { getSportIdBySlug, SportParam } from './sports'
import { getWeekBySport } from './seasons'
import { type FinalRankingWithSchool } from '../types/rankings'

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

export async function getAllLegacyWeeklyRankings() {
  return db.query.weeklyFinalRankings.findMany()
}

export async function getAllWeeklyRankings() {
  return db.query.weeklyRankings.findMany()
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
}): Promise<FinalRankingWithSchool[]> {
  const sportId = await getSportIdBySlug(sport)
  if (!sportId) throw new Error(`Unable to find sport by slug. Slug: ${sport}`)

  const dbSeason = await getWeekBySport(sportId, year, week)
  if (!dbSeason) throw new Error('Unable to find season or week for rankings')

  const dbWeek = dbSeason?.seasonTypes[0]?.weeks[0]

  const divisionSport = await db.query.divisionSportsTable.findFirst({
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
    where: (model, { eq, and }) =>
      and(eq(model.weekId, dbWeek?.id || ''), eq(model.divisionSportId, divisionSport?.id || '')),
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
