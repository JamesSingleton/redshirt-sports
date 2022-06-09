import { GetServerSideProps } from 'next'
import { sanityClient } from '@lib/sanity.server'
import { allPosts } from '@lib/queries'
import type { Post } from '@lib/types/post'
import toPlainText from '@lib/toPlainText'

const NewsSitemap = () => {}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.redshirtsports.xyz'
  const posts = await sanityClient.fetch(allPosts)

  const postsSitemap = posts.map(
    (post: Post) => `
      <loc>${baseUrl}/${post.slug}</loc>
      <news:news>
        <news:publication>
          <news:name>Redshirt Sports</news:name>
          <news:language>en</news:language>
        </news:publication>
        <news:genres>UserGenerated</news:genres>
        <news:publication_date>${post.publishedAt}</news:publication_date>
        <news:keywords>sports, college football</news:keywords>
        <news:title>${post.title.replace('&', '&amp;')}</news:title>
      </news:news>
    `
  )

  const createSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${postsSitemap.map((post: any) => `<url>${post}</url>`).join('')}
  </urlset>
  `

  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap())
  res.end()

  return {
    props: {},
  }
}

export default NewsSitemap
