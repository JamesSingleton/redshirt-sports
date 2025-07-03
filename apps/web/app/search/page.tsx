import { Suspense } from 'react'

import PageHeader from '@/components/page-header'
import ArticleCard from '@/components/article-card'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { getSEOMetadata } from '@/lib/seo'

import { Post } from '@/types'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanity/live'
import { searchQuery } from '@/lib/sanity/query'

async function fetchSearchResults(
  query: string,
  page: number,
): Promise<{ data: { posts: Post[]; totalPosts: number } }> {
  return await sanityFetch({
    query: searchQuery,
    params: { q: query, pageIndex: page },
  })
}

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: `Search Results | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Explore the latest articles, news, and analysis on college football. Find what you're looking for across FCS, FBS, D2, D3, and NAIA at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    slug: '/search',
  })
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { q: query, page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const subheadingText = query ? `Search results for "${query}"` : null

  let searchResults: { posts: Post[]; totalPosts: number } = { posts: [], totalPosts: 0 }

  if (query) {
    const { data } = await fetchSearchResults(query, pageIndex)
    searchResults = data
  }

  const totalPages = Math.ceil(searchResults.totalPosts / perPage)

  return (
    <>
      <PageHeader title="Search Results" subtitle={subheadingText} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        {searchResults.posts.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {searchResults.posts.map((post: Post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                date={post.publishedAt}
                image={post.mainImage}
                slug={post.slug}
                author={post.authors[0]?.name || post.author.name}
              />
            ))}
          </div>
        )}
        {searchResults.posts.length === 0 && (
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold">No results found.</h2>
            <p className="text-muted-foreground mt-4 text-lg">
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
