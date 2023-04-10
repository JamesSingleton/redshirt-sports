import { PortableTextBlock } from 'sanity'

import { Author } from './post'
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
