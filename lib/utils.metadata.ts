import { urlForImage } from '@lib/sanity.image'
import { defaultTitle, baseUrl } from '@lib/constants'

import type { Metadata } from 'next'
import type { MainImage } from '@types'

export function defineMetadata({
  baseTitle,
  description,
  image,
  title,
  url,
  canonical,
}: {
  baseTitle?: string
  description?: string
  image?: MainImage
  title?: string
  url?: string
  canonical?: string
}) {
  const metaTitle = [...(title ? [title] : []), ...(baseTitle ? [baseTitle] : [])].join(' | ')

  const imageUrl = image && urlForImage(image)?.width(1200).height(627).fit('crop').url()

  return {
    metadataBase: new URL(baseUrl),
    title: metaTitle || defaultTitle,
    description,
    themeColor: '#DC2727',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    publisher: 'Redshirt Sports',
    alternates: {
      canonical: canonical || '/',
      types: {
        'application/rss+xml': '/feeds/feed.xml',
      },
    },
    openGraph: {
      title: metaTitle || defaultTitle,
      description,
      type: 'website',
      images: imageUrl
        ? [imageUrl]
        : [
            {
              url: `/api/og?title=${encodeURIComponent('Redshirt Sports')}`,
              width: '1200',
              height: '630',
              alt: 'Redshirt Sports Logo',
            },
          ],
      url: url || baseUrl,
      locale: 'en_US',
      siteName: 'Redshirt Sports',
    },
    twitter: {
      creator: '@_redshirtsports',
      site: '@redshirtsports',
      card: 'summary_large_image',
      title: metaTitle || defaultTitle,
      description,
    },
  } satisfies Metadata
}
