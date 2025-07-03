import { notFound } from 'next/navigation'

import { sanityFetch } from '@/lib/sanity/live'
import { querySportsNews, sportInfoBySlug } from '@/lib/sanity/query'
import { perPage } from '@/lib/constants'
import PageHeader from '@/components/page-header'
import ArticleFeed from '@/components/article-feed'
import PaginationControls from '@/components/pagination-controls'
import { getSEOMetadata } from '@/lib/seo'

import type { Metadata } from 'next'

async function fetchSportsNews({ sport, pageIndex }: { sport: string; pageIndex: number }) {
  return await sanityFetch({
    query: querySportsNews,
    params: {
      sport,
      pageIndex,
    },
  })
}

async function fetchSportTitle(sport: string, { stega = true } = {}) {
  return await sanityFetch({
    query: sportInfoBySlug,
    params: {
      slug: sport,
    },
    stega,
  })
}

function validatePageIndex(page: string | undefined): number {
  if (!page) return 1

  const parsed = parseInt(page, 10)
  if (isNaN(parsed) || parsed < 1) return 1

  return parsed
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { sport } = await params
  const { page } = await searchParams
  const pageIndex = validatePageIndex(page)

  const { data: sportData } = await fetchSportTitle(sport, { stega: false })

  if (!sportData || !sportData.title) {
    return {}
  }

  const sportTitle = sportData.title
  let title: string
  let description: string
  let canonicalUrl = `/college/${sport}/news`

  if (pageIndex > 1) {
    title = `College ${sportTitle} News & Updates - Page ${pageIndex} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    description = `Continue exploring comprehensive college ${sportTitle} news, game analysis, and feature stories. This is page ${page} of our in-depth coverage.`
    canonicalUrl = `${canonicalUrl}?page=${page}`
  } else {
    title = `College ${sportTitle} News & Updates | ${process.env.NEXT_PUBLIC_APP_NAME}`
    description = `Find comprehensive college ${sportTitle} news, detailed game results, expert analysis, and valuable insights. Your trusted source for NCAA ${sportTitle} information.`
  }

  return await getSEOMetadata({
    title,
    description,
    slug: canonicalUrl,
  })
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport } = await params

  const { page } = await searchParams
  const pageIndex = validatePageIndex(page)

  const [newsResponse, sportInfoResponse] = await Promise.all([
    fetchSportsNews({ sport, pageIndex }),
    fetchSportTitle(sport),
  ])

  const news = newsResponse.data
  const sportInfo = sportInfoResponse?.data

  if (!news || !news.posts || !news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const breadcrumbItems = [
    {
      title: 'News',
      href: '/college/news',
    },
    {
      title: sportInfo!.title,
      href: `/college/${sport}/news`,
    },
  ]

  return (
    <>
      <PageHeader title={`College ${sportInfo?.title} News`} breadcrumbs={breadcrumbItems} />
      <section className="container pb-12">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && <PaginationControls totalPosts={news.totalPosts} />}
      </section>
    </>
  )
}
