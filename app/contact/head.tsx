import Script from 'next/script'

import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'
import { Organization, WebSite } from '@lib/ldJson'

const ldJsonContent = {
  '@context': 'http://schema.org',
  '@graph': [
    Organization,
    WebSite,
    {
      '@type': 'ContactPage',
      '@id': 'https://www.redshirtsports.xyz/contact/#contactpage',
      url: 'https://www.redshirtsports.xyz/contact',
      name: 'Contact Us - Redshirt Sports',
      isPartOf: {
        '@id': 'https://www.redshirtsports.xyz/#website',
      },
      breadcrumb: { '@id': 'https://www.redshirtsports.xyz/contact/#breadcrumb' },
      inLanguage: 'en-US',
      potentialAction: [
        {
          '@type': 'ReadAction',
          target: ['https://www.redshirtsports.xyz/contact'],
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': 'https://www.redshirtsports.xyz/contact/#breadcrumb',
      name: 'Contact Us Breadcrumbs',
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
            name: 'Contact Us',
          },
        },
      ],
    },
  ],
}
export default function Head() {
  return (
    <>
      <DefaultMetaTags />
      <title>Contact Us | Redshirt Sports</title>
      <meta property="og:title" content="Contact Us | Redshirt Sports" />
      <MetaDescription value="Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz." />
      <link rel="canonical" href="https://redshirtsports.com/contact" />
      <meta property="og:url" content="https://redshirtsports.com/contact" />
      <Script
        id="contact-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJsonContent) }}
      />
    </>
  )
}
