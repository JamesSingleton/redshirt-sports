import { GetStaticProps } from 'next'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/solid'

import { Layout } from '@components/common'
import { Card, Pagination } from '@components/ui'
import { CategoryHeader, EmptyState } from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFCSPosts, fcsPostsQuery } from '@lib/queries'

import type { Post } from '@types'

interface fcsProps {
  posts: Post[]
}

const FCS = ({ posts }: fcsProps) => {
  return (
    <Layout>
      <NextSeo
        title="FCS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision"
        canonical="https://www.redshirtsports.xyz/fcs"
        openGraph={{
          title: 'FCS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision',
        }}
      />
      <section className="bg-slate-50 py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
              <div className="mt-6 text-center md:mt-0 md:text-left">
                <span className="block text-xs uppercase tracking-widest text-brand-500">
                  Recent in
                </span>
                <h1 className="mt-1 text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:text-5xl lg:leading-tight">
                  FCS Football
                </h1>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <nav aria-label="breadcrumb" className="flex items-center text-sm">
                <ol role="list" className="flex items-center space-x-4">
                  <li>
                    <div>
                      <Link href="/">
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
                      <Link href="/fcs">
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
    </Layout>
  )
}

FCS.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { posts } = await getClient().fetch(fcsPostsQuery, {
    pageIndex: 0,
  })

  return {
    props: {
      posts,
    },
  }
}

export default FCS
