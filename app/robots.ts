import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/studio/'],
    },
    sitemap: [
      'https://www.redshirtsports.xyz/sitemap.xml',
      'https://www.redshirtsports.xyz/sitemap-0.xml',
      'https://www.redshirtsports.xyz/sitemaps/categories.xml',
      'https://www.redshirtsports.xyz/sitemaps/authors.xml',
      'https://www.redshirtsports.xyz/sitemaps/posts.xml',
    ],
    host: 'https://www.redshirtsports.xyz',
  }
}
