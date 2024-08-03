import { HOME_DOMAIN } from '@/lib/constants'

import { type Metadata } from 'next'

export function constructMetadata({
  title = `${process.env.NEXT_PUBLIC_APP_NAME} - Comprehensive FCS, FBS, D2, D3 Football Coverage`,
  description = `${process.env.NEXT_PUBLIC_APP_NAME} brings you the latest in FCS football, Top 25 voting, and transfer news. Get insights and updates on FBS, D2, and D3 football as well.`,
  image = 'https://assets.dub.co/thumbnail.jpg',
  icons = [
    {
      rel: 'apple-touch-icon',
      sizes: '32x32',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
  ],
  noIndex = false,
}: {
  title?: string
  description?: string
  image?: string | null
  icons?: Metadata['icons']
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image && {
        images: [
          {
            url: image,
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
      creator: '@_redshirtsports',
    },
    icons,
    metadataBase: new URL(HOME_DOMAIN),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }
}
