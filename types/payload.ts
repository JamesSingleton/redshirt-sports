import { PortableTextBlock } from 'sanity'

import { Author, Post } from './post'
import { MainImage } from './common'

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
  category: string
  division: {
    name: string
    slug: string
  }
  conferences: {
    name: string
    shortName: string
    slug: string
  }[]
  slug: string
  author: Author
  excerpt: string
  body: PortableTextBlock[]
  featuredArticle: boolean
  estimatedReadingTime: number
  wordCount: number
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
