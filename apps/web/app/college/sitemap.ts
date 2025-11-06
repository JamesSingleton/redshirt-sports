import { client } from '@redshirt-sports/sanity/client'
import { getBaseUrl } from '@/lib/get-base-url'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

const baseUrl = getBaseUrl()

const POSTS_QUERY = `*[_type == "post" && defined(sport->slug.current)]{
  "sport": sport->slug.current,
  "division": division->slug.current,
  "divisionTitle": division->title,
  "sportSubgrouping": sportSubgrouping->slug.current,
  "conferences": conferences[]->slug.current,
  _updatedAt
}`

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await client.fetch(POSTS_QUERY)
  const urls = new Map()

  posts.forEach((post) => {
    if (post.sport) {
      // /college/[sport]/news
      const url1 = `${baseUrl}/college/${post.sport}/news`
      urls.set(url1, post._updatedAt)

      // Check for Division I/D1 and require sportSubgrouping
      const isD1 =
        post.division &&
        (post.division.toLowerCase() === 'division-i' || post.division.toLowerCase() === 'd1')

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
        urls.set(url2, post._updatedAt)
        if (post.conferences && post.conferences.length > 0) {
          post.conferences.forEach((conference) => {
            if (conference) {
              // /college/[sport]/news/[division or sportSubgrouping]/[conference]
              const url3 = `${baseUrl}/college/${post.sport}/news/${divisionSegment}/${conference}`
              urls.set(url3, post._updatedAt)
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
