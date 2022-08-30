import { GetStaticProps } from 'next'
import Head from 'next/head'

import { Layout, SocialMediaFollow, SEO } from '@components/common'
import { ArticleList, CategoryHeader } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { fcsPostsQuery } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'

interface fcsProps {
  posts: Post[]
  totalPosts: number
  totalPages: number
  currentPage: string
}

const breadCrumbPages = [
  {
    name: 'FCS',
    href: '/fcs',
  },
]

const FCS = ({ posts, totalPosts, totalPages, currentPage }: fcsProps) => {
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.redshirtsports.xyz/fcs/#webpage',
        url: 'https://www.redshirtsports.xyz/fcs',
        name: 'FCS Football News, Rumors, and More | Redshirt Sports',
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        description:
          'Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!',
        breadcrumb: {
          '@id': 'https://www.redshirtsports.xyz/fcs/#breadcrumb',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.redshirtsports.xyz/fcs/#breadcrumb',
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
      <Head>
        <script
          id="fcs-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
        <link rel="next" href={`https://www.redshirtsports.xyz/fcs/page/2`} />
      </Head>
      <SEO
        title="FCS Football News, Rumors, and More"
        description="Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!"
        canonical="https://www.redshirtsports.xyz/fcs"
        openGraph={{
          title: 'FCS Football News, Rumors, and More | Redshirt Sports',
          description:
            'Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!',
          url: 'https://www.redshirtsports.xyz/fcs',
        }}
      />
      <Layout>
        <CategoryHeader
          title="Latest FCS News"
          aboveTitle="Football Championship Subdivision"
          breadCrumbPages={breadCrumbPages}
        />
        <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
          <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
            <div className="col-span-2">
              <ArticleList
                articles={posts}
                totalPages={totalPages}
                totalPosts={totalPosts}
                currentPage={currentPage}
              />
            </div>
            <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
              <SocialMediaFollow />
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const { posts, totalPosts } = await sanityClient.fetch(fcsPostsQuery, {
    pageIndex: 1,
  })
  const totalPages = Math.ceil(totalPosts / 10)

  return {
    props: {
      posts,
      totalPosts,
      totalPages,
      currentPage: '1',
    },
  }
}

export default FCS
