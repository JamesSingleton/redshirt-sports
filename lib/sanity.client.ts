import 'server-only'

import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '@lib/sanity.api'
import {
  postBySlugQuery,
  postSlugsQuery,
  settingsQuery,
  homePageQuery,
  postAndMoreStoriesQuery,
  allAuthorsQuery,
  privacyPolicyQuery,
  searchQuery,
  fcsPostsQuery,
  postMetaDataInfoBySlugQuery,
  authorMetaDataInfoBySlugQuery,
  authorSlugsQuery,
  authorAndPostsQuery,
  totalPostsQuery,
} from './sanity.queries'

import type { Author, Post, Settings, PrivacyPolicy, AuthorMetaDataInfo } from '@types'

const client = projectId ? createClient({ projectId, dataset, apiVersion, useCdn }) : null

export async function getSettings(): Promise<Settings> {
  if (client) {
    return (await client.fetch(settingsQuery)) || {}
  }

  return {}
}

export async function getAllPostsSlugs(): Promise<Pick<Post, 'slug'>[]> {
  if (client) {
    const slugs = (await client.fetch<string[]>(postSlugsQuery)) || []
    return slugs.map((slug) => ({ slug }))
  }
  return []
}

export async function getPostBySlug(slug: string): Promise<Post> {
  if (client) {
    return (await client.fetch(postBySlugQuery, { slug })) || ({} as any)
  }
  return {} as any
}

export async function getPostMetaDataInfoBySlug(slug: string): Promise<{
  _id: string
  title: string
  _updatedAt: string
  publishedAt: string
  slug: string
  mainImage: any
  category: string
  excerpt: string
  estimatedReadingTime: number
  author: any
}> {
  if (client) {
    return await client.fetch(postMetaDataInfoBySlugQuery, { slug })
  }
  return {} as any
}

export async function getHomePage(): Promise<{
  mainArticle: Post
  recentArticles: Post[]
  otherArticles: Post[]
  featuredArticles: Post[]
  mostReadArticles: Post[]
}> {
  if (client) {
    return (await client.fetch(homePageQuery)) || {}
  }
  return {
    mainArticle: {} as any,
    recentArticles: [],
    otherArticles: [],
    featuredArticles: [],
    mostReadArticles: [],
  }
}

export async function getPostAndMoreStories(
  slug: string,
  token?: string | null
): Promise<{ post: Post; morePosts: Post[] }> {
  if (projectId) {
    const client = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn,
      token: token || undefined,
    })
    return await client.fetch(postAndMoreStoriesQuery, { slug })
  }
  return { post: {} as any, morePosts: [] }
}

export async function getAllAuthors(): Promise<Author[]> {
  if (client) {
    return (await client.fetch(allAuthorsQuery)) || []
  }
  return []
}

export async function getPrivacyPolicy(): Promise<PrivacyPolicy> {
  if (client) {
    return (await client.fetch(privacyPolicyQuery)) || {}
  }
  return {} as any
}

export async function getSearchResults(query: string | string[] | undefined): Promise<Post[]> {
  if (client) {
    return (await client.fetch(searchQuery, { query })) || []
  }
  return []
}

export async function getFCSPosts(
  pageIndex: number
): Promise<{ posts: Post[]; totalPosts: number }> {
  if (client) {
    return await client.fetch(fcsPostsQuery, { pageIndex })
  }
  return { posts: [], totalPosts: 0 }
}

export async function getAllAuthorsSlugs(): Promise<Pick<Author, 'slug'>[]> {
  if (client) {
    const slugs = (await client.fetch<string[]>(authorSlugsQuery)) || []
    return slugs.map((slug) => ({ slug }))
  }
  return []
}

export async function getAuthorBySlug(slug: string): Promise<Author> {
  if (client) {
    return (await client.fetch(authorAndPostsQuery, { slug })) || {}
  }
  return {} as any
}

export async function getAuthorMetaDataInfoBySlug(slug: string): Promise<AuthorMetaDataInfo> {
  if (client) {
    return await client.fetch(authorMetaDataInfoBySlugQuery, { slug })
  }
  return {} as any
}

export async function getTotalPosts(category: string): Promise<number> {
  if (client) {
    return await client.fetch(totalPostsQuery, {
      category,
    })
  }
  return 0
}
