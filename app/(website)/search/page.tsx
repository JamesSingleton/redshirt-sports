import { Suspense } from 'react'

import { PageHeader } from '@components/common'
import Search from '@components/common/Search'
import { getSearchResults } from '@lib/sanity.client'
import { ArticleCard, Pagination } from '@components/ui'

import { Post } from '@types'

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

  const searchResults = await getSearchResults({ query, pageIndex })

  const totalPages = Math.ceil(searchResults.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <PageHeader title="Search Results" subtitle={subheadingText} breadcrumbs={breadcrumbs} />
      <section className="container py-12 sm:py-16 lg:py-24">
        <div className="max-w-3xl">
          <Search />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          {searchResults.posts.length > 0 &&
            searchResults.posts.map((post: Post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                excerpt={post.excerpt}
                date={post.publishedAt}
                image={post.mainImage}
                slug={post.slug}
                division={post.division}
                conferences={post.conferences}
              />
            ))}
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={pageIndex}
            totalPosts={searchResults.totalPosts}
            nextDisabled={nextDisabled}
            prevDisabled={prevDisabled}
            slug="/search"
          />
        )}
      </section>
    </>
  )
}
