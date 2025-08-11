'use client'

import { type ReactNode } from 'react'
import PlausibleProvider from 'next-plausible'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <NextThemesProvider attribute="class" disableTransitionOnChange enableColorScheme>
        {children}
      </NextThemesProvider>
    </PlausibleProvider>
  )
}
