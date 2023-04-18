import 'server-only'

import { createClient } from 'next-sanity'

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
  categoryBySlugQuery,
  authors,
  postsForRssFeed,
  subCategorySlugQuery,
  parentCategorySlugQuery,
} from '@lib/sanity.queries'
import { AboutPagePayload, PrivacyPolicyPagePayload, PostPayload, Author } from '@types'

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
}): Promise<AboutPagePayload | undefined> {
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

export async function getCategoryBySlug({
  slug,
  pageIndex,
  token,
}: {
  slug: string
  pageIndex: number
  token?: string
}): Promise<any> {
  return await sanityClient(token)?.fetch(categoryBySlugQuery, { slug, pageIndex })
}

export async function getAuthorsBySlug({
  slug,
  pageIndex,
  token,
}: {
  slug: string
  pageIndex: number
  token?: string
}): Promise<Author> {
  return await sanityClient(token)?.fetch(authors, {
    slug,
    pageIndex,
  })
}

export async function getPostsForRssFeed({ token }: { token: string }): Promise<any> {
  return await sanityClient(token)?.fetch(postsForRssFeed)
}

export async function getSubcategorySlugs(): Promise<any> {
  return await sanityClient()?.fetch(subCategorySlugQuery)
}

export async function getParentCategorySlugs(): Promise<any> {
  return await sanityClient()?.fetch(parentCategorySlugQuery)
}
