import { NextRequest, NextResponse } from 'next/server'

import { HOME_DOMAIN } from '@/lib/constants'
import { getPostsForNewsSitemap } from '@/lib/sanity.fetch'
import type { SitemapContent } from '@/types'

function generateSitemapXml(posts: SitemapContent[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${posts
        .map(
          (post) => `
        <url>
          <loc>${HOME_DOMAIN}/${post.slug}</loc>
          <news:news>
            <news:publication>
              <news:name>${process.env.NEXT_PUBLIC_APP_NAME}</news:name>
              <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${post.publishedAt}</news:publication_date>
            <news:title>${post.title}</news:title>
          </news:news>
        </url>
      `,
        )
        .join('')}
    </urlset>`
}

export async function GET() {
  const posts = await getPostsForNewsSitemap()

  const sitemapXml = generateSitemapXml(posts)

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
  })
}
