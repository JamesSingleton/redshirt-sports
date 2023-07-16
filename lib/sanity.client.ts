import { createClient, type SanityClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '@lib/sanity.api'
import {
  allAuthors,
  privacyPolicy,
  postsBySlugQuery,
  morePostsBySlugQuery,
  heroArticleQuery,
  recentArticlesQuery,
  featuredArticlesQuery,
  otherArticlesQuery,
  authors,
  postsForRssFeed,
  subCategorySlugQuery,
  parentCategorySlugQuery,
  postSlugsQuery,
  conferenceBySlugQuery,
  categoriesQuery,
  sitemapQuery,
  transferPortalPlayers,
  latestDivisionArticlesQuery,
  conferencesAuthorHasWrittenFor,
  authorsPosts,
  authorSlugsQuery,
  divisionsQuery,
  divisionBySlugQuery,
} from '@lib/sanity.queries'
import { DivisionPayload, PrivacyPolicyPagePayload, PostPayload, Author, AuthorPosts } from '@types'

export function getClient(preview?: { token: string }): SanityClient {
  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn,
  })

  if (preview) {
    if (!preview.token) {
      throw new Error('You must provide a token to preview drafts')
    }

    return client.withConfig({
      token: preview.token,
      useCdn: false,
      ignoreBrowserTokenWarning: true,
    })
  }

  return client
}

const sanityClient = (token?: string) => {
  return createClient({ projectId, dataset, apiVersion, token, useCdn })
}

export async function getHeroPost({ token }: { token?: string }): Promise<PostPayload | undefined> {
  return await sanityClient(token)?.fetch(heroArticleQuery)
}

export async function getRecentArticles({
  token,
}: {
  token?: string
}): Promise<PostPayload[] | undefined> {
  return await sanityClient(token)?.fetch(recentArticlesQuery)
}

export async function getFeaturedArticles({
  token,
}: {
  token?: string
}): Promise<PostPayload[] | undefined> {
  return await sanityClient(token)?.fetch(featuredArticlesQuery)
}

export async function getOtherArticles({
  token,
}: {
  token?: string
}): Promise<PostPayload[] | undefined> {
  return await sanityClient(token)?.fetch(otherArticlesQuery)
}

export async function getAboutPageAuthors({
  token,
}: {
  token?: string
}): Promise<Author[] | undefined> {
  return await sanityClient(token)?.fetch(allAuthors)
}

export async function getPrivacyPolicyPage({
  token,
}: {
  token?: string
}): Promise<PrivacyPolicyPagePayload | undefined> {
  return await sanityClient(token)?.fetch(privacyPolicy)
}

export async function getPostBySlug({
  slug,
  token,
}: {
  slug: string
  token?: string
}): Promise<PostPayload> {
  return await sanityClient(token)?.fetch(postsBySlugQuery, { slug })
}

export async function getMorePostsBySlug({
  slug,
  token,
}: {
  slug: string
  token?: string
}): Promise<PostPayload[] | undefined> {
  return await sanityClient(token)?.fetch(morePostsBySlugQuery, { slug })
}

export async function getDivisionBySlug({
  slug,
  pageIndex,
}: {
  slug: string
  pageIndex: number
}): Promise<DivisionPayload> {
  return await sanityClient()?.fetch(divisionBySlugQuery, { slug, pageIndex })
}

export async function getConferenceBySlug({
  slug,
  pageIndex,
}: {
  slug: string
  pageIndex: number
}): Promise<any> {
  return await sanityClient()?.fetch(conferenceBySlugQuery, { slug, pageIndex })
}

export async function getAuthorsBySlug({
  slug,
  token,
}: {
  slug: string
  token?: string
}): Promise<Author> {
  return await sanityClient(token)?.fetch(authors, {
    slug,
  })
}

export async function getAuthorsPosts({
  authorId,
  pageIndex,
  conference,
}: {
  authorId: string
  pageIndex: number
  conference: string
}): Promise<AuthorPosts> {
  return await sanityClient().fetch(authorsPosts, {
    authorId,
    pageIndex,
    conference,
  })
}

export async function getPostsForRssFeed(): Promise<any> {
  return await sanityClient()?.fetch(postsForRssFeed)
}

export async function getSubcategorySlugs(): Promise<any> {
  return await sanityClient()?.fetch(subCategorySlugQuery)
}

export async function getParentCategorySlugs(): Promise<any> {
  return await sanityClient()?.fetch(parentCategorySlugQuery)
}

export async function getPostSlugs(): Promise<string[]> {
  return await sanityClient()?.fetch(postSlugsQuery)
}

export async function getAuthorSlugs(): Promise<string[]> {
  return await sanityClient().fetch(authorSlugsQuery)
}

export async function getCategories(): Promise<any> {
  return await sanityClient()?.fetch(categoriesQuery)
}

export async function getSitemap(): Promise<any> {
  return await sanityClient()?.fetch(sitemapQuery)
}

export async function getTransferPortalPlayers(): Promise<any> {
  return await sanityClient()?.fetch(transferPortalPlayers)
}

export async function getLatestDivisionArticles({ division }: { division: string }): Promise<any> {
  return await sanityClient()?.fetch(latestDivisionArticlesQuery, { division })
}

export async function getConferencesAuthorHasWrittenFor({
  authorId,
}: {
  authorId: string
}): Promise<any> {
  return await sanityClient().fetch(conferencesAuthorHasWrittenFor, { authorId })
}

export async function getDivisions(): Promise<any> {
  return await sanityClient()?.fetch(divisionsQuery)
}
