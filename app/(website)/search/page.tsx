import { Suspense } from 'react'

import { PageHeader } from '@components/common'
import Search from '@components/common/Search'
import { getSearchResults } from '@lib/sanity.fetch'
import { ArticleCard, Pagination } from '@components/ui'
import { perPage } from '@lib/constants'
import { defineMetadata } from '@lib/utils.metadata'

import { Post } from '@types'
import type { Metadata } from 'next'

export function generateMetadata({ searchParams }: { searchParams: { [key: string]: string } }) {
  const query = searchParams['q'] ?? null
  const defaultMetadata = defineMetadata({
    title: `Search Results for "${query}"`,
    description:
      'Explore the latest College Football news and updates at Redshirt Sports. Stay informed about scores, highlights, and team analyses in one place.',
  })

  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Search Results for "${query}"`)}`,
          width: 1200,
          height: 630,
          alt: `Search Results for "${query}"`,
        },
      ],
      url: `/search?q=${query}`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: `/search?q=${query}`,
    },
    twitter: {
      ...defaultMetadata.twitter,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`Search Results for "${query}"`)}`,
          width: 1200,
          height: 630,
          alt: `Search Results for "${query}"`,
        },
      ],
    },
  }
}

const breadcrumbs = [
  {
    title: 'Search',
    href: '/search',
  },
]

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const query = searchParams['q'] ?? null
  const pageIndex = searchParams['page'] !== undefined ? parseInt(searchParams['page']) : 1
  const subheadingText = query ? `Search results for "${query}"` : null

  const searchResults = await getSearchResults(query, pageIndex)

  const totalPages = Math.ceil(searchResults.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <PageHeader title="Search Results" subtitle={subheadingText} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="max-w-3xl">
          <Search defaultValue={query} />
        </div>
        {searchResults.posts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {searchResults.posts.map((post: Post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                date={post.publishedAt}
                image={post.mainImage}
                slug={post.slug}
                division={post.division}
                conferences={post.conferences}
                author={post.author}
                estimatedReadingTime={post.estimatedReadingTime}
              />
            ))}
          </div>
        )}
        {searchResults.posts.length === 0 && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold text-brand-500">No results found.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Try searching for something else or check out our latest articles below.
            </p>
          </div>
        )}
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <Pagination
              currentPage={pageIndex}
              totalPosts={searchResults.totalPosts}
              nextDisabled={nextDisabled}
              prevDisabled={prevDisabled}
              slug="/search"
            />
          </Suspense>
        )}
      </section>
    </>
  )
}
