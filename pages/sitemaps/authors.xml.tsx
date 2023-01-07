import { GetServerSideProps } from 'next'
import { getServerSideSitemap } from 'next-sitemap'

import { sanityClient } from '@lib/sanity.server'
import { getAllAuthorsForSitemap } from '@lib/sanity.queries'

import type { Author } from '@types'

export default function Sitemap() {}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const authors = await sanityClient.fetch<Author[]>(getAllAuthorsForSitemap)

  const authorFields = authors.map((author) => ({
    loc: `https://www.redshirtsports.xyz/authors/${author.slug}`,
    lastmod: author._updatedAt,
    priority: 0.5,
  }))

  const sitemap = [...authorFields]

  return getServerSideSitemap(ctx, sitemap)
}
