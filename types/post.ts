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
  posts?: Post[]
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

export type AuthorMetaDataInfo = {
  _id: string
  name: string
  slug: string
  image: Image
  role: string
  bio: any
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
    _id: string
    _type: string
    title: string
    slug: string
    parentSlug: string
    parentTitle: string
  }
  featuredArticle: boolean
  excerpt: string
  body: any
  estimatedReadingTime: number
  author: Author
  mainImage: Image
  wordCount: number
}
