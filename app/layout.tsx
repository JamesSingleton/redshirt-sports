import './globals.css'

import { ClerkProvider } from '@clerk/nextjs'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
