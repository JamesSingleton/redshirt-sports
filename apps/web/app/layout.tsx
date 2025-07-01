import '@workspace/ui/globals.css'

import React, { Suspense } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { Geist, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@workspace/ui/components/sonner'

import { Providers } from '@/components/providers'
import { MegaNav } from '@/components/mega-nav'
import { FooterServer, FooterSkeleton } from '@/components/footer'
import { SanityLive, sanityFetch } from '@/lib/sanity/live'
import { CombinedJsonLd } from '@/components/json-ld'
import { NavbarServer, NavbarSkeleton } from '@/components/navbar'
import { globalNavigationQuery } from '@/lib/sanity/query'

import type { Metadata, Viewport } from 'next'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

async function fetchNavigationData() {
  return await sanityFetch({
    query: globalNavigationQuery,
  })
}

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  preconnect('https://cdn.sanity.io')
  prefetchDNS('https://cdn.sanity.io')

  const { data: navigationData } = await fetchNavigationData()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <Suspense fallback={<NavbarSkeleton />}>
            <MegaNav sportsNav={navigationData} />
            {/* <NavbarServer /> */}
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={<FooterSkeleton />}>
            <FooterServer />
          </Suspense>
        </Providers>
        <SpeedInsights />
        <Toaster />
        {/* <SanityLive /> */}
        <CombinedJsonLd />
      </body>
    </html>
  )
}
