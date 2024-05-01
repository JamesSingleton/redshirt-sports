import { BASE_URL } from '@lib/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/og'],
      disallow: ['/api/', '/studio/'],
    },
    sitemap: [`${BASE_URL}/sitemap.xml`],
  }
}
