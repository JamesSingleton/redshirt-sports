import type { PortableTextBlock } from 'next-sanity'

import type { MainImage } from './common'

export type Author = {
  _id: string
  _createdAt: string
  _updatedAt: string
  publishedAt: string
  archived: boolean
  name: string
  slug: string
  roles: string[]
  image: MainImage
  biography: string
  socialMedia: [
    {
      _key: string
      name: string
      url: string
    },
  ]
  collegeOrUniversity?: string
}

export type AuthorPosts = {
  posts: Post[]
  totalPosts: number
}

export type Post = {
  _id: string
  _updatedAt: string
  publishedAt: string
  slug: string
  title: string
  division: {
    _id: string
    name: string
    slug: string
  }
  conferences: {
    _id: string
    name: string
    shortName: string
    slug: string
  }[]
  featuredArticle: boolean
  excerpt: string
  body: PortableTextBlock[]
  estimatedReadingTime: number
  author: Author
  authors: Author[]
  mainImage: MainImage
  wordCount: number
  sport: string
}
