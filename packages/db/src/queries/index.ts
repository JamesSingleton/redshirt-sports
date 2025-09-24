export * from './voting'
import 'server-only'
import { eq, and } from 'drizzle-orm'
import { sportsTable, SEASON_TYPE_CODES, divisionsTable } from '../schema'

import { primaryDb as db } from '../client'

export type SportParam = 'football' | 'mens-basketball' | 'womens-basketball'

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

  console.log({ divisionSport })

  const rankings = await db.query.weeklyRankings.findMany({
    where: (model, { eq }) =>
      and(eq(model.weekId, dbWeek?.id || ''), eq(model.divisionSportId, divisionSport?.id || '')),
    with: {
      school: true,
    },
    orderBy: (model, { asc }) => asc(model.ranking),
  })

  return rankings
}

export async function getSportIdBySlug(slug: SportParam): Promise<string | null> {
  const result = await db
    .select({ id: sportsTable.id })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1)

  return result[0]?.id || null
}

export async function getAllLegacyWeeklyRankings() {
  return db.query.weeklyFinalRankings.findMany()
}

export async function getAllWeeklyRankings() {
  return db.query.weeklyRankings.findMany()
}
