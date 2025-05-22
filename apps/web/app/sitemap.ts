import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@/lib/get-base-url'
import { client } from '@/lib/sanity/client'
import { querySitemapData } from '@/lib/sanity/query'
import { getYearsWithVotes } from '@/server/queries'

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, authors, sports } = await client.fetch(querySitemapData)
  const yearsWithVotes = await getYearsWithVotes()

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    ...posts.map((post: any) => ({
      url: `${baseUrl}/${post.slug}`,
      lastModified: new Date(post.lastModified),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...authors.map((author: any) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...sports.map((sport: any) => {
      const sportSlug = sport.slug.replace('college-', '')
      return {
        url: `${baseUrl}/college/${sportSlug}/news`,
        lastModified: new Date(sport.lastModified),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    }),
    ...yearsWithVotes.map(({ year, week, division }) => {
      // if week is 999 it should be `final-rankings`
      const weekString = week === 999 ? 'final-rankings' : week
      return {
        url: `${baseUrl}/college/football/rankings/${division}/${year}/${weekString}`,
        lastModified: new Date(),
        priority: 0.7,
      }
    }),
  ]
}
