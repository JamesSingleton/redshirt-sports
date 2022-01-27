import type { AuthorTypes } from './author'

export type PostImage = {
  url: string
  caption: string
  attribution: string
}

export type PostAuthor = {
  name: string
  image: string
  slug: string
}

export type PostCategory = {
  title: string
  description: string
}

export type Post = {
  _id: string
  _updatedAt: string
  author: AuthorTypes
  otherAuthors?: AuthorTypes[]
  mainImage: PostImage
  publishedAt: string
  slug: string
  title: string
  categories: string[]
  featuredArticle: boolean
  excerpt: string
  body: string
  estimatedReadingTime: number
}

export type PostTypes = {
  post: Post
}
