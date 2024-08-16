import { SpeedInsights } from '@vercel/speed-insights/next'
import PlausibleProvider from 'next-plausible'

import { SiteHeader } from '@/components/site-header'
import Footer from '@/components/site-footer'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PlausibleProvider domain="redshirtsports.xyz">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </PlausibleProvider>
      <SpeedInsights />
    </>
  )
}
