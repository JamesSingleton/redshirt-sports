import '@workspace/ui/globals.css'

import React, { Suspense } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { Geist, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@workspace/ui/components/sonner'

import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import { MegaNav } from '@/components/mega-nav'
import { FooterServer, FooterSkeleton } from '@/components/footer'
import { SanityLive } from '@/lib/sanity/live'
import { constructMetadata } from '@/utils/construct-metadata'
import { sanityFetch } from '@/lib/sanity/live'

import type { Viewport } from 'next'

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
    query: `*[_type == "sport" && defined(*[_type == "post" && sport._ref == ^._id][0])] | order(title asc) {
  _id,
  "name": title,
  "slug": slug.current,
  "divisions": *[_type == "division"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    "conferences": *[_type == "conference"
      && defined(*[_type == "post"
        && ^._id in conferences[]._ref // Using 'conferences' array from post.ts
        && sport._ref == ^.^.^._id    // Using 'sport' field from post.ts
      ][0])
    ] | order(name asc) { // 'name' for conference is correct as per conference.ts
      _id,
      name,
      shortName,
      "slug": slug.current,
    },
    "hasConferences": defined(conferences) && length(conferences) > 0
  } [hasConferences == true] | order(name asc)
}`,
  })
}

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export const metadata = constructMetadata()

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  preconnect('https://cdn.sanity.io')
  prefetchDNS('https://cdn.sanity.io')

  // const { data: navigationData } = await fetchNavigationData()

  // console.log(JSON.stringify(navigationData, null, 2))
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          {/* <SiteHeader /> */}
          <MegaNav />
          <main className="flex-1">{children}</main>
          {/* <Footer /> */}
          <Suspense fallback={<FooterSkeleton />}>
            <FooterServer />
          </Suspense>
        </Providers>
        <SpeedInsights />
        <Toaster />
        <SanityLive />
      </body>
    </html>
  )
}
