import { getBaseUrl } from './get-base-url'
import { client } from './sanity/client'
import { queryGlobalSeoSettings } from './sanity/query'

import type { Metadata } from 'next'
import type { Maybe } from '@/types'

interface MetaDataInput {
  _type?: Maybe<string>
  _id?: Maybe<string>
  seoTitle?: Maybe<string>
  seoDescription?: Maybe<string>
  title?: Maybe<string>
  description?: Maybe<string>
  slug?: Maybe<string> | { current: Maybe<string> }
}

export async function getMetaData(data: MetaDataInput = {}): Promise<Metadata> {
  const { _type, seoDescription, seoTitle, slug, title, description, _id } = data ?? {}

  const globalSettings = await client.fetch(queryGlobalSeoSettings)
  const { siteTitle, siteDescription, socialLinks, defaultOpenGraphImage } = globalSettings || {}

  const baseUrl = getBaseUrl()
  const pageSlug = typeof slug === 'string' ? slug : (slug?.current ?? '')
  const pageUrl = `${baseUrl}${pageSlug}`

  const twitterHandle = socialLinks?.twitter
    ? `${socialLinks.twitter.split('/').pop()}`
    : '@_redshirtsports'

  const meta = {
    title: `${seoTitle ?? title}`,
    description: seoDescription ?? description ?? siteDescription,
  }

  const brandName = siteTitle || 'Redshirt Sports'

  return {
    title: `${meta.title} | ${brandName}`,
    description: meta.description,
    metadataBase: new URL(baseUrl),
    creator: brandName,
    icons: {
      icon: `${baseUrl}/favicon.ico`,
    },
    twitter: {
      card: 'summary_large_image',
      images: [],
      creator: twitterHandle,
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: 'website',
      countryName: 'US',
      description: meta.description,
      title: meta.title,
      url: pageUrl,
      siteName: brandName,
      images: [],
    },
  }
}
