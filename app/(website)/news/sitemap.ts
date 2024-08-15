import { HOME_DOMAIN } from '@/lib/constants'
import { getPostsForSitemap } from '@/lib/sanity.fetch'
import type { MetadataRoute } from 'next'

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

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Google's limit is 50,000 URLs per sitemap
  const start = id * 50000
  const end = start + 50000
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
