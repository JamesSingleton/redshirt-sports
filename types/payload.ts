import { PortableTextBlock, Image } from 'sanity'

import { Author } from './post'

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
  mainImage: Image
  category: string
  subcategory: {
    title: string
    slug: string
    parentSlug: string
    parentTitle: string
  }
  slug: string
  author: Author
  excerpt: string
  body?: PortableTextBlock[]
  featuredArticle: boolean
  estimatedReadingTime: number
  wordCount: number
}
