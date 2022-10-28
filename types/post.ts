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
  image: Image
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
  featuredArticle: boolean
  excerpt: string
  body: string
  estimatedReadingTime: number
  author: Author
  mainImage: Image
  wordCount: number
}
