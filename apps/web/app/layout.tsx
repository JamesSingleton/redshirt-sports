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
import { CombinedJsonLd } from '@/components/json-ld'

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
    query: `*[_type == "sport" && count(*[_type == "post" && references(^._id)]) > 0] | order(title asc) {
  _id,
  "name": title,
  "slug": slug.current,
  "groupings": select(
    slug.current == "football" => [
      // FBS specific entry
      *[_type == "sportSubgrouping" && shortName == "FBS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{ // Filter FBS by having conferences with posts
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      // FCS specific entry
      *[_type == "sportSubgrouping" && shortName == "FCS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{ // Filter FCS by having conferences with posts
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      // Division II specific entry
      *[_type == "division" && title == "Division II" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{ // Filter Division II by having conferences with posts
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      // Division III specific entry
      *[_type == "division" && title == "Division III" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{ // Filter Division III by having conferences with posts
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
    ],
    // Default grouping for all other sports
    true => (
      // sportSubgrouping part (remains the same)
      *[_type == "sportSubgrouping"
          && ^._id in applicableSports[]._ref
          && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0
      ] | order(name asc) {
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current
        }
      } +
      // MODIFIED DIVISION QUERY: Added conditional exclusion for "Division I"
      *[_type == "division"
          && !(title == "FBS" || title == "FCS") // Existing exclusion for old divisions
          // NEW EXCLUSION: Exclude "Division I" if the current sport is Men's or Women's Basketball
          && !(
              (title == "Division I")
              && (
                  ^.slug.current == "mens-basketball" || ^.slug.current == "womens-basketball"
              )
          )
          && count(*[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0]) > 0
      ] | order(name asc) {
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current
        }
      }
    )
  )
}`,
  })
}

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export const metadata: Metadata = constructMetadata()

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  preconnect('https://cdn.sanity.io')
  prefetchDNS('https://cdn.sanity.io')

  const { data: navigationData } = await fetchNavigationData()

  // console.log(JSON.stringify(navigationData, null, 2))
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          {/* <SiteHeader /> */}
          <MegaNav sportsNav={navigationData} />
          <main className="flex-1">{children}</main>
          {/* <Footer /> */}
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
