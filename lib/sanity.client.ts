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
  postInfoForSitemap,
  postSlugsQuery,
  subcategoryBySlugQuery,
  categoriesQuery,
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

export async function getCategoryBySlug({
  slug,
  pageIndex,
}: {
  slug: string
  pageIndex: number
}): Promise<any> {
  return await sanityClient()?.fetch(categoryBySlugQuery, { slug, pageIndex })
}

export async function getSubcategoryBySlug({
  slug,
  pageIndex,
}: {
  slug: string
  pageIndex: number
}): Promise<any> {
  return await sanityClient()?.fetch(subcategoryBySlugQuery, { slug, pageIndex })
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

export async function getPostsForSitemap(): Promise<any> {
  return await sanityClient()?.fetch(postInfoForSitemap)
}

export async function getPostSlugs(): Promise<any> {
  return await sanityClient()?.fetch(postSlugsQuery)
}

export async function getCategories(): Promise<any> {
  return await sanityClient()?.fetch(categoriesQuery)
}
