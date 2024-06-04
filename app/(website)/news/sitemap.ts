import { BASE_URL } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity.fetch'
import type { SiteMapPost } from '@/types'
import type { MetadataRoute } from 'next'

export async function generateSitemaps() {
  const posts = await sanityFetch<SiteMapPost[]>({
    query: `*[_type == 'post' && defined(slug.current)]{
      _updatedAt,
      "slug": slug.current,
    }`,
    tags: ['post'],
  })
  const sitemaps = []
  for (let i = 0; i < Math.ceil(posts.length / 50000); i++) {
    sitemaps.push({
      id: i,
    })
  }

  return sitemaps
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Google's limit is 50,000 URLs per sitemap
  const start = id * 50000
  const end = start + 50000
  const posts = await sanityFetch<SiteMapPost[]>({
    query: `*[_type == 'post' && defined(slug.current)]{
      _updatedAt,
      "slug": slug.current,
    }`,
    tags: ['post'],
  })
  return posts.map((post) => ({
    url: `${BASE_URL}/${post.slug}`,
    lastModified: post._updatedAt,
    priority: 0.7,
  }))
}
