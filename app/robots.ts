import { HOME_DOMAIN } from '@/lib/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/rss/'],
      disallow: ['/_next/image', '/api/', '/studio/', '/vote/', '/sign-in/', '/sign-up/'],
    },
    sitemap: [
      `${HOME_DOMAIN}/sitemap.xml`,
      `${HOME_DOMAIN}/news/sitemap/0.xml`,
      `${HOME_DOMAIN}/authors/sitemap/0.xml`,
      `${HOME_DOMAIN}/college-football/rankings/sitemap/0.xml`,
    ],
  }
}
