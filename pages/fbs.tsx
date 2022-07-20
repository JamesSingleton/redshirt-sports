import { GetStaticProps } from 'next'
import Head from 'next/head'
import { NextSeo } from 'next-seo'

import { Layout } from '@components/common'
import { Card } from '@components/ui'
import { CategoryHeader } from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFBSPosts } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'

interface fbsProps {
  fbsPosts: Post[]
}

const FBS = ({ fbsPosts }: fbsProps) => {
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.redshirtsports.xyz/fbs/#webpage',
        url: 'https://www.redshirtsports.xyz/fbs',
        name: 'FBS Football - Redshirt Sports',
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        description:
          'All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision - Redshirt Sports',
        breadcrumb: {
          '@id': 'https://www.redshirtsports.xyz/fbs/#breadcrumb',
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: ['https://www.redshirtsports.xyz/fbs'],
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.redshirtsports.xyz/fbs/#breadcrumb',
        name: 'FBS Breadcrumbs',
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
              name: 'FBS',
            },
          },
        ],
      },
    ],
  }
  return (
    <>
      <Head>
        <script
          id="fbs-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
      </Head>
      <NextSeo
        title="FBS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision"
        canonical="https://www.redshirtsports.xyz/fbs"
        openGraph={{
          title: 'FBS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Bowl Subdivision',
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <div className="container mx-auto px-4 py-12 lg:py-24 xl:px-32">
        <div className="relative mb-4 flex flex-col">
          <CategoryHeader
            heading="FBS Football"
            subHeading="NCAA Division 1 Football Bowl Subdivision"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fbsPosts &&
            fbsPosts.map((post) => (
              <Card key={post.title} post={post} location="FBS" showExcerpt={true} />
            ))}
        </div>
      </div>
    </>
  )
}

FBS.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fbsPosts = await getClient().fetch(allFBSPosts)

  return {
    props: {
      fbsPosts,
    },
  }
}

export default FBS
