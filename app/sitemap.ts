import { getSitemap } from '@lib/sanity.client'
import { baseUrl } from '@lib/constants'

import type { MetadataRoute } from 'next'
import type { Post, Author, Category } from '@types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { posts, authors, categories, subcategories } = await getSitemap()

  const postRoutes = posts.map((post: Post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post._updatedAt,
  }))

  const authorRoutes = authors.map((author: Author) => ({
    url: `${baseUrl}/authors/${author.slug}`,
    lastModified: author._updatedAt,
  }))

  const parentCategories = categories.map((category: Category) => ({
    url: `${baseUrl}/news/${category.slug}`,
    lastModified: category._updatedAt,
  }))

  const subCategories = subcategories.map(
    (subcategory: { parentSlug: any; slug: any; _updatedAt: any }) => ({
      url: `${baseUrl}/news/${subcategory.parentSlug}/${subcategory.slug}`,
      lastModified: subcategory._updatedAt,
    })
  )

  const routes = ['', '/about', '/contact', '/privacy'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
  }))

  return [...routes, ...parentCategories, ...subCategories, ...postRoutes, ...authorRoutes]
}
