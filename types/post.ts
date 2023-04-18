import type { PortableTextBlock } from 'sanity'

import type { MainImage } from './common'

export type Category = {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  parentSlug?: string
  parentTitle?: string
  description: string
}

export type Author = {
  _id: string
  _updatedAt: string
  publishedAt: string
  name: string
  slug: string
  role: string
  image: MainImage
  bio: any
  posts?: Post[]
  socialMedia: [
    {
      _key: string
      name: string
      url: string
    }
  ]
  totalPosts: number
}

export type Post = {
  _id: string
  _updatedAt: string
  publishedAt: string
  slug: string
  title: string
  category: string
  subcategory: {
    title: string
    slug: string
    parentSlug: string
    parentTitle: string
  }
  featuredArticle: boolean
  excerpt: string
  body?: PortableTextBlock[]
  estimatedReadingTime: number
  author: Author
  mainImage: MainImage
  wordCount: number
}
