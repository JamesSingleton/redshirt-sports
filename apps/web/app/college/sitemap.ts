import { client } from '@redshirt-sports/sanity/client'
import { queryForCollegeSitemap } from '@redshirt-sports/sanity/queries'
import { getBaseUrl } from '@/lib/get-base-url'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

const baseUrl = getBaseUrl()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await client.fetch(queryForCollegeSitemap)
  const urls = new Map<string, string>()

  posts.forEach((post) => {
    if (post.sport) {
      // /college/[sport]/news
      const url1 = `${baseUrl}/college/${post.sport}/news`
      const currentTimestamp1 = urls.get(url1)
      if (!currentTimestamp1 || new Date(post._updatedAt) > new Date(currentTimestamp1)) {
        urls.set(url1, post._updatedAt)
      }

      const divisionLower = post.division?.toLowerCase()

      // Check for Division I/D1 and require sportSubgrouping
      const isD1 = post.division && (divisionLower === 'division-i' || divisionLower === 'd1')

      let divisionSegment = post.division
      if (isD1) {
        if (post.sportSubgrouping) {
          divisionSegment = post.sportSubgrouping
        } else {
          // Skip this post for division-level and conference-level URLs
          return
        }
      }

      if (divisionSegment) {
        // /college/[sport]/news/[division or sportSubgrouping]
        const url2 = `${baseUrl}/college/${post.sport}/news/${divisionSegment}`
        const currentTimestamp2 = urls.get(url2)
        if (!currentTimestamp2 || new Date(post._updatedAt) > new Date(currentTimestamp2)) {
          urls.set(url2, post._updatedAt)
        }
        if (post.conferences && post.conferences.length > 0) {
          post.conferences.forEach((conference) => {
            if (conference) {
              // /college/[sport]/news/[division or sportSubgrouping]/[conference]
              const url3 = `${baseUrl}/college/${post.sport}/news/${divisionSegment}/${conference}`
              const currentTimestamp3 = urls.get(url3)
              if (!currentTimestamp3 || new Date(post._updatedAt) > new Date(currentTimestamp3)) {
                urls.set(url3, post._updatedAt)
              }
            }
          })
        }
      }
    }
  })

  return Array.from(urls.entries()).map(([url, lastModified]) => ({
    url,
    lastModified: new Date(lastModified),
  }))
}
