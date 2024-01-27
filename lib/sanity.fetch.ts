import 'server-only'

import { client } from '@lib/sanity.client'
import {
  allAuthors,
  authorBySlug,
  authorsPosts,
  conferenceBySlugQuery,
  conferencesAuthorHasWrittenFor,
  divisionBySlugQuery,
  divisionsQuery,
  paginatedPostsQuery,
  postPaths,
  postsBySlugQuery,
  privacyPolicy,
  searchQuery,
  transferPortalPlayers,
  heroPostsQuery,
  latestArticlesForHomePageQuery,
  latestDivisionArticlesQuery,
  divisionPaths,
  conferencePaths,
} from '@lib/sanity.queries'

import type { QueryParams } from '@sanity/client'
import {
  Author,
  AuthorPosts,
  ConferencePayload,
  DivisionPayload,
  Division,
  Post,
  PostPayload,
  PostsWithPaginationPayload,
  PrivacyPolicyPagePayload,
  SitemapPayload,
  SiteMapPost,
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
  return client.fetch(query, params, {
    cache: 'force-cache',
    next: {
      tags,
    },
  }) as QueryResponse
}

export function getHeroPosts() {
  return sanityFetch<Post[]>({
    query: heroPostsQuery,
    tags: ['post'],
  })
}

export function getLatestArticlesForHomePage() {
  return sanityFetch<Post[]>({
    query: latestArticlesForHomePageQuery,
    tags: ['post'],
  })
}

export function getLatestDivisionArticlesForHomePage(division: string, ids: string[]) {
  return sanityFetch<Post[]>({
    query: latestDivisionArticlesQuery,
    params: { division, ids },
    tags: [`division:${division}`, 'post'],
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

export function getDivisionPaths() {
  return client.fetch<string[]>(divisionPaths, {}, { token, perspective: 'published' })
}

export function getConferencePaths() {
  return client.fetch<{ slug: string; divisionSlug: string }[]>(
    conferencePaths,
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

export function getNews(pageIndex: number) {
  return sanityFetch<PostsWithPaginationPayload>({
    query: paginatedPostsQuery,
    params: { pageIndex },
    tags: ['post'],
  })
}

export function getNewsByDivision(slug: string, pageIndex: number) {
  return sanityFetch<DivisionPayload>({
    query: divisionBySlugQuery,
    params: { slug, pageIndex },
    tags: [`division:${slug}`],
  })
}

export function getNewsByConference(slug: string, pageIndex: number) {
  return sanityFetch<ConferencePayload>({
    query: conferenceBySlugQuery,
    params: { slug, pageIndex },
    tags: [`conference:${slug}`],
  })
}

export function getAuthorBySlug(slug: string) {
  return sanityFetch<Author>({
    query: authorBySlug,
    params: { slug },
    tags: [`author:${slug}`],
  })
}

export function getConferencesAuthorHasWrittenFor(authorId: string) {
  return sanityFetch<any>({
    query: conferencesAuthorHasWrittenFor,
    params: { authorId },
    tags: [`author:${authorId}`],
  })
}

export function getAuthorsPosts(authorId: string, pageIndex: number, conference: string) {
  return sanityFetch<AuthorPosts>({
    query: authorsPosts,
    params: { authorId, pageIndex, conference },
    tags: [`author:${authorId}`],
  })
}

export function getSearchResults(query: string, pageIndex: number) {
  return sanityFetch<any>({
    query: searchQuery,
    params: { query, pageIndex },
    tags: ['post'],
  })
}

export function getTransferPortalPlayers() {
  return sanityFetch<any>({
    query: transferPortalPlayers,
    tags: ['transferPortalPlayers'],
  })
}
