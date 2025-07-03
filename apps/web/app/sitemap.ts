import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@/lib/get-base-url'
import { client } from '@/lib/sanity/client'
import { querySitemapData } from '@/lib/sanity/query'

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, authors, sports } = await client.fetch(querySitemapData)

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
      url: `${baseUrl}/privacy-policy`,
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
      return {
        url: `${baseUrl}/college/${sport.slug}/news`,
        lastModified: new Date(sport.lastModified),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }
    }),
  ]
}
