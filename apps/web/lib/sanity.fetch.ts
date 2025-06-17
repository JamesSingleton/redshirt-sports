import 'server-only'

import { client } from '@/lib/sanity/client'
import {
  allAuthors,
  divisionsQuery,
  privacyPolicy,
  schoolsByDivision,
  schoolsByIdOrderedByRank,
  authorsForSiteMapQuery,
} from '@/lib/sanity.queries'

import type { QueryParams } from '@sanity/client'
import {
  Author,
  ConferencePayload,
  Division,
  Post,
  PrivacyPolicyPagePayload,
  SchoolLite,
  SitemapContent,
} from '@/types'

export const token = process.env.SANITY_API_READ_TOKEN

export async function sanityFetch<QueryResponse>({
  query,
  params = {},
  tags,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<QueryResponse> {
  return client.fetch(query, params, {
    next: {
      tags,
    },
  })
}

export function getPostsForSitemap() {
  return client.fetch<SitemapContent[]>(
    `*[_type == 'post' && defined(slug.current)] | order(publishedAt desc){
      _id,
      _updatedAt,
      publishedAt,
      "slug": slug.current,
    }`,
    {},
    { token, perspective: 'published', cache: 'no-store' },
  )
}

export function getPostsForNewsSitemap() {
  return client.fetch<SitemapContent[]>(
    `*[_type == 'post' && defined(slug.current) && dateTime(publishedAt) > dateTime(now()) - $lasts2DaysInSeconds] | order(publishedAt desc){
      _id,
      _updatedAt,
      publishedAt,
      "slug": slug.current,
      title
    }`,
    {
      lasts2DaysInSeconds: 60 * 60 * 24 * 2,
    },
    { token, perspective: 'published', cache: 'no-store' },
  )
}

export function getAuthorsForSitemap() {
  return client.fetch<SitemapContent[]>(
    authorsForSiteMapQuery,
    {},
    { token, perspective: 'published' },
  )
}

export function getDivisions() {
  return sanityFetch<Division[]>({
    query: divisionsQuery,
    tags: ['division'],
  })
}

export function getAuthors() {
  return sanityFetch<Author[]>({
    query: allAuthors,
    tags: ['author'],
  })
}

export function getPrivacyPolicy() {
  return sanityFetch<PrivacyPolicyPagePayload>({
    query: privacyPolicy,
    tags: ['legal'],
  })
}

export function getConferenceInfoBySlug(slug: string) {
  return sanityFetch<ConferencePayload>({
    query: `*[_type == "conference" && slug.current == $slug][0]{
    name,
    shortName
    }`,
    params: { slug },
    tags: [`conference:${slug}`],
  })
}

export function getSchoolsByDivision(division: string) {
  return sanityFetch<any>({
    query: schoolsByDivision,
    params: { division },
    tags: [`division:${division}`],
  })
}

export function getSchoolsById(
  ids: {
    id: string
    rank: number
  }[],
) {
  return client.fetch<SchoolLite[]>(
    schoolsByIdOrderedByRank,
    {
      ids,
    },
    { token, perspective: 'published' },
  )
}

export function getRSSFeed() {
  return client.fetch<Post[]>(
    `*[_type == 'post' && defined(slug.current)] | order(publishedAt desc) {
      _id,
      _updatedAt,
      title,
      publishedAt,
      "slug": slug.current,
      mainImage,
      excerpt,
      body,
      "author": author->{name, "slug": slug.current},
      "authors": authors[]->{name, "slug": slug.current},
      division->{
        name,
        "slug": slug.current,
      },
    }`,
    {},
    { token, perspective: 'published', cache: 'no-store' },
  )
}
