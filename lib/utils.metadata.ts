import { defaultTitle, baseUrl } from '@lib/constants'

import type { Metadata } from 'next'

export function defineMetadata({ description, title }: { description?: string; title?: string }) {
  const baseTitle = 'Redshirt Sports'
  const metaTitle = [...(title ? [title] : []), ...(baseTitle ? [baseTitle] : [])].join(' | ')

  return {
    metadataBase: new URL(baseUrl),
    title: metaTitle || defaultTitle,
    description,
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
      canonical: '/',
      types: {
        'application/rss+xml': '/feeds/feed.xml',
      },
    },
    openGraph: {
      title: metaTitle || defaultTitle,
      description,
      type: 'website',
      locale: 'en_US',
      siteName: 'Redshirt Sports',
      url: '/',
    },
    twitter: {
      creator: '@_redshirtsports',
      site: '@_redshirtsports',
      card: 'summary_large_image',
      title: metaTitle || defaultTitle,
      description,
    },
  } satisfies Metadata
}
