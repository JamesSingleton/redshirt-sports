import { postsForSitemapQuery, countOfPostsQuery } from '@redshirt-sports/sanity/queries'
import { client } from '@redshirt-sports/sanity/client'
import { getBaseUrl } from '@/lib/get-base-url'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

const baseUrl = getBaseUrl()
const urlsPerSitemap = 50000

export async function generateSitemaps() {
  const count = await client.fetch(countOfPostsQuery)
  const totalPages = Math.ceil(count / urlsPerSitemap)
  return Array.from({ length: totalPages }, (_, id) => ({ id }))
}

export default async function sitemap(props: {
  id: Promise<number>
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id
  // Google's limit is 50,000 URLs per sitemap
  const start = id * urlsPerSitemap
  const end = start + urlsPerSitemap

  const posts = await client.fetch(postsForSitemapQuery, {
    start,
    end,
  })

  return posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post._updatedAt,
  }))
}
