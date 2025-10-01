import '@redshirt-sports/ui/globals.css'

import React, { Suspense } from 'react'
import { preconnect, prefetchDNS } from 'react-dom'
import { Geist, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@redshirt-sports/ui/components/sonner'

import { Providers } from '@/components/providers'
import { FooterServer, FooterSkeleton } from '@/components/footer'
import { SanityLive } from '@redshirt-sports/sanity/live'
import { CombinedJsonLd } from '@/components/json-ld'
import { NavbarServer, NavbarSkeleton } from '@/components/navbar'

import type { Viewport } from 'next'

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const viewport: Viewport = {
  themeColor: '#E80022',
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  preconnect('https://cdn.sanity.io')
  prefetchDNS('https://cdn.sanity.io')

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} flex min-h-screen flex-col font-sans antialiased`}
      >
        <Providers>
          <Suspense fallback={<NavbarSkeleton />}>
            <NavbarServer />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Suspense fallback={<FooterSkeleton />}>
            <FooterServer />
          </Suspense>
        </Providers>
        <SpeedInsights />
        <Toaster />
        <SanityLive />
        <CombinedJsonLd />
      </body>
    </html>
  )
}
