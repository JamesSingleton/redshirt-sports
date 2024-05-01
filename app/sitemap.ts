import { sanityFetch } from '@lib/sanity.fetch'
import { BASE_URL } from '@lib/constants'

import type { MetadataRoute } from 'next'
import { ConferencePayload, Division } from '@types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const divisionRoutes = divisions.map((division) => ({
    url: `${BASE_URL}/news/${division.slug}`,
    lastModified: division._updatedAt,
    priority: 0.8,
  }))

  const conferenceRoutes = conferences.map((conference) => ({
    url: `${BASE_URL}/news/${conference.divisionSlug}/${conference.slug}`,
    lastModified: conference._updatedAt,
    priority: 0.8,
  }))

  const routes = [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
  ]

  return [...routes, ...divisionRoutes, ...conferenceRoutes]
}
