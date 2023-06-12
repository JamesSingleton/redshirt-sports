import { notFound } from 'next/navigation'

import Pagination from '@components/ui/Pagination'
import SocialMediaFollow from '@components/common/SocialMediaFollow'
import { getSubcategoryBySlug } from '@lib/sanity.client'
import HorizontalCard from '@components/ui/HorizontalCard'
import Breadcrumbs from '@components/ui/Breadcrumbs'
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
  if (!subcategory.posts.length) {
    return notFound()
  }
  const totalPages = Math.ceil(subcategory.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  const breadCrumbPages = [
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
      <section className="bg-zinc-100 py-12 dark:bg-zinc-800 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
              <div className="mt-6 text-center md:mt-0 md:text-left">
                {subcategory?.pageHeader && (
                  <span className="block text-xs uppercase tracking-widest text-brand-500 dark:text-brand-300">
                    {subcategory?.subTitle}
                  </span>
                )}
                <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
                  {subcategory?.pageHeader}
                </h1>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <Breadcrumbs breadCrumbPages={breadCrumbPages} />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            {subcategory.posts.map((post: Post) => (
              <HorizontalCard {...post} key={post._id} />
            ))}
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
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
