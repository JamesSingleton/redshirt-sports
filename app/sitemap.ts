import type { MetadataRoute } from 'next'

import { getParentCategorySlugs, getPostsForSitemap, getSubcategorySlugs } from '@lib/sanity.client'

export default async function sitemap() {
  const postSlugsAndUpdatedDate = await getPostsForSitemap()
  const posts = postSlugsAndUpdatedDate.map(
    ({ slug, _updatedAt }: { slug: string; _updatedAt: string }) => ({
      url: `https://www.redshirtsports.xyz/${slug}`,
      lastModified: _updatedAt,
    })
  )

  const parentCategories = await getParentCategorySlugs().then((data) =>
    data.map(({ slug }: { slug: string }) => ({
      url: `https://www.redshirtsports.xyz/news/${slug}`,
      lastModified: new Date().toISOString(),
    }))
  )

  const subCategories = await getSubcategorySlugs().then((data) =>
    data.map(({ slug, parentSlug }: { slug: string; parentSlug: string }) => ({
      url: `https://www.redshirtsports.xyz/news/${parentSlug}/${slug}`,
      lastModified: new Date().toISOString(),
    }))
  )

  const routes = ['', '/about', '/contact', '/privacy'].map((route) => ({
    url: `https://www.redshirtsports.xyz${route}`,
    lastModified: new Date().toISOString(),
  }))

  return [...routes, ...parentCategories, ...subCategories, ...posts]
}
