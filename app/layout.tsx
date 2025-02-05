import './globals.css'

import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

import { ThemeProvider } from '@/components/theme-provider'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export const metadata = constructMetadata()

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
