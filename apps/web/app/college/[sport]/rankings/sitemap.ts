import { getBaseUrl } from '@/lib/get-base-url'
import { getYearsWithVotes } from '@/server/queries'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export function generateSitemaps() {
  return [{ id: 0 }]
}

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const yearsWithVotes = await getYearsWithVotes()
  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${baseUrl}/college/football/rankings/${division}/${year}/${week}`,
    lastModified: new Date(),
    priority: 0.7,
  }))
}
