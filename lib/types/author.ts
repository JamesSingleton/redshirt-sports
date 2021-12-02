import type { Post } from './post'

export type AuthorImage = {
  url: string
}

export type AuthorTypes = {
  _id: string
  name: string
  slug: string
  role: string
  image: AuthorImage
  backgroundImage: AuthorImage
  bio: string
  twitterURL: string
  posts: Post[]
}
