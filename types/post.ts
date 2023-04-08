import type { Image, ImageAsset } from 'sanity'

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
  image: Image & ImageAsset
  bio: any
  posts?: Post[]
  socialMedia: [
    {
      _key: string
      name: string
      url: string
    }
  ]
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
  body: string
  estimatedReadingTime: number
  author: Author
  mainImage: Image
  wordCount: number
}
