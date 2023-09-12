import { Feed } from 'feed'
import {
  toHTML,
  uriLooksSafe,
  PortableTextComponents,
  PortableTextMarkComponent,
} from '@portabletext/to-html'
import { parseISO } from 'date-fns'
import htm from 'htm'
import vhtml from 'vhtml'

import { baseUrl } from '@lib/constants'
import { getRSSFeed } from '@lib/sanity.fetch'
import { Post } from '@types'
import { urlForRssImage } from '@lib/sanity.image'

const html = htm.bind(vhtml)

const components: PortableTextComponents = {
  marks: {
    // @ts-ignore
    link: ({ value, children }: PortableTextMarkComponent) => {
      const { blank, href } = value
      const safe = uriLooksSafe(href)
      return html`
        <a href="${href}" target="${blank && safe ? '_blank' : '_self'}" rel="noopener noreferrer">
          ${children}
        </a>
      `
    },
    // @ts-ignore
    internalLink: ({ value, children }: PortableTextMarkComponent) => {
      let linkHref = `/${value?.slug.current}`

      if (value?.parentSlug) {
        linkHref = `/${value.parentSlug}/${value.slug.current}`
      }

      return html`<a href="${baseUrl}${linkHref}">${children}</a>`
    },
  },
  types: {
    // @ts-ignore
    image: ({ value }: any) => html`<img src="${urlForRssImage(value)}" />`,
  },
}

export async function GET() {
  const posts = await getRSSFeed()

  const feed = new Feed({
    title: `Redshirt Sports`,
    description:
      'Redshirt Sports provides the latest college football news, analysis, and insights, offering comprehensive coverage and capturing the excitement of NCAA gridiron action.',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    copyright: `All rights reserved ${new Date().getFullYear()}, Redshirt Sports`,
    feedLinks: {
      rss: `${baseUrl}/feeds/feed.xml`,
    },
    author: {
      name: 'Redshirt Sports',
      email: 'contact@redshirtsports.xyz',
      link: 'https://twitter.com/_redshirtsports',
    },
  })

  posts.forEach((post: Post) => {
    const url = `${baseUrl}/${post.slug}`

    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.excerpt && post.excerpt.replace('&', '&#x26;'),
      date: parseISO(post.publishedAt),
      image: urlForRssImage(post.mainImage).url(),
      content: toHTML(post.body, { components }),
    })
  })
  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
    },
  })
}
