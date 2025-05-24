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
    query: `*[_type == "sport"] | order(title asc) {
  _id,
  "name": title,
  "slug": slug.current,
  "groupings": select(
    slug.current == "football" => [
      // FBS specific entry
      *[_type == "sportSubgrouping" && slug.current == "fbs"][0]{
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping", "designationType": designationType,
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      },
      // FCS specific entry
      *[_type == "sportSubgrouping" && slug.current == "fcs"][0]{
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping", "designationType": designationType,
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      },
      // Division II specific entry
      *[_type == "division" && name == "Division II"][0]{
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      },
      // Division III specific entry
      *[_type == "division" && name == "Division III"][0]{
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      },
      // NAIA specific entry
      *[_type == "division" && name == "NAIA"][0]{
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      }
    ],
    // Default grouping for all other sports
    true => (
      *[_type == "sportSubgrouping" && references(^._id) && ^._id in applicableSports[]._ref] | order(name asc) {
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping", designationType,
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      } +
      *[_type == "division" && references(^._id)] | order(name asc) {
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref] | order(name asc) { _id, name, "slug": slug.current }
      }
    )
  )
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

  const { data: navigationData } = await fetchNavigationData()

  console.log(JSON.stringify(navigationData, null, 2))
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
