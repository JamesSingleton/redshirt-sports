import { NextSeo } from 'next-seo'

import { NEXT_SEO_DEFAULT } from '@config/next-seo.config'
import { getSubCategoryInfoBySlug } from '@lib/sanity.client'
import { SITE_URL } from '@lib/constants'

import type { NextSeoProps } from 'next-seo'

export default async function Head({ params }: { params: { slug: string } }) {
  const { title, description, parentSlug } = await getSubCategoryInfoBySlug(params.slug)

  const updateMeta: NextSeoProps = {
    ...NEXT_SEO_DEFAULT,
    title: `${title} Football`,
    description,
    openGraph: {
      ...NEXT_SEO_DEFAULT.openGraph,
      url: `${SITE_URL}/${parentSlug}/${params.slug}`,
      images: [
        {
          url: `${SITE_URL}/api/category-og?${new URLSearchParams({
            title: `Latest ${title} Football News`,
          })}`,
          width: 1200,
          height: 630,
          alt: `${title} Football News, Rumors, and More`,
        },
      ],
    },
    canonical: `${SITE_URL}/${parentSlug}/${params.slug}`,
  }

  return <NextSeo {...updateMeta} useAppDir={true} />
}
