import { baseUrl } from '@lib/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/studio/'],
    },
    sitemap: ['https://www.redshirtsports.xyz/sitemap.xml'],
    host: baseUrl,
  }
}
