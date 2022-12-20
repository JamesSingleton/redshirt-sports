import Script from 'next/script'

import MetaDescription from '@components/common/MetaDescription'
import DefaultMetaTags from '@components/common/DefaultMetaTags'
import { Organization, WebSite } from '@lib/ldJson'

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

export default function Head() {
  return (
    <>
      <title>About Us | Redshirt Sports</title>
      <meta property="og:title" content="About Us | Redshirt Sports" />
      <DefaultMetaTags />
      <MetaDescription value="Launched in 2021, Redshirt Sports aims to be your go to source for all things FCS football. Learn about who we are the team that makes it all possible!" />
      <link rel="canonical" href="https://redshirtsports.com/about" />
      <meta property="og:url" content="https://redshirtsports.com/about" />
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
