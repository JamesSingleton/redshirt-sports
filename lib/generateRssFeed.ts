import fs from 'fs'
import { Feed } from 'feed'
import { parseISO } from 'date-fns'
import { getClient } from '@lib/sanity.server'
import { allPosts } from '@lib/sanityGroqQueries'
import { Post } from './types/post'
import toPlainText from './toPlainText'

const generateRssFeed = async () => {
  const baseURL = 'https://www.redshirtsports.xyz'
  const posts = await getClient().fetch(allPosts)

  const feed = new Feed({
    title: 'Redshirt Sports',
    description: '',
    id: baseURL,
    link: baseURL,
    image: `${baseURL}/images/icons/RS_red_horizontal.svg`,
    favicon: `${baseURL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, Redshirt Sports`,
    feedLinks: {
      rss2: `${baseURL}/rss/feed.xml`,
    },
  })

  posts.forEach((post: Post) => {
    const url = `${baseURL}/${post.slug}`

    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.excerpt,
      content: toPlainText(post.body),
      author: [post.author],
      contributor: [post.author],
      date: parseISO(post.publishedAt),
    })
  })

  fs.mkdirSync('./public/rss', { recursive: true })
  fs.writeFileSync('./public/rss/feed.xml', feed.rss2())
}

export default generateRssFeed
