import { NextSeo } from 'next-seo'

import { NEXT_SEO_DEFAULT } from '@config/next-seo.config'
import { SITE_URL } from '@lib/constants'

export default function Head() {
  return (
    <NextSeo
      useAppDir={true}
      {...NEXT_SEO_DEFAULT}
      title="College Football News, Standings, Rumors, and More"
      description="Check out all the coverage on NCAA Division 1 Football written by the team here at Redshirt Sports!"
      openGraph={{
        images: [
          {
            url: `${SITE_URL}/api/og`,
            width: 1200,
            height: 630,
            alt: 'College Football News, Standings, Rumors, and More',
          },
        ],
      }}
    />
  )
}
