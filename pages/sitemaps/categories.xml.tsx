import { GetServerSideProps } from 'next'
import { getServerSideSitemap } from 'next-sitemap'

import { sanityClient } from '@lib/sanity.server'
import { getCategories } from '@lib/queries'

import type { Category } from '@types'

export default function CategoriesSitemap() {}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const categories = await sanityClient.fetch<Category[]>(getCategories)

  const categoryFields = categories.map((category) => ({
    loc: `https://www.redshirtsports.xyz/${category.slug}`,
    lastmod: category._updatedAt,
  }))

  const sitemap = [...categoryFields]

  return getServerSideSitemap(ctx, sitemap)
}
