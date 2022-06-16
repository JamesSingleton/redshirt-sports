import fs from 'fs'
import { Feed } from 'feed'
import { parseISO } from 'date-fns'
import { toHTML } from '@portabletext/to-html'
import { getClient } from '@lib/sanity.server'
import { allPosts } from '@lib/sanityGroqQueries'
import { urlForImage } from '@lib/sanity'
import myPortableTextComponents from './toHTML'

const generateRssFeed = async () => {
  const baseUrl = 'https://www.redshirtsports.xyz'
  const posts = await getClient().fetch(allPosts)

  const feed = new Feed({
    title: 'Redshirt Sports',
    description: 'All the latest FCS news from Redshirt Sports.',
    id: baseUrl,
    link: baseUrl,
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
          link: post.author.twitterURL,
        },
      ],
      date: parseISO(post.publishedAt),
      image: urlForImage(post.mainImage).url(),
    })
  })

  fs.mkdirSync('./public/feeds', { recursive: true })
  fs.writeFileSync('./public/feeds/feed.xml', feed.rss2())
  fs.writeFileSync('./public/feeds/atom.xml', feed.atom1())
  fs.writeFileSync('./public/feeds/feed.json', feed.json1())
}

generateRssFeed()
