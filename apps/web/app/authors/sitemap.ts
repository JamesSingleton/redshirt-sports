import { HOME_DOMAIN } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'

import type { MetadataRoute } from 'next'
import type { Author } from '@/lib/sanity/sanity.types'

export const dynamic = 'force-dynamic'

async function fetchAuthorsSitemapData() {
  return await sanityFetch({
    query: `*[_type == 'author' && defined(slug.current) && archived == false]{
      _id,
      _updatedAt,
      "slug": slug.current
    }`,
  })
}

export async function generateSitemaps() {
  const { data: authors } = await fetchAuthorsSitemapData()

  const sitemaps = []
  for (let i = 0; i < Math.ceil(authors.length / 50000); i++) {
    sitemaps.push({
      id: i,
    })
  }

  return sitemaps
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data: authors } = await fetchAuthorsSitemapData()

  return authors.map((author: Author) => ({
    url: `${HOME_DOMAIN}/authors/${author.slug}`,
    lastModified: author._updatedAt,
    priority: 0.5,
    changeFrequency: 'weekly',
  }))
}
