import { sanityFetch } from '@/lib/sanity/live'
import { sportInfoQuery } from '@/lib/sanity/query'
import { db } from '@/server/db'
import {
  InsertSeason,
  InsertSeasonType,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from '@/server/db/schema'
import { fetchWeeksFromSportsUrl, getMultipleSeasonsData, SportParam } from './espn'

interface SanitySport {
  _id: string
  slug: string
  title: string
  _createdAt: string
  _updatedAt: string
}

export async function fetchAndLoadSeasons(
  sport: SportParam,
  startingSeason = new Date().getFullYear() - 3,
) {
  const espnSeasons = await getMultipleSeasonsData(sport, startingSeason)

  const dbSport = await sportBySlug(sport)

  for (const season of espnSeasons) {
    const newSeason = {
      year: season.year,
      displayName: season.displayName,
      startDate: new Date(season.startDate),
      endDate: new Date(season.endDate),
      sportId: dbSport.id,
    }

    const dbSeason = await findOrCreateSeason(newSeason)

    for (const seasonType of season.types) {
      const newSeasonType = {
        type: seasonType.type,
        startDate: new Date(seasonType.startDate),
        endDate: new Date(seasonType.endDate),
        seasonId: dbSeason.id,
      }

      const dbSeasonType = await findOrCreateSeasonType(newSeasonType)

      let sourceWeeks = []
      if (seasonType.weeks) {
        sourceWeeks = seasonType.weeks
      } else {
        sourceWeeks = await fetchWeeksFromSportsUrl(sport, dbSeason.year, dbSeasonType.type)
      }

      const mappedWeeks = sourceWeeks.map((week) => ({
        number: week.number,
        text: week.text,
        startDate: new Date(week.startDate),
        endDate: new Date(week.endDate),
        seasonTypeId: dbSeasonType.id,
      }))

      if (mappedWeeks.length) {
        const existingWeeks = await db.query.weeksTable.findMany({
          where: (model, { eq }) => eq(model.seasonTypeId, dbSeasonType.id),
        })

        if (existingWeeks.length) {
          console.log('Existing weeks found. Skipping load of weeks.')
        } else {
          try {
            await db.insert(weeksTable).values(mappedWeeks)
          } catch {
            throw new Error('Unable to create weeks! Aborting.')
          }
        }
      }
    }
  }
}

async function findOrCreateSeasonType(seasonType: InsertSeasonType) {
  try {
    let dbSeasonType = await db.query.seasonTypesTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.type, seasonType.type), eq(model.seasonId, seasonType.seasonId)),
    })
    if (!dbSeasonType) {
      const insertedSeasonType = await db.insert(seasonTypesTable).values(seasonType).returning()
      dbSeasonType = insertedSeasonType[0]
    }
    return dbSeasonType!
  } catch {
    throw new Error('Unable to find or create season type! Aborting.')
  }
}

async function findOrCreateSeason(season: InsertSeason) {
  try {
    let dbSeason = await db.query.seasonsTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.year, season.year), eq(model.sportId, season.sportId)),
    })
    if (!dbSeason) {
      const insertedSeason = await db.insert(seasonsTable).values(season).returning()
      dbSeason = insertedSeason[0]
    }
    return dbSeason!
  } catch {
    throw new Error('Unable to find or create season! Aborting.')
  }
}

async function sportBySlug(slug: string) {
  const dbSport = await db.query.sportsTable.findFirst({
    where: (model, { eq }) => eq(model.slug, slug),
  })

  if (!dbSport) {
    throw new Error('Sport data not yet loaded. Please load sport before creating seasons.')
  }

  return dbSport
}

export async function fetchAndLoadSports() {
  const { data } = await sanityFetch({ query: sportInfoQuery })
  const mappedSports = data.map((d: SanitySport) => ({
    id: d._id,
    slug: d.slug,
    name: d.title,
    displayName: d.title,
    createdAt: new Date(d._createdAt),
    updatedAt: new Date(d._updatedAt),
  }))

  return db.insert(sportsTable).values(mappedSports)
}
