import { HOME_DOMAIN } from '@/lib/constants'
import { getPostsForSitemap } from '@/lib/sanity.fetch'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export async function generateSitemaps() {
  const posts = await getPostsForSitemap()

  const sitemaps = []
  for (let i = 0; i < Math.ceil(posts.length / 50000); i++) {
    sitemaps.push({
      id: i,
    })
  }

  return sitemaps
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPostsForSitemap()

  return posts.map((post) => {
    let priority = 0.5
    const publishedAt = new Date(post.publishedAt)
    const now = new Date()
    const diff = now.getTime() - publishedAt.getTime()
    const days = diff / (1000 * 60 * 60 * 24)
    // if the post was published within the last 30 days, set the priority to 0.9, if it was published within the last 30-90 days, set the priority to 0.7 and if it's older than 90 days set to 0.5
    if (days < 30) {
      priority = 0.9
    } else if (days < 90) {
      priority = 0.7
    } else {
      priority = 0.5
    }
    return {
      url: `${HOME_DOMAIN}/${post.slug}`,
      lastModified: post._updatedAt,
      priority,
    }
  })
}
