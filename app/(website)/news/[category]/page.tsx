import { notFound } from 'next/navigation'

import { getDivisionBySlug } from '@lib/sanity.client'
import { ArticleCard, Pagination, Breadcrumbs } from '@components/ui'
import { PageHeader } from '@components/common'
import { baseUrl, perPage } from '@lib/constants'

import type { Metadata } from 'next'
import type { Post } from '@types'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const division = await getDivisionBySlug({ slug: params.category, pageIndex })

  if (!division) {
    return {}
  }

  let title = `${division?.heading}, Rumors, and More`
  let canonical = `${baseUrl}/news/${division?.slug}`
  if (pageIndex > 1) {
    title = `${division?.heading}, Rumors, and More - Page ${pageIndex}`
    canonical = `${baseUrl}/news/${division?.slug}?page=${pageIndex}`
  }

  return {
    title,
    description: division?.description,
    openGraph: {
      title,
      description: division?.description,
      url: canonical,
      siteName: 'Redshirt Sports',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: '/api/og?title=Redshirt Sports FCS News',
          width: '1200',
          height: '630',
          alt: 'Redshirt Sports Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: division?.description,
    },
    alternates: {
      canonical,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { [key: string]: string }
}) {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const division = await getDivisionBySlug({ slug: params.category, pageIndex })

  if (!division) {
    return notFound()
  }
  const totalPages = Math.ceil(division?.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  const breadcrumbs = [
    {
      title: 'News',
      href: '/news',
    },
    {
      title: division?.name,
      href: `/news/${division?.slug}`,
    },
  ]

  return (
    <>
      <PageHeader title={division?.heading} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          {division.posts.map((post: Post) => (
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
          {!division.posts.length && (
            <div className="col-span-3">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Coming Soon
              </h2>
            </div>
          )}
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={pageIndex}
            totalPosts={division.totalPosts}
            nextDisabled={nextDisabled}
            prevDisabled={prevDisabled}
            slug={`/news/${params.category}`}
          />
        )}
      </section>
    </>
  )
}
