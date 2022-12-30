import { NextSeo } from 'next-seo'

import { SITE_URL } from '@lib/constants'

export default function Head() {
  return (
    <NextSeo
      useAppDir={true}
      title="FBS Football News, Standings, Rumors"
      description="Check out all the coverage on NCAA Division 1 Football Bowl Subdivision written by the team here at Redshirt Sports!"
      canonical={`${SITE_URL}/fbs`}
      openGraph={{
        type: 'website',
        locale: 'en_US',
        url: `${SITE_URL}/fbs`,
        site_name: 'Redshirt Sports',
        images: [
          {
            url: `${SITE_URL}/api/category-og?${new URLSearchParams({
              title: 'Latest FBS Football News',
            })}`,
            width: 1200,
            height: 630,
            alt: 'FBS Football News, Standings, Rumors',
          },
        ],
      }}
      additionalLinkTags={[
        {
          rel: 'next',
          href: `${SITE_URL}/fbs/page/2`,
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
