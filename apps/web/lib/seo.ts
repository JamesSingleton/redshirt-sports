import { stegaClean } from 'next-sanity'
import { getBaseUrl } from './get-base-url'
import { client } from './sanity/client'
import { queryGlobalSeoSettings } from './sanity/query'
import { urlFor } from './sanity/client'

import type { Metadata } from 'next'
import type { Maybe } from '@/types'

interface MetaDataInput {
  _type?: Maybe<string>
  _id?: Maybe<string>
  seoTitle?: Maybe<string>
  seoDescription?: Maybe<string>
  title?: Maybe<string>
  description?: Maybe<string>
  slug?: string
  authors?: any[]
  ogType?: Extract<Metadata['openGraph'], { type: string }>['type']
  image?: any
  readingTime?: Maybe<number>
}

function buildPageUrl({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`
  return `${baseUrl}${normalizedSlug}`
}

export async function getSEOMetadata(data: MetaDataInput = {}): Promise<Metadata> {
  const {
    seoDescription,
    seoTitle,
    slug = '/',
    title,
    description,
    authors,
    ogType,
    image,
    readingTime,
  } = data ?? {}

  const globalSettings = await client.fetch(
    queryGlobalSeoSettings,
    {},
    {
      stega: false,
    },
  )
  const { siteBrand, siteTitle, siteDescription, socialLinks, defaultOpenGraphImage } =
    globalSettings || {}

  const baseUrl = getBaseUrl()
  const pageUrl = buildPageUrl({ baseUrl, slug })

  const twitterHandle = socialLinks?.twitter
    ? `@${socialLinks.twitter.split('/').pop()}`
    : '@_redshirtsports'

  const authorTwitterHandle = authors?.[0]?.socialLinks?.twitter
    ? `@${authors[0]?.socialLinks?.twitter.split('/').pop()}`
    : twitterHandle

  const meta = {
    title: `${seoTitle ?? title ?? siteTitle}`,
    description: seoDescription ?? description ?? siteDescription,
  }

  const brandName = siteBrand || 'Redshirt Sports'

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
      images: [image ? urlFor(image).size(1200, 630).url() : defaultOpenGraphImage],
      site: twitterHandle,
      creator: authorTwitterHandle,
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: pageUrl,
      types: {
        'application/rss+xml': `${baseUrl}/api/rss/feed.xml`,
      },
    },
    openGraph: {
      type: ogType ?? 'website',
      countryName: 'en_US',
      description: meta.description,
      title: meta.title,
      url: pageUrl,
      siteName: brandName,
      images: [
        {
          url: image ? urlFor(image).size(1200, 630).url() : defaultOpenGraphImage,
          width: 1200,
          height: 630,
          alt: image ? image.alt : brandName,
          secureUrl: image ? urlFor(image).size(1200, 630).url() : defaultOpenGraphImage,
          type: 'image/jpeg',
        },
      ],
      ...(authors && authors.length > 0 && { authors: authors.map((author) => author.name) }),
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-snippet': -1,
        'max-video-preview': -1,
        'max-image-preview': 'large',
      },
    },
    ...(readingTime !== undefined &&
      readingTime !== null && {
        other: {
          'twitter:label1': 'Reading time',
          'twitter:data1': `${readingTime} minutes`,
        },
      }),
  }
}
