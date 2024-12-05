'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/server/db'
import {
  players,
  transferPortalEntries,
  schoolReferences,
  positions,
  classYears,
} from '@/server/db/schema'

export async function addPlayer(formData: FormData) {
  // Extract all form data
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const height = parseInt(formData.get('height') as string)
  const weight = parseInt(formData.get('weight') as string)
  const highSchool = formData.get('highSchool') as string
  const hometown = formData.get('hometown') as string
  const state = formData.get('state') as string
  const playerImage = formData.get('playerImage') as string
  const instagramHandle = formData.get('instagramHandle') as string
  const twitterHandle = formData.get('twitterHandle') as string
  const positionId = parseInt(formData.get('positionId') as string)
  const currentSchoolId = formData.get('currentSchoolId') as string
  const year = parseInt(formData.get('year') as string)
  const entryDate = new Date(formData.get('entryDate') as string)
  const eligibilityYears = parseInt(formData.get('eligibilityYears') as string)
  const transferStatus = formData.get('transferStatus') as string
  const classYearId = parseInt(formData.get('classYearId') as string)
  const isGradTransfer = formData.get('isGradTransfer') === 'true'
  const previousSchoolId = formData.get('previousSchoolId') as string
  const commitmentSchoolId = formData.get('commitmentSchoolId') as string
  const commitmentDate = formData.get('commitmentDate')
    ? new Date(formData.get('commitmentDate') as string)
    : null

  try {
    await db.transaction(async (tx) => {
      // Insert or get schoolReference for current school
      const [currentSchoolRef] = await tx
        .insert(schoolReferences)
        .values({ sanityId: currentSchoolId })
        .onConflictDoUpdate({
          target: schoolReferences.sanityId,
          set: { sanityId: currentSchoolId },
        })
        .returning()

      // Insert or get schoolReference for previous school
      const [previousSchoolRef] = await tx
        .insert(schoolReferences)
        .values({ sanityId: previousSchoolId })
        .onConflictDoUpdate({
          target: schoolReferences.sanityId,
          set: { sanityId: previousSchoolId },
        })
        .returning()

      // Insert player
      const [newPlayer] = await tx
        .insert(players)
        .values({
          firstName,
          lastName,
          height,
          weight,
          highSchool,
          hometown,
          state,
          playerImage,
          instagramHandle,
          twitterHandle,
          positionId,
          currentSchoolId: currentSchoolRef.id,
        })
        .returning()

      // Insert transfer portal entry
      await tx.insert(transferPortalEntries).values({
        playerId: newPlayer.id,
        year,
        entryDate,
        eligibilityYears,
        transferStatus,
        classYearId,
        isGradTransfer,
        previousSchoolId: previousSchoolRef.id,
        commitmentSchoolId: commitmentSchoolId
          ? (
              await tx
                .insert(schoolReferences)
                .values({ sanityId: commitmentSchoolId })
                .onConflictDoUpdate({
                  target: schoolReferences.sanityId,
                  set: { sanityId: commitmentSchoolId },
                })
                .returning()
            )[0].id
          : null,
        commitmentDate,
      })
    })

    revalidatePath('/players')
    return { success: true, message: 'Player added successfully to the transfer portal.' }
  } catch (error) {
    console.error('Failed to add player:', error)
    return { success: false, message: 'Failed to add player. Please try again.' }
  }
}

export async function getPositions() {
  try {
    const positionsList = await db.select().from(positions)
    return { success: true, data: positionsList }
  } catch (error) {
    console.error('Failed to fetch positions:', error)
    return { success: false, message: 'Failed to fetch positions. Please try again.' }
  }
}

export async function getClassYears() {
  try {
    const classYearsList = await db.select().from(classYears)
    return { success: true, data: classYearsList }
  } catch (error) {
    console.error('Failed to fetch class years:', error)
    return { success: false, message: 'Failed to fetch class years. Please try again.' }
  }
}
