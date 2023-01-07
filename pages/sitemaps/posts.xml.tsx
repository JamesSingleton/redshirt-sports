import { GetServerSideProps } from 'next'
import { getServerSideSitemap } from 'next-sitemap'

import { sanityClient } from '@lib/sanity.server'
import { getAllPostsForSitemap } from '@lib/sanity.queries'

import type { Post } from '@types'

export default function Sitemap() {}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const posts = await sanityClient.fetch<Post[]>(getAllPostsForSitemap)

  const postFields = posts.map((post) => ({
    loc: `https://www.redshirtsports.xyz/${post.slug}`,
    lastmod: post._updatedAt,
    priority: 0.7,
  }))

  const sitemap = [...postFields]

  return getServerSideSitemap(ctx, sitemap)
}
