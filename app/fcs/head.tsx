import { NextSeo } from 'next-seo'

import { SITE_URL } from '@lib/constants'

export default function Head() {
  return (
    <NextSeo
      useAppDir={true}
      title="FCS Football News, Rumors, and More"
      description="Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!"
      openGraph={{
        type: 'website',
        locale: 'en_US',
        url: `${SITE_URL}/fcs`,
        site_name: 'Redshirt Sports',
        images: [
          {
            url: `${SITE_URL}/api/category-og?${new URLSearchParams({
              title: 'Latest FCS Football News',
            })}`,
            width: 1200,
            height: 630,
            alt: 'FCS Football News, Rumors, and More',
          },
        ],
      }}
      canonical={`${SITE_URL}/fcs`}
      additionalLinkTags={[
        {
          rel: 'next',
          href: `${SITE_URL}/fcs/page/2`,
        },
      ]}
      twitter={{
        handle: '@RedshirtSports',
        site: '@RedshirtSports',
        cardType: 'summary_large_image',
      }}
    />
  )
}
