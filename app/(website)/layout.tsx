import PlausibleProvider from 'next-plausible'

import { Header } from '@components/common/Navbar/Navbar'
import Footer from '@components/common/Footer/Footer'
import { getCategories } from '@lib/sanity.client'

export const metadata = {
  metadataBase: new URL('https://www.redshirtsports.xyz'),
  title: {
    template: '%s | Redshirt Sports',
    default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
  },
  description:
    'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
  openGraph: {
    title: {
      template: '%s | Redshirt Sports',
      default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
    },
    description:
      'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
    locale: 'en_US',
    url: 'https://www.redshirtsports.xyz',
    siteName: 'Redshirt Sports',
    images: [
      {
        url: '/api/og?title=Redshirt Sports',
        width: '1200',
        height: '630',
        alt: 'Redshirt Sports Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    creator: '@_redshirtsports',
    description:
      'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
    title: {
      template: '%s | Redshirt Sports',
      default: 'FCS Football News, Standings, Rumors | Redshirt Sports',
    },
    card: 'summary_large_image',
  },
  themeColor: '#DC2727',
}

export default async function IndexLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories()

  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Header categories={categories} />
      <main className="loading mt-12 antialiased">{children}</main>
      <Footer />
    </PlausibleProvider>
  )
}
