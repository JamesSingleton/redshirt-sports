import { eq } from 'drizzle-orm'

import { sportsTable } from '../schema'
import { primaryDb as db } from '../client'

export type SportParam = 'football' | 'mens-basketball' | 'womens-basketball'

export async function getSports() {
  return db.query.sportsTable.findMany()
}

export async function getSportIdBySlug(slug: SportParam): Promise<string | null> {
  const result = await db
    .select({ id: sportsTable.id })
    .from(sportsTable)
    .where(eq(sportsTable.slug, slug))
    .limit(1)

  return result[0]?.id || null
}
