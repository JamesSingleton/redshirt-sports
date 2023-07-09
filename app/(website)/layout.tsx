import '../globals.css'

import PlausibleProvider from 'next-plausible'

import { cal, inter } from '@styles/fonts'
import { cn } from '@lib/utils'
import { baseUrl } from '@lib/constants'
import { SiteHeader, Footer, TailwindIndicator, ThemeProvider } from '@components/common'

import type { Metadata } from 'next'
import buildRss from '@lib/build-rss'

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
      'application/json': '/feeds/feed.json',
      'application/atom+xml': '/feeds/atom.xml',
    },
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // await buildRss()
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            'flex min-h-screen flex-col bg-background font-sans antialiased',
            cal.variable,
            inter.variable
          )}
        >
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <Footer />
            <TailwindIndicator />
          </ThemeProvider>
        </body>
      </html>
    </PlausibleProvider>
  )
}
