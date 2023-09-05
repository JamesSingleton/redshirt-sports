import '../globals.css'

import dynamic from 'next/dynamic'
import { draftMode } from 'next/headers'
import PlausibleProvider from 'next-plausible'

import { token } from '@lib/sanity.fetch'
import { SiteHeader, Footer, TailwindIndicator, ThemeProvider } from '@components/common'
import { PreviewBanner } from '@components/preview/PreviewBanner'

const PreviewProvider = dynamic(() => import('@components/preview/PreviewProvider'))

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDraftMode = draftMode().isEnabled
  const layout = (
    <PlausibleProvider domain="redshirtsports.xyz">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {isDraftMode && <PreviewBanner />}
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <TailwindIndicator />
      </ThemeProvider>
    </PlausibleProvider>
  )
  if (isDraftMode) {
    return <PreviewProvider token={token!}>{layout}</PreviewProvider>
  }

  return layout
}
