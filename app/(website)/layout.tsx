import '../globals.css'

import Script from 'next/script'
import PlausibleProvider from 'next-plausible'
import { WithContext, Organization } from 'schema-dts'

import { cal, inter } from '@styles/fonts'
import { cn } from '@lib/utils'
import { baseUrl } from '@lib/constants'
import { SiteHeader, Footer, TailwindIndicator, ThemeProvider } from '@components/common'

import type { Metadata } from 'next'

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
}

const jsonLd: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Redshirt Sports',
  url: baseUrl,
  logo: `${baseUrl}/api/og?title=Redshirt Sports`,
  sameAs: ['https://www.facebook.com/RedshirtSportsNews', 'https://twitter.com/_redshirtsports'],
  contactPoint: [
    // point to our contact page
    {
      '@type': 'ContactPoint',
      email: 'advertising@redshirtsports.xyz',
      contactType: 'advertising',
      url: `${baseUrl}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'editors@redshirtsports.xyz',
      contactType: 'editorial',
      url: `${baseUrl}/contact`,
    },
    {
      '@type': 'ContactPoint',
      email: 'contact@redshirtsports.xyz',
      contactType: 'general',
      url: `${baseUrl}/contact`,
    },
  ],
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: `${baseUrl}/search?q={search_term_string}`,
      query: 'required name=search_term_string',
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <Script
            id="default-ld-json"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
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
