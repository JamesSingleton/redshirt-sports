import { SpeedInsights } from '@vercel/speed-insights/next'
import PlausibleProvider from 'next-plausible'

import { SiteHeader } from '@/components/common/SiteHeader'
import Footer from '@/components/common/Footer'

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
