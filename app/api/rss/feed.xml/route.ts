import { NextResponse } from 'next/server'
import { Feed } from 'feed'

import { getRSSFeed } from '@/lib/sanity.fetch'
import { HOME_DOMAIN } from '@/lib/constants'
import { urlForImage } from '@/lib/sanity.image'

export async function GET() {
  const posts = await getRSSFeed()

  const feed = new Feed({
    title: `${process.env.NEXT_PUBLIC_APP_NAME} - All News`,
    id: `${HOME_DOMAIN}/news`,
    link: `${HOME_DOMAIN}/news`,
    description: `Get the latest college football news, covering FCS, FBS, D2, and D3. Explore insightful articles and stay informed with ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    language: 'en',
    copyright: `All rights reserved ${new Date().getFullYear()}, ${process.env.NEXT_PUBLIC_APP_NAME}`,
    favicon: `${HOME_DOMAIN}/favicon.ico`,
    image: `${HOME_DOMAIN}/images/icons/RS_horizontal_513x512.png`,
    feedLinks: {
      rss: `${HOME_DOMAIN}/api/rss/feed.xml`,
    },
    author: {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}`,
      email: 'contact@redshirtsports.xyz',
      link: HOME_DOMAIN,
    },
  })

  posts.forEach((post) => {
    const author = post.authors
      ? post.authors.map((author) => ({
          name: author.name,
          link: `${HOME_DOMAIN}/authors/${author.slug}`,
        }))
      : [{ name: post.author.name, link: `${HOME_DOMAIN}/authors/${post.author.slug}` }]

    feed.addItem({
      title: post.title,
      id: `${HOME_DOMAIN}/${post.slug}`,
      link: `${HOME_DOMAIN}/${post.slug}`,
      description: post.excerpt,
      author,
      date: new Date(post.publishedAt),
      ...(post.division && {
        category: [
          { name: post.division.name, domain: `${HOME_DOMAIN}/news/${post.division.slug}` },
        ],
      }),
      image: urlForImage(post.mainImage).url(),
    })
  })

  return new NextResponse(feed.rss2(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
