import '@workspace/ui/globals.css'

import React, {Suspense} from 'react'
import { preconnect, prefetchDNS } from "react-dom";
import { Geist, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@workspace/ui/components/sonner'

import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header';
import { FooterServer, FooterSkeleton } from "@/components/footer";
import { SanityLive } from "@/lib/sanity/live";
import { constructMetadata } from '@/utils/construct-metadata';

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
  themeColor: '#DC2727',
}

export const metadata = constructMetadata()

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased flex min-h-screen flex-col`}>
        <Providers>
          <SiteHeader />
            <main className="flex-1">
              {children}
            </main>
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
