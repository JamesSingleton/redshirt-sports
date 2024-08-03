import { sanityFetch } from '@/lib/sanity.fetch'
import { HOME_DOMAIN } from '@/lib/constants'

import type { MetadataRoute } from 'next'
import { ConferencePayload, Division } from '@/types'

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
    url: `${HOME_DOMAIN}/news/${division.slug}`,
    lastModified: division._updatedAt,
    priority: 0.8,
  }))

  const conferenceRoutes = conferences.map((conference) => ({
    url: `${HOME_DOMAIN}/news/${conference.divisionSlug}/${conference.slug}`,
    lastModified: conference._updatedAt,
    priority: 0.8,
  }))

  const routes = [
    {
      url: HOME_DOMAIN,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
    {
      url: `${HOME_DOMAIN}/about`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${HOME_DOMAIN}/contact`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${HOME_DOMAIN}/privacy`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly',
    },
    {
      url: `${HOME_DOMAIN}/news`,
      lastModified: new Date().toISOString(),
      priority: 1,
      changeFrequency: 'weekly',
    },
  ]

  return [...routes, ...divisionRoutes, ...conferenceRoutes]
}
