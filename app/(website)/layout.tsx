import '../globals.css'

import PlausibleProvider from 'next-plausible'

import { SiteHeader, Footer } from '@/components/common'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const layout = (
    <PlausibleProvider domain="redshirtsports.xyz">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </PlausibleProvider>
  )

  return layout
}
