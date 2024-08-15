import { HOME_DOMAIN } from '@/lib/constants'
import { getYearsWithVotes } from '@/server/queries'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export function generateSitemaps() {
  return [{ id: 0 }]
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const yearsWithVotes = await getYearsWithVotes()
  return yearsWithVotes.map(({ year, week, division }) => ({
    url: `${HOME_DOMAIN}/college-football/rankings/${division}/${year}/${week}`,
    lastModified: new Date(),
    priority: 0.7,
  }))
}
