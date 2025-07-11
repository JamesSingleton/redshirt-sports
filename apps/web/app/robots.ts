import { HOME_DOMAIN } from '@/lib/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: [
        '/_next/image',
        '/api/cron/',
        '/api/revalidate/',
        '/api/vote/',
        '/api/webhooks/',
        '/studio/',
        '/vote/',
        '/sign-in/',
        '/sign-up/',
      ],
    },
    sitemap: [
      `${HOME_DOMAIN}/sitemap.xml`,
      `${HOME_DOMAIN}/college/football/rankings/sitemap/0.xml`,
    ],
  }
}
