import Script from 'next/script'

import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'
import { getTotalPosts } from '@lib/sanity.client'
import { SUBDIVISIONS, SITE_URL } from '@lib/constants'
import { Organization, WebSite } from '@lib/ldJson'

export default async function Head({ params }: { params: { page: string } }) {
  const totalPosts = await getTotalPosts('FBS')
  const totalPages = Math.ceil(totalPosts / 10)
  const { page } = params
  const prevPageUrl =
    page === '2' ? `/${SUBDIVISIONS.fbs}` : `/${SUBDIVISIONS.fbs}/page/${parseInt(page, 10) - 1}`
  const nextPageUrl = `/${SUBDIVISIONS.fbs}/page/${parseInt(page, 10) + 1}`

  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/${SUBDIVISIONS.fbs}/#webpage`,
        url: `${SITE_URL}/${SUBDIVISIONS.fbs}/page/${parseInt(page, 10)}`,
        name: `FBS Football News, Rumors, and More - Page ${page} | Redshirt Sports`,
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
        description: `Page ${page} of coverage on NCAA Division 1 Football Bowl Subdivision written by the team here at Redshirt Sports!`,
        breadcrumb: {
          '@id': `${SITE_URL}/${SUBDIVISIONS.fbs}/page/${parseInt(page, 10)}#breadcrumb`,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/${SUBDIVISIONS.fbs}/page/${parseInt(page, 10)}#breadcrumb`,
        name: 'FBS Breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@id': SITE_URL,
              name: 'Home',
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              name: SUBDIVISIONS.fbs.toUpperCase(),
            },
          },
        ],
      },
    ],
  }
  return (
    <>
      <title>{`FBS Football News, Rumors, and More - Page ${page} | Redshirt Sports`}</title>
      <meta
        property="og:title"
        content={`FBS Football News, Rumors, and More - Page ${page} | Redshirt Sports`}
      />
      <DefaultMetaTags />
      <MetaDescription
        value={`Page ${page} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`}
      />
      <link rel="prev" href={`${SITE_URL}${prevPageUrl}`} />
      {parseInt(page, 10) < totalPages && <link rel="next" href={`${SITE_URL}${nextPageUrl}`} />}
      <meta property="og:url" content={`${SITE_URL}/${SUBDIVISIONS.fbs}/page/${page}`} />
      <Script
        id={`fbs-ld-json-page-${page}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJsonContent) }}
      />
    </>
  )
}
