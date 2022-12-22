import Script from 'next/script'

import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'
import { getTotalPosts } from '@lib/sanity.client'
import { Organization, WebSite } from '@lib/ldJson'

export default async function Head({ params }: { params: { page: string } }) {
  const totalPosts = await getTotalPosts('FCS')
  const totalPages = Math.ceil(totalPosts / 10)
  const { page } = params
  const prevPageUrl = page === '2' ? '/fcs' : `/fcs/page/${parseInt(page, 10) - 1}`
  const nextPageUrl = `/fcs/page/${parseInt(page, 10) + 1}`

  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.redshirtsports.xyz/fcs/#webpage',
        url: `https://www.redshirtsports.xyz/fcs/page/${parseInt(page, 10)}`,
        name: `FCS Football News, Rumors, and More - Page ${page} | Redshirt Sports`,
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        description: `Page ${page} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`,
        breadcrumb: {
          '@id': `https://www.redshirtsports.xyz/fcs/page/${parseInt(page, 10)}#breadcrumb`,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://www.redshirtsports.xyz/fcs/page/${parseInt(page, 10)}#breadcrumb`,
        name: 'FCS Breadcrumbs',
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
              name: 'FCS',
            },
          },
        ],
      },
    ],
  }
  return (
    <>
      <title>{`FCS Football News, Rumors, and More - Page ${page} | Redshirt Sports`}</title>
      <meta
        property="og:title"
        content={`FCS Football News, Rumors, and More - Page ${page} | Redshirt Sports`}
      />
      <DefaultMetaTags />
      <MetaDescription
        value={`Page ${page} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`}
      />
      <link rel="prev" href={`https://www.redshirtsports.xyz${prevPageUrl}`} />
      {parseInt(page, 10) < totalPages && (
        <link rel="next" href={`https://www.redshirtsports.xyz${nextPageUrl}`} />
      )}
      <meta property="og:url" content={`https://www.redshirtsports.xyz/fcs/page/${page}`} />
      <Script
        id={`fcs-ld-json-page-${page}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJsonContent) }}
      />
    </>
  )
}
