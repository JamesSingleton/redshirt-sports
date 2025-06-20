import '@workspace/ui/globals.css'

import React, { Suspense } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { Geist, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@workspace/ui/components/sonner'

import { Providers } from '@/components/providers'
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
      *[_type == "sportSubgrouping" && shortName == "FBS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      *[_type == "sportSubgrouping" && shortName == "FCS" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      *[_type == "division" && title == "Division II" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
      *[_type == "division" && title == "Division III" && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0][0]{
        _id, "name": name, "slug": slug.current, "type": "division",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current, shortName
        }
      },
    ],
    true => (
      *[_type == "sportSubgrouping"
          && ^._id in applicableSports[]._ref
          && count(*[_type == "conference" && references(^._id) && count(*[_type == "post" && references(^._id)]) > 0]) > 0
      ] | order(name asc) {
        _id, "name": coalesce(shortName, name), "slug": slug.current, "type": "subgrouping",
        "conferences": *[_type == "conference" && references(^._id) && ^.^._id in sports[]._ref && count(*[_type == "post" && references(^._id)]) > 0] | order(name asc) {
          _id, name, "slug": slug.current
        }
      } +
      *[_type == "division"
          && !(title == "FBS" || title == "FCS")
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <MegaNav sportsNav={navigationData} />
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
