import { primaryDb as db } from '../client'

import { SEASON_TYPE_CODES } from '../schema'

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

export async function getSeasonByYearAndSportId({
  sportId,
  year,
}: {
  sportId: string
  year: number
}) {
  const season = await db.query.seasonsTable.findFirst({
    where: (model, { eq, and }) => and(eq(model.year, year), eq(model.sportId, sportId)),
  })

  return season
}

export async function getSeasonWithTypesByYearAndSportId({
  sportId,
  year,
}: {
  sportId: string
  year: number
}) {
  const season = await db.query.seasonsTable.findFirst({
    where: (model, { eq, and }) => and(eq(model.year, year), eq(model.sportId, sportId)),
    with: {
      seasonTypes: {
        with: {
          weeks: true,
        },
      },
    },
  })

  return season
}

export async function getSeasonsForSport(sportId: string) {
  return db.query.seasonsTable.findMany({ where: (model, { eq }) => eq(model.sportId, sportId) })
}
