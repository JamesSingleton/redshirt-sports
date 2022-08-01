import { useState } from 'react'
import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/solid'

import { Layout, SocialMediaFollow } from '@components/common'
import { HorizontalCard } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { fcsPostsQuery } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'

interface fcsProps {
  posts: Post[]
  pagination: {
    totalPosts: number
    currentPage: number
  }
}

const FCS = ({ posts, pagination }: fcsProps) => {
  const [pageIndex, setPageIndex] = useState(0)
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'CollectionPage',
        '@id': 'https://www.redshirtsports.xyz/fcs/#webpage',
        url: 'https://www.redshirtsports.xyz/fcs',
        name: 'FCS Football - Redshirt Sports',
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        description:
          'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
        breadcrumb: {
          '@id': 'https://www.redshirtsports.xyz/fcs/#breadcrumb',
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: ['https://www.redshirtsports.xyz/fcs'],
          },
        ],
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
      </Head>
      <NextSeo
        title="FCS Football"
        description="Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!"
        canonical="https://www.redshirtsports.xyz/fcs"
        openGraph={{
          title: 'FCS Football - Redshirt Sports',
          description:
            'Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!',
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <Layout>
        <section className="bg-slate-50 py-12 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
            <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
              <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
                <div className="mt-6 text-center md:mt-0 md:text-left">
                  <span className="block text-xs uppercase tracking-widest text-brand-500">
                    Recent in
                  </span>
                  <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:text-5xl lg:leading-tight">
                    FCS Football
                  </h1>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <nav
                  aria-label="breadcrumb"
                  title="breadcrumb"
                  className="flex items-center text-sm"
                >
                  <ol role="list" className="flex items-center space-x-4">
                    <li>
                      <div>
                        <Link href="/" prefetch={false}>
                          <a className="text-slate-400 hover:text-slate-500">
                            <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span className="sr-only">Home</span>
                          </a>
                        </Link>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <ChevronRightIcon
                          className="h-5 w-5 flex-shrink-0 text-slate-400"
                          aria-hidden="true"
                        />
                        <Link href="/fcs" prefetch={false}>
                          <a
                            className="ml-4 text-sm font-medium text-slate-500 hover:text-slate-700"
                            aria-current="page"
                          >
                            FCS
                          </a>
                        </Link>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
          <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
            <div className="col-span-2">
              {posts.map((post) => (
                <HorizontalCard post={post} key={post._id} />
              ))}
              <nav
                className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
                aria-label="Pagination"
              >
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{' '}
                    <span className="font-medium">10</span> of{' '}
                    <span className="font-medium">{pagination.totalPosts}</span> results
                  </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end">
                  <Link href={`/fcs?page=${pageIndex - 1}`}>
                    <a className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Previous
                    </a>
                  </Link>
                  <Link href={`/fcs?page=${pageIndex + 1}`}>
                    <a className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                      Next
                    </a>
                  </Link>
                </div>
              </nav>
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

FCS.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const { posts, pagination } = await sanityClient.fetch(fcsPostsQuery, {
    pageIndex: 0,
  })

  return {
    props: {
      posts,
      pagination,
    },
  }
}

export default FCS
