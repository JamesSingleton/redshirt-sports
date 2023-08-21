import 'server-only'

import { draftMode } from 'next/headers'

import { client } from '@lib/sanity.client'
import { revalidateSecret } from '@lib/sanity.api'
import {
  allAuthors,
  authorBySlug,
  authorsPosts,
  conferenceBySlugQuery,
  conferencesAuthorHasWrittenFor,
  divisionBySlugQuery,
  divisionsQuery,
  homePageQuery,
  paginatedPostsQuery,
  postPaths,
  postsBySlugQuery,
  postsForRssFeed,
  privacyPolicy,
  searchQuery,
  sitemapQuery,
  transferPortalPlayers,
} from '@lib/sanity.queries'

import type { QueryParams } from '@sanity/client'
import {
  Author,
  AuthorPosts,
  ConferencePayload,
  DivisionPayload,
  Divisions,
  HomePagePayload,
  PostPayload,
  PostsWithPaginationPayload,
  PrivacyPolicyPagePayload,
  SitemapPayload,
} from '@types'

export const token = process.env.SANITY_API_READ_TOKEN

const DEFAULT_PARAMS = {} as QueryParams
const DEFAULT_TAGS = [] as string[]

export async function sanityFetch<QueryResponse>({
  query,
  params = DEFAULT_PARAMS,
  tags = DEFAULT_TAGS,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<QueryResponse> {
  const isDraftMode = draftMode().isEnabled

  if (isDraftMode && !token) {
    throw new Error(
      'The `SANITY_API_READ_TOKEN` environment variable is required to fetch data from Sanity in draft mode.',
    )
  }

  // @TODO this won't be necessary after https://github.com/sanity-io/client/pull/299 lands
  const sanityClient =
    client.config().useCdn && isDraftMode ? client.withConfig({ useCdn: false }) : client
  return sanityClient.fetch<QueryResponse>(query, params, {
    // We only cache if there's a revalidation webhook setup
    cache: revalidateSecret ? 'force-cache' : 'no-store',
    ...(isDraftMode && {
      cache: undefined,
      token: token,
      perspective: 'previewDrafts',
    }),
    next: {
      ...(isDraftMode && { revalidate: 30 }),
      tags,
    },
  })
}

export function getHomePage() {
  return sanityFetch<HomePagePayload>({
    query: homePageQuery,
    tags: ['home'],
  })
}

export function getPostBySlug(slug: string) {
  return sanityFetch<PostPayload | null>({
    query: postsBySlugQuery,
    params: { slug },
    tags: [`post:${slug}`],
  })
}

export function getPostsPaths() {
  return client.fetch<string[]>(postPaths, {}, { token, perspective: 'published' })
}

export function getDivisions() {
  return sanityFetch<Divisions[]>({
    query: divisionsQuery,
    tags: ['divisions'],
  })
}

export function getAuthors() {
  return sanityFetch<Author[]>({
    query: allAuthors,
    tags: ['authors'],
  })
}

export function getPrivacyPolicy() {
  return sanityFetch<PrivacyPolicyPagePayload>({
    query: privacyPolicy,
    tags: ['privacyPolicy'],
  })
}

export function getNews(pageIndex: number) {
  return sanityFetch<PostsWithPaginationPayload>({
    query: paginatedPostsQuery,
    params: { pageIndex },
    tags: ['news'],
  })
}

export function getNewsByDivision(slug: string, pageIndex: number) {
  return sanityFetch<DivisionPayload>({
    query: divisionBySlugQuery,
    params: { slug, pageIndex },
    tags: ['news', `division:${slug}`],
  })
}

export function getNewsByConference(slug: string, pageIndex: number) {
  return sanityFetch<ConferencePayload>({
    query: conferenceBySlugQuery,
    params: { slug, pageIndex },
    tags: ['news', `conference:${slug}`],
  })
}

export function getAuthorBySlug(slug: string) {
  return sanityFetch<Author | null>({
    query: authorBySlug,
    params: { slug },
    tags: [`author:${slug}`],
  })
}

export function getConferencesAuthorHasWrittenFor(authorId: string) {
  return sanityFetch<any>({
    query: conferencesAuthorHasWrittenFor,
    params: { authorId },
    tags: [`conferencesAuthorHasWrittenFor:${authorId}`],
  })
}

export function getAuthorsPosts(authorId: string, pageIndex: number, conference: string) {
  return sanityFetch<AuthorPosts>({
    query: authorsPosts,
    params: { authorId, pageIndex, conference },
    tags: [`authorsPosts:${authorId}`],
  })
}

export function getSitemap() {
  return sanityFetch<SitemapPayload>({
    query: sitemapQuery,
    tags: ['sitemap'],
  })
}

export function getSearchResults(query: string, pageIndex: number) {
  return sanityFetch<any>({
    query: searchQuery,
    params: { query, pageIndex },
    tags: ['search', 'post'],
  })
}

export function getTransferPortalPlayers() {
  return sanityFetch<any>({
    query: transferPortalPlayers,
    tags: ['transferPortalPlayers'],
  })
}

export function getRSSFeed() {
  return sanityFetch<any>({
    query: postsForRssFeed,
    tags: ['rss'],
  })
}
