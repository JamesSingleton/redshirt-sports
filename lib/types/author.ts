import type { Post } from '@types'

export type AuthorImage = {
  url: string
}

export type AuthorTypes = {
  _id: string
  _updatedAt: string
  name: string
  slug: string
  role: string
  image: AuthorImage
  backgroundImage: AuthorImage
  bio: string
  twitterURL: string
  twitterHandle: string
  posts: Post[]
}
