import { SITE_URL } from '@lib/constants'
import type { NextSeoProps } from 'next-seo'

export const NEXT_SEO_DEFAULT: NextSeoProps = {
  // title: 'FCS Football News, Standings, Rumors, and More',
  titleTemplate: '%s | Redshirt Sports',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Redshirt Sports',
    // images: [
    //   {
    //     url: `${SITE_URL}/images/icons/RS_horizontal_513x512.png`,
    //     width: 513,
    //     height: 512,
    //     alt: 'Redshirt Sports Logo',
    //     type: 'image/png',
    //     secureUrl: `${SITE_URL}/images/icons/RS_horizontal_513x512.png`,
    //   },
    // ],
  },
  twitter: {
    handle: '@_redshirtsports',
    site: '@_redshirtsports',
    cardType: 'summary_large_image',
  },
  themeColor: '#DC2727',
  robotsProps: {
    maxSnippet: -1,
    maxImagePreview: 'large',
    maxVideoPreview: -1,
  },
  additionalMetaTags: [
    {
      name: 'msapplication-TileColor',
      content: '#DC2727',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: '/feeds/feed.xml',
    },
    {
      rel: 'alternate',
      type: 'application/atom+xml',
      href: '/feeds/atom.xml',
    },
    {
      rel: 'alternate',
      type: 'application/json',
      href: '/feeds/feed.json',
    },
    {
      rel: 'apple-touch-icon',
      href: '/images/icons/RS_192.png',
    },
  ],
}
