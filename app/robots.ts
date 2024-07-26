import { HOME_DOMAIN } from '@/lib/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/api/', '/studio/', '/vote/'],
    },
    sitemap: [`${HOME_DOMAIN}/sitemap.xml`],
  }
}
