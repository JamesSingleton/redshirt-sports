import { getBaseUrl } from '@/lib/get-base-url'

import { type Metadata } from 'next'

export function constructMetadata({
  title = `${process.env.NEXT_PUBLIC_APP_NAME} - Comprehensive FCS, FBS, D2, D3 Football Coverage`,
  description = `${process.env.NEXT_PUBLIC_APP_NAME} brings you the latest in FCS football, Top 25 voting, and transfer news. Get insights and updates on FBS, D2, and D3 football as well.`,
  image = 'https://cdn.sanity.io/images/8pbt9f8w/production/429b65d83baa82c7178798a398fdf3ee28972fe6-1200x630.png',
  canonical = '/',
  ogType = 'website',
}: {
  title?: string
  description?: string
  image?: string | null
  icons?: Metadata['icons']
  canonical?: string
  ogType?:
    | 'website'
    | 'article'
    | 'book'
    | 'profile'
    | 'music.song'
    | 'music.album'
    | 'music.playlist'
    | 'music.radio_station'
    | 'video.movie'
    | 'video.episode'
    | 'video.tv_show'
    | 'video.other'
    | undefined
} = {}): Metadata {
  const baseUrl = getBaseUrl()
  return {
    title,
    description,
    openGraph: {
      siteName: process.env.NEXT_PUBLIC_APP_NAME,
      title,
      type: ogType,
      description,
      url: canonical,
      ...(image && {
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
          },
        ],
      }),
    },
    twitter: {
      title,
      description,
      ...(image && {
        card: 'summary_large_image',
        images: [image],
      }),
      site: '@_redshirtsports',
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: new URL(canonical, baseUrl).toString(),
      types: {
        'application/rss+xml': new URL('/api/rss/feed.xml', baseUrl).toString(),
      },
    },
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
  }
}
