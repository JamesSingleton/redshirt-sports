import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'
import { collegeNewsQuery } from '@/lib/sanity/query'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'
import { getSEOMetadata } from '@/lib/seo'

async function fetchCollegeNews({ pageIndex }: { pageIndex: number }) {
  return await sanityFetch({
    query: collegeNewsQuery,
    params: {
      pageIndex,
    },
  })
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams
  const page = params.page

  const pageNumber = typeof page === 'string' ? parseInt(page, 10) : 1
  const isFirstPage = !page || pageNumber <= 1

  const appName = process.env.NEXT_PUBLIC_APP_NAME

  const baseTitle = `Latest College Sports News`
  const baseCanonical = `/college/news`

  let title: string
  let description: string
  let canonical: string

  if (isFirstPage) {
    title = baseTitle
    description = `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, & in-depth analysis from across the NCAA. Get the latest from ${appName}.`
    canonical = baseCanonical
  } else {
    title = `${baseTitle} - Page ${pageNumber}`
    description = `Continue reading more college sports news on Page ${pageNumber}. Find the latest updates, player features, and postseason analysis from ${appName}.`
    canonical = `${baseCanonical}?page=${pageNumber}`
  }

  return await getSEOMetadata({
    title,
    description,
    slug: canonical,
  })
}

const breadcrumbItems = [
  {
    title: 'News',
    href: '/college/news',
  },
]

export default async function CollegeSportsNews({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const {
    data: { posts, totalPosts },
  } = await fetchCollegeNews({ pageIndex })

  const totalPages = Math.ceil(totalPosts / perPage)

  // TODO: Implement ld+json

  return (
    <>
      <PageHeader title="College Sports News" breadcrumbs={breadcrumbItems} />
      <section className="container pb-12">
        <ArticleFeed articles={posts} />
        {totalPages > 1 && <PaginationControls totalPosts={totalPosts} />}
      </section>
    </>
  )
}
