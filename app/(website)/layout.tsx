import PlausibleProvider from 'next-plausible'

import Navbar from '@components/common/Navbar/Navbar'
import Footer from '@components/common/Footer/Footer'

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
        url: '/images/icons/RS_horizontal_513x512.png',
        width: '513',
        height: '512',
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

export default function IndexLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider domain="redshirtsports.xyz">
      <Navbar />
      <main className="loading antialiased">{children}</main>
      <Footer />
    </PlausibleProvider>
  )
}
