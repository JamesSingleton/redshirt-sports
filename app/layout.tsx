import { Inter, Archivo_Narrow, Archivo } from '@next/font/google'
import PlausibleProvider from 'next-plausible'
import { NextSeo, OrganizationJsonLd } from 'next-seo'

import { Footer, Navbar } from '@components/common'
import { SITE_URL } from '@lib/constants'
import { NEXT_SEO_DEFAULT } from '@config/next-seo.config'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const archivoNarrow = Archivo_Narrow({ subsets: ['latin'], variable: '--font-archivo-narrow' })
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <html
        lang="en-US"
        className={`${inter.variable} ${archivoNarrow.variable} ${archivo.variable}`}
      >
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0" />
          <NextSeo useAppDir={true} titleTemplate="%s | Redshirt Sports" />
        </head>
        <body className="bg-white text-slate-600 antialiased">
          <Navbar />
          {children}
          <Footer />
        </body>
      </html>
    </PlausibleProvider>
  )
}
