import { db } from '@/server/db'
import {
  transferPortalEntries,
  players,
  schoolReferences,
  positions,
  classYears,
} from '@/server/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getSchoolsBySanityIds } from '@/lib/sanity.fetch'

export async function getTransferPortalEntriesWithDetails(year: number, limit = 50, offset = 0) {
  // Start with the base query
  let query = db
    .select({
      entry: transferPortalEntries,
      player: players,
      position: positions,
      previousSchool: schoolReferences,
      classYear: classYears,
    })
    .from(transferPortalEntries)
    .innerJoin(players, eq(transferPortalEntries.playerId, players.id))
    .innerJoin(classYears, eq(transferPortalEntries.classYearId, classYears.id))
    .innerJoin(positions, eq(players.positionId, positions.id))
    .leftJoin(schoolReferences, eq(transferPortalEntries.previousSchoolId, schoolReferences.id))
    .orderBy(desc(transferPortalEntries.entryDate))
    .limit(limit)
    .offset(offset)
    .where(eq(transferPortalEntries.year, year))

  // Apply year filter if provided
  // if (year) {
  //   query = query.where(eq(transferPortalEntries.year, year))
  // }

  const entries = await query

  // Fetch commitment schools, offers, and recruiting visits for each entry
  const entriesWithDetails = await Promise.all(
    entries.map(async (entry) => {
      const [commitmentSchool] = await db
        .select()
        .from(schoolReferences)
        .where(eq(schoolReferences.id, entry.entry.commitmentSchoolId || 0))
        .limit(1)

      return {
        ...entry,
        commitmentSchool,
      }
    }),
  )

  // Extract unique Sanity IDs for schools
  const schoolSanityIds = [
    ...new Set(
      entriesWithDetails
        .flatMap((entry) => [entry.previousSchool?.sanityId, entry.commitmentSchool?.sanityId])
        .filter(Boolean),
    ),
  ]

  // Fetch school data from Sanity
  const schoolsData = await getSchoolsBySanityIds(
    schoolSanityIds.filter((id): id is string => !!id),
  )

  // Combine database and Sanity data
  return entriesWithDetails.map((entry) => ({
    id: entry.entry.id,
    year: entry.entry.year,
    entryDate: entry.entry.entryDate,
    eligibilityYears: entry.entry.eligibilityYears,
    isGradTransfer: entry.entry.isGradTransfer,
    transferStatus: entry.entry.transferStatus,
    classYear: {
      name: entry.classYear.name,
      abbreviation: entry.classYear.abbreviation,
    },
    player: {
      id: entry.player.id,
      firstName: entry.player.firstName,
      lastName: entry.player.lastName,
      height: entry.player.height,
      weight: entry.player.weight,
      highSchool: entry.player.highSchool,
      hometown: entry.player.hometown,
      state: entry.player.state,
      playerImage: entry.player.playerImage,
      instagramHandle: entry.player.instagramHandle,
      twitterHandle: entry.player.twitterHandle,
      position: {
        name: entry.position.name,
        abbreviation: entry.position.abbreviation,
      },
    },
    previousSchool: entry.previousSchool ? schoolsData[entry.previousSchool.sanityId] : null,
    commitmentSchool: entry.commitmentSchool ? schoolsData[entry.commitmentSchool.sanityId] : null,
  }))
}
