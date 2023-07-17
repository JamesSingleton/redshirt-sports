import { getSitemap } from '@lib/sanity.client'
import { baseUrl } from '@lib/constants'

import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, authors, divisions, conferences } = await getSitemap()

  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post._updatedAt,
  }))

  const authorRoutes = authors.map((author) => ({
    url: `${baseUrl}/authors/${author.slug}`,
    lastModified: author._updatedAt,
  }))

  const divisionRoutes = divisions.map((division) => ({
    url: `${baseUrl}/news/${division.slug}`,
    lastModified: division._updatedAt,
  }))

  const conferenceRoutes = conferences.map((conference) => ({
    url: `${baseUrl}/news/${conference.divisionSlug}/${conference.slug}`,
    lastModified: conference._updatedAt,
  }))

  const routes = ['', '/about', '/contact', '/privacy', '/news'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }))

  return [...routes, ...divisionRoutes, ...conferenceRoutes, ...postRoutes, ...authorRoutes]
}
