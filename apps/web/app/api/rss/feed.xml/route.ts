import { NextResponse } from 'next/server'
import { Feed } from 'feed'

import { client } from '@redshirt-sports/sanity/client'
import { getBaseUrl } from '@/lib/get-base-url'
import { buildSafeImageUrl } from '@/components/json-ld'
import { rssFeedQuery } from '@redshirt-sports/sanity/queries'

const baseUrl = getBaseUrl()

export async function GET() {
  const posts = await client.fetch(rssFeedQuery)

  const feed = new Feed({
    title: `${process.env.NEXT_PUBLIC_APP_NAME}`,
    id: `${baseUrl}/college/news`,
    link: `${baseUrl}/college/news`,
    description:
      'Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.',
    language: 'en',
    copyright: `All rights reserved ${new Date().getFullYear()}, ${process.env.NEXT_PUBLIC_APP_NAME}`,
    favicon: `${baseUrl}/favicon.ico`,
    image: `${baseUrl}/images/icons/RS_horizontal_513x512.png`,
    feedLinks: {
      rss: `${baseUrl}/api/rss/feed.xml`,
    },
    author: {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}`,
      email: 'contact@redshirtsports.xyz',
      link: baseUrl,
    },
  })

  posts.forEach((post) => {
    feed.addItem({
      title: post.title,
      link: `${baseUrl}/${post.slug}`,
      description: post.excerpt,
      date: new Date(post.publishedAt),
      image: buildSafeImageUrl(post.mainImage),
    })
  })

  return new NextResponse(feed.rss2(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
