import { getBaseUrl } from './get-base-url'
import { urlFor } from '@redshirt-sports/sanity/client'

import type { Metadata } from 'next'

interface MetaDataInput {
  _type?: string
  _id?: string
  seoTitle?: string
  seoDescription?: string
  title?: string
  description?: string
  slug?: string
  authors?: any[]
  ogType?: Extract<Metadata['openGraph'], { type: string }>['type']
  image?: any
  readingTime?: number
}

const defaultOpenGraphImage =
  'https://cdn.sanity.io/images/8pbt9f8w/production/6d97679ef6ed2b82dafaf9227080944158b4263d-1200x630.png'

function buildPageUrl({ baseUrl, slug }: { baseUrl: string; slug: string }) {
  const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`
  return `${baseUrl}${normalizedSlug}`
}

export function getSEOMetadata(data: MetaDataInput = {}): Metadata {
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

  const baseUrl = getBaseUrl()
  const pageUrl = buildPageUrl({ baseUrl, slug })

  const twitterHandle = '@_redshirtsports'

  const authorTwitterHandle = authors?.[0]?.socialLinks?.twitter
    ? `@${authors[0]?.socialLinks?.twitter.split('/').pop()}`
    : twitterHandle

  const meta = {
    title: `${seoTitle ?? title ?? 'College Sports News & Analysis at All Levels'}`,
    description:
      seoDescription ??
      description ??
      'Redshirt Sports is your go to resource for comprehensive college football and basketball coverage. Get in-depth analysis and insights across all NCAA divisions.',
  }

  const brandName = 'Redshirt Sports'

  return {
    title: `${meta.title} | ${brandName}`,
    description: meta.description,
    metadataBase: new URL(baseUrl),
    creator: brandName,
    icons: {
      icon: [
        {
          url: '/icon1.png',
          sizes: '16x16',
        },
        {
          url: '/icon2.png',
          sizes: '32x32',
        },
      ],
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
