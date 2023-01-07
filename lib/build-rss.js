import fs from 'fs'
import { Feed } from 'feed'
import { parseISO } from 'date-fns'
import htm from 'htm'
import vhtml from 'vhtml'
import { toHTML, uriLooksSafe } from '@portabletext/to-html'
import { sanityClient } from '@lib/sanity.server'
import { allPostsForRssFeed } from '@lib/sanity.queries'
import { urlForRSSImage } from '@lib/sanity.image'

const html = htm.bind(vhtml)

const ImageComponent = ({ value }) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={urlForRSSImage(value).fit('min').auto('format').url()} alt={value.caption || ' '} />
  )
}

const myPortableTextComponents = {
  types: {
    image: ImageComponent,
  },
  marks: {
    link: ({ children, value }) => {
      const href = value.href || ''

      if (uriLooksSafe(href)) {
        return html`<a href="${href}" rel="noreferrer noopener">${children}</a>`
      }

      return children
    },
    internalLink: ({ children, value }) => {
      const href = value.slug.current || ''

      if (uriLooksSafe(href)) {
        return html`<a href="https://www.redshirtsports.xyz/${href}">${children}</a>`
      }

      return children
    },
  },
}

const generateRssFeed = async () => {
  const baseUrl = 'https://www.redshirtsports.xyz'
  const posts = await sanityClient.fetch(allPostsForRssFeed)

  const feed = new Feed({
    title: 'Redshirt Sports',
    description: 'All the latest FCS news from Redshirt Sports.',
    id: `${baseUrl}/`,
    link: `${baseUrl}/`,
    language: 'en-US',
    image: `${baseUrl}/images/icons/RS_horizontal_513x512.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Redshirt Sports`,
    feedLinks: {
      rss: `${baseUrl}/feeds/feed.xml`,
      json: `${baseUrl}/feeds/feed.json`,
      atom: `${baseUrl}/feeds/atom.xml`,
    },
    author: {
      name: 'James Singleton',
      link: 'https://twitter.com/@Design__Pattern',
      email: 'editors@redshirtsports.xyz',
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
          link: `https://www.redshirtsports.xyz/author/${post.author.slug}`,
        },
      ],
      date: parseISO(post.publishedAt),
      image: urlForRSSImage(post.mainImage).url(),
    })
  })

  fs.mkdirSync('./public/feeds', { recursive: true })
  fs.writeFileSync('./public/feeds/feed.xml', feed.rss2())
  fs.writeFileSync('./public/feeds/atom.xml', feed.atom1())
  fs.writeFileSync('./public/feeds/feed.json', feed.json1())
}

generateRssFeed()
