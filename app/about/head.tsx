import Script from 'next/script'
import { NextSeo, NextSeoProps } from 'next-seo'

import MetaDescription from '@components/common/MetaDescription'
import { Organization, WebSite } from '@lib/ldJson'
import { NEXT_SEO_DEFAULT } from '@config/next-seo.config'
import { SITE_URL } from '@lib/constants'

const ldJsonContent = {
  '@context': 'http://schema.org',
  '@graph': [
    Organization,
    WebSite,
    {
      '@type': 'AboutPage',
      '@id': 'https://www.redshirtsports.xyz/about/#aboutpage',
      url: 'https://www.redshirtsports.xyz/about',
      name: 'About Us - Redshirt Sports',
      isPartOf: {
        '@id': 'https://www.redshirtsports.xyz/#website',
      },
      breadcrumb: {
        '@id': 'https://www.redshirtsports.xyz/about/#breadcrumb',
      },
      inLanguage: 'en-US',
      potentialAction: [
        {
          '@type': 'ReadAction',
          target: ['https://www.redshirtsports.xyz/about'],
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.redshirtsports.xyz/about/#breadcrumb',
      name: 'About Breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@id': 'https://www.redshirtsports.xyz',
            name: 'Home',
          },
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            name: 'About Redshirt Sports',
          },
        },
      ],
    },
  ],
}

const updateMeta: NextSeoProps = {
  ...NEXT_SEO_DEFAULT,
  title: 'About Us',
  description:
    'Launched in 2021, Redshirt Sports aims to be your go to source for all things FCS football. Learn about who we are the team that makes it all possible!',
  canonical: `${SITE_URL}/about`,
  openGraph: {
    ...NEXT_SEO_DEFAULT.openGraph,
    url: `${SITE_URL}/about`,
  },
}

export default function Head() {
  return (
    <>
      <NextSeo {...updateMeta} useAppDir={true} />
      <Script
        id="about-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(ldJsonContent),
        }}
      />
    </>
  )
}
