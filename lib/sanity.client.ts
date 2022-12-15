import 'server-only'

import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '@lib/sanity.api'
import {
  postBySlugQuery,
  postSlugsQuery,
  settingsQuery,
  homePageQuery,
  postAndMoreStoriesQuery,
} from './sanity.queries'

import type { Post, Settings } from '@types'

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
