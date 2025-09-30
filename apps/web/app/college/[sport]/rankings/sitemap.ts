import { getBaseUrl } from '@/lib/get-base-url'
import { getYearsWithVotes } from '@redshirt-sports/db/queries'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export function generateSitemaps() {
  return [{ id: 0 }]
}

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const yearsWithVotes = await getYearsWithVotes()
  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${baseUrl}/college/football/rankings/${division}/${year}/${week === 999 ? 'final-rankings' : week}`,
    lastModified: new Date(),
    priority: 0.7,
  }))
}
