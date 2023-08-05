import fs from 'fs'
import { Feed } from 'feed'
import { toHTML, uriLooksSafe } from '@portabletext/to-html'
import { parseISO } from 'date-fns'
import htm from 'htm'
import vhtml from 'vhtml'

import { getPostsForRssFeed } from './sanity.client'
import { baseUrl } from './constants'

const html = htm.bind(vhtml)
const myPortableTextComponents = {
  types: {
    image: ({ value }) => html`<img src="${value.imageUrl}" />`,
    callToAction: ({ value, isInline }) =>
      isInline
        ? html`<a href="${value.url}">${value.text}</a>`
        : html`<div class="callToAction">${value.text}</div>`,
  },

  marks: {
    internalLink: ({ children, value }) => {
      let linkHref = `/${value?.slug.current}`

      if (value?.parentSlug) {
        linkHref = `/${value.parentSlug}/${value.slug.current}`
      }
      return html`<a href="${linkHref}">${children}</a>`
    },
    link: ({ children, value }) => {
      // ⚠️ `value.href` IS NOT "SAFE" BY DEFAULT ⚠️
      // ⚠️ Make sure you sanitize/validate the href! ⚠️
      const href = value.href || ''

      if (uriLooksSafe(href)) {
        const rel = href.startsWith('/') ? undefined : 'noreferrer noopener'
        return html`<a href="${href}" rel="${rel}">${children}</a>`
      }

      // If the URI appears unsafe, render the children (eg, text) without the link
      return children
    },
  },
}

export default async function buildRss() {
  const posts = await getPostsForRssFeed()

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
      json: `${baseUrl}/feeds/feed.json`,
      atom: `${baseUrl}/feeds/atom.xml`,
    },
    author: {
      name: 'Redshirt Sports',
      link: 'https://twitter.com/_redshirtsports',
    },
  })

  posts.forEach((post) => {
    const url = `${baseUrl}/${post.slug}`

    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.excerpt,
      content: toHTML(post.body, { components: myPortableTextComponents }),
      author: [
        {
          name: post.author.name,
          link: `${baseUrl}/authors/${post.author.slug}`,
        },
      ],
      date: parseISO(post.publishedAt),
    })
  })

  fs.mkdirSync('./public/feeds', { recursive: true })
  fs.writeFileSync('./public/feeds/feed.xml', feed.rss2())
  fs.writeFileSync('./public/feeds/atom.xml', feed.atom1())
  fs.writeFileSync('./public/feeds/feed.json', feed.json1())
}
