import { PortableTextBlock } from 'sanity'

import { Author, Post } from './post'
import { Conference, MainImage } from './common'

import type { Image } from 'sanity'

export interface AboutPagePayload {
  authors: Author[]
}

export interface PrivacyPolicyPagePayload {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  body: PortableTextBlock[]
}

export interface PostPayload {
  _id: string
  _updatedAt: string
  title: string
  publishedAt: string
  mainImage: MainImage
  division: {
    name: string
    slug: string
  }
  conferences: Conference[]
  slug: string
  author: Author
  excerpt: string
  body: PortableTextBlock[]
  featuredArticle: boolean
  estimatedReadingTime: number
  wordCount: number
  relatedArticles: Post[]
}

export interface DivisionPayload {
  _id: string
  _updatedAt: string
  title: string
  name: string
  pageHeader: string
  heading: string
  subTitle: string
  slug: string
  description: string
  posts: Post[]
  totalPosts: number
}

export interface Division {
  _id: string
  _updatedAt: string
  name: string
  heading: string
  longName: string
  slug: string
  description: string
  logo: MainImage
  conferences: Conference[]
}

export interface ConferencePayload {
  _id: string
  _updatedAt: string
  name: string
  shortName: string
  slug: string
  description: string
  logo: Image & {
    alt: string
  }
  division: {
    name: string
    slug: string
  }
  posts: Post[]
  totalPosts: number
  divisionSlug?: string
}

export interface PostsWithPaginationPayload {
  posts: Post[]
  totalPosts: number
}

export type SiteMapPost = {
  _id: string
  _updatedAt: string
  slug: string
}

export interface SitemapPayload {
  posts: {
    _id: string
    _updatedAt: string
    slug: string
  }[]
  authors: {
    _id: string
    _updatedAt: string
    slug: string
  }[]
  divisions: {
    _id: string
    _updatedAt: string
    slug: string
  }[]
  conferences: {
    _id: string
    _updatedAt: string
    slug: string
    divisionSlug: string
  }[]
}

export interface HomePagePayload {
  heroArticle: Post
  recentArticles: Post[]
  latestArticles: Post[]
  fcsArticles: Post[]
  fbsArticles: Post[]
  d2Articles: Post[]
  d3Articles: Post[]
}
