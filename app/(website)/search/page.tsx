import { Suspense } from 'react'

import PageHeader from '@/components/page-header'
import ArticleCard from '@/components/article-card'
import PaginationControls from '@/components/pagination-controls'
import Search from '@/components/search'
import { getSearchResults } from '@/lib/sanity.fetch'
import { perPage } from '@/lib/constants'
import { constructMetadata } from '@/utils/construct-metadata'

import { Post } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = constructMetadata({
  title: `Search Results | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: `Explore the latest articles, news, and analysis on college football. Find what you're looking for across FCS, FBS, D2, D3, and NAIA at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
  canonical: '/search',
})

const breadcrumbs = [
  {
    title: 'Search',
    href: '/search',
  },
]

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  // const query = searchParams['q'] ?? null
  const { q: query, page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const subheadingText = query ? `Search results for "${query}"` : null

  const searchResults = await getSearchResults(query, pageIndex)

  const totalPages = Math.ceil(searchResults.totalPosts / perPage)

  return (
    <>
      <PageHeader title="Search Results" subtitle={subheadingText} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="max-w-3xl">
          <Suspense fallback={<>Loading...</>}>
            <Search defaultValue={query} />
          </Suspense>
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
                author={post.author.name}
              />
            ))}
          </div>
        )}
        {searchResults.posts.length === 0 && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold">No results found.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Try searching for something else or check out our latest articles below.
            </p>
          </div>
        )}
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={searchResults.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
