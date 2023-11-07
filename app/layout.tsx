import './globals.css'

import { GeistSans, GeistMono } from 'geist/font'
import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#DC2727',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
