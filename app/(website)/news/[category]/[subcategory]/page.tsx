import { notFound } from 'next/navigation'

import { ArticleCard, Pagination, Breadcrumbs } from '@components/ui'
import { getSubcategoryBySlug } from '@lib/sanity.client'
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

  const subcategory = await getSubcategoryBySlug({ slug: params.subcategory, pageIndex })

  if (!subcategory) {
    return {}
  }

  let title = `${subcategory?.pageHeader}, Rumors, and More`
  let canonical = `${baseUrl}/news/${subcategory.parentSlug}/${subcategory?.slug}`
  if (pageIndex > 1) {
    title = `${subcategory?.pageHeader}, Rumors, and More - Page ${pageIndex}`
    canonical = `${baseUrl}/news/${subcategory.parentSlug}/${subcategory.slug}?page=${pageIndex}`
  }

  return {
    title,
    description: subcategory?.description,
    openGraph: {
      title,
      description: subcategory?.description,
      url: canonical,
      siteName: 'Redshirt Sports',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `/api/og?title=Redshirt Sports ${subcategory.subTitle} News`,
          width: '1200',
          height: '630',
          alt: 'Redshirt Sports Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: subcategory?.description,
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
  params: { category: string; subcategory: string }
  searchParams: { [key: string]: string }
}) {
  const pageIndex = searchParams.page ? parseInt(searchParams.page) : 1
  const subcategory = await getSubcategoryBySlug({ slug: params.subcategory, pageIndex })
  if (!subcategory) {
    return notFound()
  }
  const totalPages = Math.ceil(subcategory.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  const breadcrumbs = [
    {
      title: subcategory?.parentTitle,
      href: `/news/${subcategory?.parentSlug}`,
    },
    {
      title: subcategory?.title,
      href: `/news/${subcategory?.parentSlug}/${subcategory?.slug}`,
    },
  ]

  return (
    <>
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />
            {subcategory?.pageHeader && (
              <span className="mt-8 block text-sm uppercase tracking-widest text-brand-500 dark:text-brand-300">
                {subcategory?.subTitle}
              </span>
            )}
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {subcategory.pageHeader}
            </h1>
          </div>
        </div>
      </section>
      <section className="lg:py20 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {subcategory.posts.map((post: Post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                excerpt={post.excerpt}
                date={post.publishedAt}
                image={post.mainImage}
                slug={post.slug}
                parentCategory={post.parentCategory}
                subcategory={post.subcategory}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={pageIndex}
              totalPosts={subcategory.totalPosts}
              nextDisabled={nextDisabled}
              prevDisabled={prevDisabled}
              slug={`/news/${params.category}/${params.subcategory}`}
            />
          )}
        </div>
      </section>
    </>
  )
}
