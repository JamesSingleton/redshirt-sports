'use server'

import { sanityFetch } from '@redshirt-sports/sanity/live'
import {
  conferencesQuery,
  divisionsQuery,
  schoolsQuery,
  sportInfoQuery,
  subdivisionsQuery,
} from '@redshirt-sports/sanity/queries'
import { primaryDb as db } from '@redshirt-sports/db/client'
import {
  conferenceSportsTable,
  conferencesTable,
  divisionsTable,
  InsertConferenceSports,
  InsertSchoolConferenceAffiliations,
  InsertSeason,
  InsertSeasonType,
  InsertDivisionSports,
  schoolConferenceAffiliationsTable,
  schoolsTable,
  seasonsTable,
  seasonTypesTable,
  sportsTable,
  divisionSportsTable,
  weeksTable,
  weeklyRankings,
  SEASON_TYPE_CODES,
} from '@redshirt-sports/db/schema'
import {
  fetchWeeksFromSportsUrl,
  getMultipleSeasonsData,
  SportParam,
} from '@redshirt-sports/clients/espn'

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
  shortName: string
  abbreviation: string
  slug: string
  logo: Record<string, any>
  sports: string[]
}

interface SanityDivision extends BaseSanityObjectWithName {
  title: string
  heading: string
  longName: string
  slug: string
  description: string
  logo: Record<string, any>
}

interface SanitySchool extends BaseSanityObjectWithName {
  shortName: string
  abbreviation: string
  nickname: string
  top25VotingEligible: boolean
  image: Record<string, any>
  conferenceAffiliations: Record<'conferenceId' | 'sportId', string>[]
}

interface SanitySubdivision extends BaseSanityObjectWithName {
  shortName: string
  slug: string
  parentDivisionId: string
  applicableSports: string[]
}

export async function fetchAndLoadAllSeasons() {
  await Promise.all(
    ['football', 'mens-basketball', 'womens-basketball'].map((sport) =>
      fetchAndLoadSeasons(sport as SportParam, 2023),
    ),
  )
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

  await db.insert(sportsTable).values(mappedSports)
}

export async function fetchAndLoadDivisions() {
  const { data } = await sanityFetch({ query: divisionsQuery })
  const mappedDivisions = data.map((d: SanityDivision) => ({
    sanityId: d._id,
    name: d.name,
    title: d.title,
    description: d.description,
    heading: d.heading,
    longName: d.longName,
    slug: d.slug,
    logo: d.logo,
    createdAt: new Date(d._createdAt),
    updatedAt: new Date(d._updatedAt),
  }))

  await db.insert(divisionsTable).values(mappedDivisions)
}

export async function fetchAndLoadSchools() {
  const sports = await db.query.sportsTable.findMany()
  if (!sports.length) {
    throw new Error('No sports found. Sports must be loaded prior to conferences.')
  }
  const conferences = await db.query.conferencesTable.findMany()
  if (!conferences.length) {
    throw new Error('No conferences found. conferences must be loaded prior to schools.')
  }

  const { data } = await sanityFetch({ query: schoolsQuery })

  let schoolConferenceAffiliations: Record<string, string>[] = []
  const mappedSchools = data.map((d: SanitySchool) => {
    d.conferenceAffiliations?.forEach((affiliation) => {
      const conference = conferences.find((c) => c.sanityId === affiliation.conferenceId)
      if (conference) {
        schoolConferenceAffiliations.push({
          schoolName: d.name,
          conferenceId: conference?.id || '',
          sportId: affiliation.sportId, // sport ids are mapped to sanity ids so we don't need to do any lookups
        })
      } else {
        console.log('no conference found')
      }
    })

    return {
      sanityId: d._id,
      name: d.name,
      shortName: d.shortName,
      abbreviation: d.abbreviation,
      nickname: d.nickname,
      top25Eligible: d.top25VotingEligible,
      image: d.image,
      createdAt: new Date(d._createdAt),
      updatedAt: new Date(d._updatedAt),
    }
  })

  const dbSchools = await db.insert(schoolsTable).values(mappedSchools).returning()

  schoolConferenceAffiliations = schoolConferenceAffiliations.map((affiliation) => {
    const school = dbSchools.find((s) => s.name === affiliation.schoolName)

    return {
      conferenceId: affiliation.conferenceId!,
      schoolId: school?.id || '',
      sportId: affiliation.sportId!,
    }
  })

  await db
    .insert(schoolConferenceAffiliationsTable)
    .values(schoolConferenceAffiliations as unknown as InsertSchoolConferenceAffiliations)
}

export async function fetchAndLoadConferences() {
  const sports = await db.query.sportsTable.findMany()
  if (!sports.length) {
    throw new Error('No sports found. Sports must be loaded prior to conferences.')
  }
  const divisions = await db.query.divisionsTable.findMany()
  if (!divisions.length) {
    throw new Error('No divisions found. Divisions must be loaded prior to conferences.')
  }

  const { data } = await sanityFetch({ query: conferencesQuery })
  let conferenceSportMappings: Record<string, string>[] = []

  const mappedConferences = data.map((conference: SanityConference) => {
    const divisionId = divisions.find((division) => division.sanityId === conference.divisionId)?.id

    if (!divisionId) {
      throw new Error(`Unable to find a division for conference ${conference.name}`)
    }

    if (conference?.sports?.length) {
      conference.sports.forEach((sport) =>
        conferenceSportMappings.push({ sportId: sport, conferenceName: conference.name }),
      )
    }

    return {
      sanityId: conference._id,
      name: conference.name,
      divisionId,
      shortName: conference.shortName,
      abbreviation: conference.abbreviation,
      slug: conference.slug,
      logo: conference.logo,
      createdAt: new Date(conference._createdAt),
      updatedAt: new Date(conference._updatedAt),
    }
  })

  const dbConferences = await db.insert(conferencesTable).values(mappedConferences).returning()

  conferenceSportMappings = conferenceSportMappings.map((mapping) => {
    const conf = dbConferences.find((dbc) => dbc.name === mapping.conferenceName)
    return {
      sportId: mapping.sportId!,
      conferenceId: conf?.id || '',
    }
  })

  await db
    .insert(conferenceSportsTable)
    .values(conferenceSportMappings as unknown as InsertConferenceSports)
}

export async function fetchAndLoadSubdivisions() {
  const sports = await db.query.sportsTable.findMany()
  if (!sports.length) {
    throw new Error('No sports found. Sports must be loaded prior to subdivisions.')
  }

  const divisions = await db.query.divisionsTable.findMany()
  if (!divisions.length) {
    throw new Error('No divisions found. Divisions must be loaded prior to conferences.')
  }
  const { data } = await sanityFetch({ query: subdivisionsQuery })

  let divisionSportMappings: Record<string, string>[] = []

  const subdivisions = data.map((d: SanitySubdivision) => {
    const division = divisions.find((div) => div.sanityId === d.parentDivisionId)
    d.applicableSports.forEach((sport: string) =>
      divisionSportMappings.push({
        subdivisionName: d.shortName,
        sportId: sport,
      }),
    )

    return {
      divisionId: division?.id,
      name: d.shortName,
      longName: d.name,
      sanityId: d._id,
      slug: d.slug,
      isSubdivision: true,
    }
  })

  const dbSubdivisions = await db.insert(divisionsTable).values(subdivisions).returning()

  divisionSportMappings = divisionSportMappings.map((mapping) => {
    const subdivision = dbSubdivisions.find(
      (subdivision) => subdivision.name === mapping.subdivisionName,
    )
    return {
      sportId: mapping.sportId!,
      divisionId: subdivision?.id || '',
    }
  })

  await db
    .insert(divisionSportsTable)
    .values(divisionSportMappings as unknown as InsertDivisionSports)
}

export async function fetchAndTransformRankings() {
  const legacyRankings = await db.query.weeklyFinalRankings.findMany()
  if (!legacyRankings) return

  for (const jsonRanking of legacyRankings) {
    const seasonTypeCode =
      jsonRanking.week === 0 ? SEASON_TYPE_CODES.PRESEASON : SEASON_TYPE_CODES.REGULAR_SEASON

    const season = await db.query.seasonsTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.sportId, jsonRanking.sportId || ''), eq(model.year, jsonRanking.year)),
      with: {
        seasonTypes: {
          where: (seasonType, { eq }) => eq(seasonType.type, seasonTypeCode),
          with: {
            weeks: {
              where: (week, { eq }) => eq(week.number, jsonRanking.week),
            },
          },
        },
      },
    })

    const division = await db.query.divisionsTable.findFirst({
      where: (model, { eq }) => eq(model.slug, jsonRanking.division),
    })
    const divisionSport = await db.query.divisionSportsTable.findFirst({
      where: (model, { eq, and }) =>
        and(eq(model.divisionId, division?.id || ''), eq(model.sportId, jsonRanking.sportId || '')),
    })

    const staticFields = {
      divisionSportId: divisionSport?.id,
      weekId: season?.seasonTypes[0]?.weeks[0]?.id || '',
    }

    const transformedRankings = []
    for (const r of jsonRanking.rankings as any) {
      const school = await schoolBySanityId(r._id)
      if (!school) {
        console.log('no team found')
      } else {
        transformedRankings.push({
          ...staticFields,
          schoolId: school!.id,
          ranking: r.rank,
          isTie: r.isTie ?? false,
          points: r._points,
          firstPlaceVotes: r.firstPlaceVotes,
        })
      }
    }

    try {
      await db.insert(weeklyRankings).values(transformedRankings)
    } catch (e) {
      console.log(e)
    }
  }
}

async function schoolBySanityId(sanityId: string) {
  return db.query.schoolsTable.findFirst({ where: (model, { eq }) => eq(model.sanityId, sanityId) })
}
