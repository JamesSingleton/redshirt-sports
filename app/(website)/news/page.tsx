import { notFound } from 'next/navigation'

import { ArticleCard, Pagination } from '@components/ui'
import { PageHeader } from '@components/common'
import { getPaginatedPosts } from '@lib/sanity.client'
import { perPage } from '@lib/constants'

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

  const totalPages = Math.ceil(news.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <PageHeader title="Latest College Football News" breadcrumbs={breadcrumbs} />
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
