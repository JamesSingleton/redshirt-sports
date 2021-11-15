export type PostImage = {
  url: string
  alt: string
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
  author: PostAuthor
  mainImage: string
  publishedAt: string
  slug: string
  title: string
  category: PostCategory
  excerpt: string
  body: string
}

export type PostTypes = {
  post: Post
}
