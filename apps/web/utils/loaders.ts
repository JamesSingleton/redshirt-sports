import { sanityFetch } from '@/lib/sanity/live'
import {
  conferencesQuery,
  divisionsQuery,
  schoolsQuery,
  sportInfoQuery,
  subdivisionsQuery,
} from '@/lib/sanity/query'
import { db } from '@/server/db'
import {
  conferencesTable,
  divisionsTable,
  InsertSeason,
  InsertSeasonType,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  weeksTable,
} from '@/server/db/schema'
import { fetchWeeksFromSportsUrl, getMultipleSeasonsData, SportParam } from './espn'

interface BaseSanityObject {
  _id: string
  _createdAt: string
  _updatedAt: string
}

interface BaseSanityObjectWithName {
  _createdAt: string
  _id: string
  _updatedAt: string
  name: string
}

interface SanitySport extends BaseSanityObject {
  slug: string
  title: string
}

interface SanityConference extends BaseSanityObjectWithName {
  divisionId: string
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

export async function fetchAndLoadDivisions() {
  const { data } = await sanityFetch({ query: divisionsQuery })
  const mappedDivisions = data.map((d: BaseSanityObjectWithName) => ({
    sanityId: d._id,
    name: d.name,
    createdAt: new Date(d._createdAt),
    updatedAt: new Date(d._updatedAt),
  }))

  return db.insert(divisionsTable).values(mappedDivisions)
}

export async function fetchAndLoadSchools() {
  const { data } = await sanityFetch({ query: schoolsQuery })
  const mappedSchools = data.map((d: BaseSanityObjectWithName) => ({
    sanityId: d._id,
    name: d.name,
    createdAt: new Date(d._createdAt),
    updatedAt: new Date(d._updatedAt),
  }))

  return db.insert(schoolsTable).values(mappedSchools)
}

export async function fetchAndLoadConferences() {
  const { data } = await sanityFetch({ query: conferencesQuery })
  const divisions = await db.query.divisionsTable.findMany()
  if (!divisions.length) {
    throw new Error('No divisions found. Divisions must be loaded prior to conferences.')
  }
  const mappedConferences = data.map((d: SanityConference) => {
    const divisionId = divisions.find((division) => division.sanityId === d.divisionId)?.id

    if (!divisionId) {
      throw new Error(`Unable to find a division for conference ${d.name}`)
    }

    return {
      sanityId: d._id,
      name: d.name,
      divisionId,
      createdAt: new Date(d._createdAt),
      updatedAt: new Date(d._updatedAt),
    }
  })

  return db.insert(conferencesTable).values(mappedConferences)
}

export async function fetchAndLoadSubdivisions() {
  const { data } = await sanityFetch({ query: subdivisionsQuery })
  const sports = await db.query.sportsTable.findMany()
  if (!sports.length) {
    throw new Error('No sports found. Sports must be loaded prior to subdivisions.')
  }

  // const subdivisions = data.map(d=> {
  //   const divisionId =
  // })
}
