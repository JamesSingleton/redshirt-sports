import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { SocialMediaFollow, SEO } from '@components/common'
import { PageHeader, HorizontalCard } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { searchQuery } from '@lib/queries'
import { Organization, WebSite } from '@lib/ldJson'

import type { Post } from '@types'

interface SearchProps {
  posts: Post[]
}

const Search = ({ posts }: SearchProps) => {
  const {
    query: { query },
  } = useRouter()
  const searchResultsLength = posts.length
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': ['CollectionPage', 'SearchResultsPage'],
        '@id': 'https://redshirtsports.com/search/#searchPage',
        name: `You searched for ${query} - Redshirt Sports`,
        isPartOf: {
          '@id': 'https://redshirtsports.com/#website',
        },
      },
    ],
  }
  return (
    <>
      <Head>
        <script
          id="home-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
      </Head>
      <SEO
        title={`You searched for ${query}`}
        openGraph={{
          title: `You searched for ${query} | Redshirt Sports`,
        }}
      />
      <PageHeader
        heading="Search Results"
        subheading={`${searchResultsLength} results for "${query}"`}
      />
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {posts.length > 0 &&
              posts.map((post, key) => <HorizontalCard key={post._id} {...post} />)}
            {!posts.length && (
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-20 w-20 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
                  />
                </svg>
                <h3 className="mt-2 font-cal text-xl font-medium text-slate-900">No Results</h3>
                <p className="mt-1 text-base text-slate-500">
                  {`We couldn't find a match for "${query}".`}
                </p>
              </div>
            )}
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const posts = await sanityClient.fetch(searchQuery, {
    searchTerm: context.query.query,
  })

  return {
    props: {
      posts,
    },
  }
}

export default Search
