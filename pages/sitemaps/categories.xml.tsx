import { GetServerSideProps } from 'next'
import { getServerSideSitemap } from 'next-sitemap'

import { sanityClient } from '@lib/sanity.server'
import { getCategories } from '@lib/sanity.queries'

import type { Category } from '@types'

export default function CategoriesSitemap() {}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const categories = await sanityClient.fetch<Category[]>(getCategories)

  const categoryFields = categories.map(({ slug, parentSlug, _updatedAt }) => {
    const url: string = parentSlug !== null ? `/${parentSlug}/${slug}` : `/${slug}`
    return {
      loc: `https://www.redshirtsports.xyz${url}`,
      lastmod: _updatedAt,
    }
  })

  const sitemap = [...categoryFields]

  return getServerSideSitemap(ctx, sitemap)
}
