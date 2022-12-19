import { GetStaticProps } from 'next'
import Head from 'next/head'

import { SocialMediaFollow } from '@components/common'
import SEO from '@components/common/SEO'
import { ArticleList, CategoryHeader } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { fetchTotalPosts, fcsPostsQuery } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'
import type { ParsedUrlQuery } from 'querystring'

interface PaginatedCategoryPageProps {
  posts: Post[]
  currentPage: string
  totalPages: number
  totalPosts: number
}

interface Params extends ParsedUrlQuery {
  page: string
}

const breadCrumbPages = [
  {
    name: 'FCS',
    href: '/fcs',
  },
]

export default function PaginatedCategoryPage({
  posts,
  currentPage,
  totalPages,
  totalPosts,
}: PaginatedCategoryPageProps) {
  const prevPageUrl = currentPage === '2' ? '/fcs' : `/fcs/page/${parseInt(currentPage, 10) - 1}`
  const nextPageUrl = `/fcs/page/${parseInt(currentPage, 10) + 1}`

  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.redshirtsports.xyz/fcs/#webpage',
        url: `https://www.redshirtsports.xyz/fcs/page/${parseInt(currentPage, 10)}`,
        name: `FCS Football News, Rumors, and More - Page ${currentPage} | Redshirt Sports`,
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        description: `Page ${currentPage} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`,
        breadcrumb: {
          '@id': `https://www.redshirtsports.xyz/fcs/page/${parseInt(currentPage, 10)}#breadcrumb`,
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://www.redshirtsports.xyz/fcs/page/${parseInt(currentPage, 10)}#breadcrumb`,
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
          id={`fcs-page-${parseInt(currentPage, 10)}-ld-json`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
        <link rel="prev" href={`https://www.redshirtsports.xyz${prevPageUrl}`} />
        {parseInt(currentPage, 10) < totalPages && (
          <link rel="next" href={`https://www.redshirtsports.xyz${nextPageUrl}`} />
        )}
      </Head>
      <SEO
        title={`FCS Football News, Rumors, and More - Page ${currentPage}`}
        description={`Page ${currentPage} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`}
        canonical={`https://www.redshirtsports.xyz/fcs/page/${parseInt(currentPage, 10)}`}
        openGraph={{
          title: `FCS Football News, Rumors, and More - Page ${currentPage} | Redshirt Sports`,
          description: `Page ${currentPage} of coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!`,
          url: `https://www.redshirtsports.xyz/fcs/page/${parseInt(currentPage, 10)}`,
        }}
      />
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
    </>
  )
}

export async function getStaticPaths() {
  const totalPosts = await sanityClient.fetch(fetchTotalPosts, {
    category: 'FCS',
  })
  const totalPages = Math.ceil(totalPosts / 10)

  const paths = []

  /**
   * Start from page 2, so we don't replicate /blog
   * which is page 1
   */
  for (let page = 2; page <= totalPages; page++) {
    paths.push({ params: { page: page.toString() } })
  }

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { page } = params as Params
  const { posts, totalPosts } = await sanityClient.fetch(fcsPostsQuery, {
    pageIndex: parseInt(page, 10),
  })
  const totalPages = Math.ceil(totalPosts / 10)

  return {
    props: {
      posts,
      currentPage: page,
      totalPages,
      totalPosts,
    },
  }
}
