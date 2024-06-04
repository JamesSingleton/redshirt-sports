import '../globals.css'

import PlausibleProvider from 'next-plausible'

import { SiteHeader, Footer, ThemeProvider } from '@/components/common'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const layout = (
    <PlausibleProvider domain="redshirtsports.xyz">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </ThemeProvider>
    </PlausibleProvider>
  )

  return layout
}
