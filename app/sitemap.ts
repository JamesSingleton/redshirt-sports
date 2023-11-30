import { sanityFetch } from '@lib/sanity.fetch'
import { baseUrl } from '@lib/constants'
import { authorsForSiteMapQuery } from '@lib/sanity.queries'

import type { MetadataRoute } from 'next'
import { Author, Conference, ConferencePayload, Division, SiteMapPost } from '@types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await sanityFetch<SiteMapPost[]>({
    query: `*[_type == 'post' && defined(slug.current)]{
      _updatedAt,
      "slug": slug.current,
    }`,
    tags: ['post'],
  })
  const authors = await sanityFetch<Author[]>({
    query: authorsForSiteMapQuery,
    tags: ['author'],
  })

  const divisions = await sanityFetch<Division[]>({
    query: `*[_type == "division" && defined(slug.current) && count(*[_type == 'post' && references(^._id)]) > 0]{
      _id,
      _updatedAt,
      "slug": slug.current
    }`,
    tags: ['division'],
  })

  const conferences = await sanityFetch<ConferencePayload[]>({
    query: `*[_type == "conference" && defined(slug.current) && defined(division) && count(*[_type == 'post' && references(^._id)]) > 0]{
      _id,
      _updatedAt,
      "slug": slug.current,
      "divisionSlug": division->slug.current,
    }`,
    tags: ['conference'],
  })

  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post._updatedAt,
    priority: 0.7,
  }))

  const authorRoutes = authors.map((author) => ({
    url: `${baseUrl}/authors/${author.slug}`,
    lastModified: author._updatedAt,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const divisionRoutes = divisions.map((division) => ({
    url: `${baseUrl}/news/${division.slug}`,
    lastModified: division._updatedAt,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const conferenceRoutes = conferences.map((conference) => ({
    url: `${baseUrl}/news/${conference.divisionSlug}/${conference.slug}`,
    lastModified: conference._updatedAt,
    priority: 0.8,
    changeFrequency: 'weekly',
  }))

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
  ]

  return [...routes, ...divisionRoutes, ...conferenceRoutes, ...postRoutes, ...authorRoutes]
}
