import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

import { Layout, SocialMediaFollow } from '@components/common'
import { PageHeader, HorizontalCard } from '@components/ui'
import { getClient } from '@lib/sanity.server'
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
      <NextSeo
        title={`You searched for ${query}`}
        openGraph={{
          title: `You searched for ${query} - Redshirt Sports`,
        }}
      />
      <Layout>
        <PageHeader
          heading="Search Results"
          subheading={`${searchResultsLength} results for "${query}"`}
        />
        <section className="mx-auto max-w-7xl py-12 md:py-16 lg:py-20 lg:px-8">
          <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
            <div className="col-span-2">
              {posts.map((post, key) => (
                <HorizontalCard post={post} key={post._id} />
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const posts = await getClient().fetch(searchQuery, {
    searchTerm: context.query.query,
  })

  if (!posts.length) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      posts,
    },
  }
}

export default Search
