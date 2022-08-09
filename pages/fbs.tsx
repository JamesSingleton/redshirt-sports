import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import ChevronRightIcon from '@heroicons/react/solid/ChevronRightIcon'
import HomeIcon from '@heroicons/react/solid/HomeIcon'
import { usePlausible } from 'next-plausible'

import { Layout, SocialMediaFollow } from '@components/common'
import { HorizontalCard } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { allFBSPosts } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'

interface fbsProps {
  fbsPosts: Post[]
}

const FBS = ({ fbsPosts }: fbsProps) => {
  const plausible = usePlausible()
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
        description="Check out all the coverage on NCAA Division 1 Football Bowl Subdivision written by the team here at Redshirt Sports!"
        canonical="https://www.redshirtsports.xyz/fbs"
        openGraph={{
          title: 'FBS Football - Redshirt Sports',
          description:
            'Check out all the coverage on NCAA Division 1 Football Bowl Subdivision written by the team here at Redshirt Sports!',
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
                    FBS Football
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
                          <a
                            onClick={() =>
                              plausible('clickOnBreadCrumb', {
                                props: {
                                  location: 'Home',
                                },
                              })
                            }
                            className="text-slate-400 hover:text-slate-500"
                          >
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
                        <Link href="/fbs" prefetch={false}>
                          <a
                            onClick={() =>
                              plausible('clickOnBreadCrumb', {
                                props: {
                                  location: 'FBS',
                                },
                              })
                            }
                            className="ml-4 text-sm font-medium text-slate-500 hover:text-slate-700"
                            aria-current="page"
                          >
                            FBS
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
              {fbsPosts.map((post) => (
                <HorizontalCard post={post} key={post._id} articleLocation="FBS Page" />
              ))}
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fbsPosts = await sanityClient.fetch(allFBSPosts)

  return {
    props: {
      fbsPosts,
    },
  }
}

export default FBS
