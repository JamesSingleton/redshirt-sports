import { GetServerSideProps } from 'next'
import { sanityClient } from '@lib/sanity.server'
import { allAuthors, allPosts } from '@lib/sanityGroqQueries'
import type { Post } from '@lib/types/post'
import type { AuthorTypes } from '@lib/types/author'

const Sitemap = () => {}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const baseUrl = 'https://www.redshirtsports.xyz'
  const posts = await sanityClient.fetch(allPosts)
  const authors = await sanityClient.fetch(allAuthors)

  const postsSitemap = posts.map(
    (post: Post) => `
      <loc>${baseUrl}/${post.slug}</loc>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
      <lastmod>${post._updatedAt}</lastmod>
    `
  )

  const authorsSitemap = authors.map(
    (author: AuthorTypes) => `
      <loc>${baseUrl}/authors/${author.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
      <lastmod>${author._updatedAt}</lastmod>
    `
  )

  const createSitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
      <url>
        <loc>https://www.redshirtsports.xyz</loc>
        <changefreq>daily</changefreq>
        <priority>1</priority>
      </url>
      <url>
        <loc>https://www.redshirtsports.xyz/authors</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://www.redshirtsports.xyz/fbs</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://www.redshirtsports.xyz/fcs</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>
      <url>
        <loc>https://www.redshirtsports.xyz/advertising</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
      <url>
        <loc>https://www.redshirtsports.xyz/privacy</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
      </url>
      ${postsSitemap.map((post: any) => `<url>${post}</url>`).join('')}
      ${authorsSitemap.map((author: any) => `<url>${author}</url>`).join('')}
    </urlset>
  `

  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap())
  res.end()

  return {
    props: {},
  }
}

export default Sitemap
