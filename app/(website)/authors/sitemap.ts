import { HOME_DOMAIN } from '@/lib/constants'
import { getAuthorsForSitemap } from '@/lib/sanity.fetch'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export async function generateSitemaps() {
  const authors = await getAuthorsForSitemap()

  const sitemaps = []
  for (let i = 0; i < Math.ceil(authors.length / 50000); i++) {
    sitemaps.push({
      id: i,
    })
  }

  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const start = id * 50000
  const end = start + 50000

  const authors = await getAuthorsForSitemap()

  return authors.map((author) => ({
    url: `${HOME_DOMAIN}/authors/${author.slug}`,
    lastModified: author._updatedAt,
    priority: 0.5,
    changeFrequency: 'weekly',
  }))
}
