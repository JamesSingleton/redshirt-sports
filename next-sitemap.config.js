const sitemaps = ['categories.xml', 'authors.xml', 'posts.xml']

function isServerSidePath(path) {
  if (path.includes('authors/')) {
    return true
  }
  if (path === '/' || path === '/about' || path === '/contact' || path === '/privacy') {
    return false
  } else {
    return true
  }
}

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.VERCEL_URL || 'https://www.redshirtsports.xyz',
  generateRobotsTxt: true,
  exclude: ['/fcs/page/*', '/fbs/page/*', '/search', '/sitemaps/*'],
  transform: (config, path) => {
    if (isServerSidePath(path)) {
      return null
    }

    if (path === '/') {
      return {
        loc: path,
        priority: 1.0,
        changefreq: 'daily',
        lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      }
    } else if (path === '/about') {
      return {
        loc: path,
        priority: 0.5,
        changefreq: 'monthly',
      }
    } else if (path === '/contact') {
      return {
        loc: path,
        priority: 0.5,
        changefreq: 'monthly',
      }
    } else if (path === '/privacy') {
      return {
        loc: path,
        priority: 0.5,
        changefreq: 'monthly',
      }
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: '/api',
      },
    ],
    additionalSitemaps: sitemaps.map(
      (sitemap) =>
        `${process.env.VERCEL_URL || 'https://www.redshirtsports.xyz'}/sitemaps/${sitemap}`
    ),
    includeNonIndexSitemaps: true,
  },
}
