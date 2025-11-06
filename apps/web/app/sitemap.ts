import type { MetadataRoute } from 'next'

import { getBaseUrl } from '@/lib/get-base-url'
import { client } from '@redshirt-sports/sanity/client'
import { querySitemapData } from '@redshirt-sports/sanity/queries'

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { authors } = await client.fetch(querySitemapData)

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/college/news`,
      lastModified: new Date(),
    },
    ...authors.map((author) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
    })),
  ]
}
