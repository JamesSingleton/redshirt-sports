import '../globals.css'

import dynamic from 'next/dynamic'
import { draftMode } from 'next/headers'
import PlausibleProvider from 'next-plausible'

import { baseUrl } from '@lib/constants'
import { token } from '@lib/sanity.fetch'
import { SiteHeader, Footer, TailwindIndicator, ThemeProvider } from '@components/common'

import type { Metadata } from 'next'

const PreviewProvider = dynamic(() => import('@components/preview/PreviewProvider'))

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | Redshirt Sports',
    default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
  },
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  openGraph: {
    title: {
      template: '%s | Redshirt Sports',
      default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
    },
    description:
      'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Redshirt Sports',
    images: [
      {
        url: '/api/og?title=Redshirt Sports',
        width: '1200',
        height: '630',
        alt: 'Redshirt Sports Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    creator: '@_redshirtsports',
    description:
      'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
    title: {
      template: '%s | Redshirt Sports',
      default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
    },
    card: 'summary_large_image',
  },
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
    canonical: '/',
    types: {
      'application/rss+xml': '/feeds/feed.xml',
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDraftMode = draftMode().isEnabled
  const layout = (
    <PlausibleProvider domain="redshirtsports.xyz">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <TailwindIndicator />
      </ThemeProvider>
    </PlausibleProvider>
  )
  if (isDraftMode) {
    return <PreviewProvider token={token!}>{layout}</PreviewProvider>
  }

  return layout
}
