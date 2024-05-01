import { BASE_URL } from '@lib/constants'
import { sanityFetch } from '@lib/sanity.fetch'
import { authorsForSiteMapQuery } from '@lib/sanity.queries'
import type { Author } from '@types'
import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  const authors = await sanityFetch<Author[]>({
    query: authorsForSiteMapQuery,
    tags: ['author'],
  })
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

  const authors = await sanityFetch<Author[]>({
    query: authorsForSiteMapQuery,
    tags: ['author'],
  })

  return authors.map((author) => ({
    url: `${BASE_URL}/authors/${author.slug}`,
    lastModified: author._updatedAt,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))
}
