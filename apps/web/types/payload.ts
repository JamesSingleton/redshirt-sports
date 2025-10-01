import { type PortableTextBlock } from 'next-sanity'

import { Conference } from './common'
import type { SanityImageAsset, Author, Post } from '@redshirt-sports/sanity/types'

export interface AboutPagePayload {
  authors: Author[]
}

export interface PostPayload {
  _id: string
  _updatedAt: string
  title: string
  publishedAt: string
  mainImage: SanityImageAsset
  division: {
    name: string
    slug: string
  }
  conferences: Conference[]
  teams: {
    _id: string
    name: string
    shortName: string
    nickname?: string
  }[]
  slug: string
  author: Author
  authors: Author[]
  excerpt: string
  body: PortableTextBlock[]
  featuredArticle: boolean
  estimatedReadingTime: number
  wordCount: number
  relatedArticles: Post[]
}

export type Week = {
  number: number
  startDate: string
  endDate: string
  text: string
}

export type WeekDetail = {
  number: number
  startDate: string
  endDate: string
  text: string
}

export type SeasonType = {
  id: string
  type: number
  name: string
  startDate: string
  endDate: string
  weeks?: WeekDetail[]
  week: Week | {}
}

export type Season = {
  year: number
  displayName: string
  startDate: string
  endDate: string
  types: SeasonType[]
}

export type ESPNBody = {
  seasons: Season[]
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
  logo: SanityImageAsset
  conferences: Conference[]
}

export interface ConferencePayload {
  _id: string
  _updatedAt: string
  name: string
  shortName: string
  slug: string
  description: string
  logo: SanityImageAsset
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

export type SitemapContent = {
  _id: string
  _updatedAt: string
  publishedAt: string
  slug: string
  title: string
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

export interface SchoolLite {
  _id: string
  name: string
  image: SanityImageAsset
  abbreviation: string
  shortName: string
  _points: number
}

export interface ESPNApiRef {
  $ref: string
}

export interface ESPNWeeksResponse {
  count: number
  pageIndex: number
  pageSize: number
  pageCount: number
  items: ESPNApiRef[]
}

export interface ESPNWeekResponse extends Week {
  $ref: string
  rankings: ESPNApiRef
}
