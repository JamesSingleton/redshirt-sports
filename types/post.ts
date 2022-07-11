export type Image = {
  caption: string
  attribution: string
  asset: {
    _id: string
    _type: string
    url: string
    metadata: {
      lqip: string
    }
  }
}

export type Author = {
  _id: string
  _updatedAt: string
  publishedAt: string
  name: string
  slug: string
  role: string
  image: Image
  backgroundImage: Image
  bio: string
  twitterURL: string
  twitterHandle: string
  posts?: Post[]
}

export type Post = {
  _id: string
  _updatedAt: string
  publishedAt: string
  slug: string
  title: string
  categories: string[]
  featuredArticle: boolean
  excerpt: string
  body: string
  estimatedReadingTime: number
  author: Author
  mainImage: Image
}
