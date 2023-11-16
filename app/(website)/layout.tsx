import '../globals.css'

import { draftMode } from 'next/headers'
import PlausibleProvider from 'next-plausible'

import { SiteHeader, Footer, TailwindIndicator, ThemeProvider } from '@components/common'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDraftMode = draftMode().isEnabled
  const layout = (
    <PlausibleProvider domain="redshirtsports.xyz">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <TailwindIndicator />
      </ThemeProvider>
    </PlausibleProvider>
  )

  return layout
}
