import { notFound } from 'next/navigation'

import { getDivisionBySlug } from '@lib/sanity.client'
import { ArticleCard, Pagination, Breadcrumbs } from '@components/ui'
import { baseUrl } from '@lib/constants'

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
  const totalPages = Math.ceil(division?.totalPosts / 10)
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
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />
            {division?.pageHeader && (
              <span className="mt-8 block text-sm uppercase tracking-widest text-brand-500 dark:text-brand-300">
                {division?.subTitle}
              </span>
            )}
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {division.heading}
            </h1>
          </div>
        </div>
      </section>
      <section className="lg:py20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div>Filters Will Go Here</div>
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
        </div>
      </section>
    </>
  )
}
