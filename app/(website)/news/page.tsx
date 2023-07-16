import { notFound } from 'next/navigation'

import { Breadcrumbs, ArticleCard, Pagination } from '@components/ui'
import { getPaginatedPosts } from '@lib/sanity.client'

import type { Post } from '@types'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const news = await getPaginatedPosts({ pageIndex })

  if (!news) {
    return notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />

            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              Latest College Football News
            </h1>
          </div>
        </div>
      </section>
      <section className="container">
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          {news.posts.map((post: Post) => (
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
            totalPosts={news.totalPosts}
            nextDisabled={nextDisabled}
            prevDisabled={prevDisabled}
            slug="/news"
          />
        )}
      </section>
    </>
  )
}
