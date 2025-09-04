import { notFound } from 'next/navigation'

import { sanityFetch } from '@/lib/sanity/live'
import { querySportsNews, sportInfoBySlug } from '@/lib/sanity/query'
import { perPage } from '@/lib/constants'
import PageHeader from '@/components/page-header'
import ArticleFeed from '@/components/article-feed'
import PaginationControls from '@/components/pagination-controls'
import { getSEOMetadata } from '@/lib/seo'
import { validatePageIndex } from '@/utils/validate-page-index'

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

async function fetchSportTitle(sport: string) {
  return await sanityFetch({
    query: sportInfoBySlug,
    params: {
      slug: sport,
    },
  })
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<'/college/[sport]/news'>): Promise<Metadata> {
  const { sport } = await params
  const { page } = await searchParams
  const pageIndex = validatePageIndex(page)

  const { data: sportData } = await fetchSportTitle(sport)

  if (!sportData || !sportData.title) {
    return {}
  }

  const sportTitle = sportData.title
  let title: string
  let description: string
  let canonicalUrl = `/college/${sport}/news`

  if (pageIndex > 1) {
    title = `College ${sportTitle} News & Updates - Page ${pageIndex}`
    description = `Continue exploring comprehensive college ${sportTitle} news, game analysis, and feature stories. This is page ${page} of our in-depth coverage.`
    canonicalUrl = `${canonicalUrl}?page=${page}`
  } else {
    title = `College ${sportTitle} News & Updates`
    description = `Find comprehensive college ${sportTitle} news, detailed game results, expert analysis, and valuable insights. Your trusted source for NCAA ${sportTitle} information.`
  }

  return getSEOMetadata({
    title,
    description,
    slug: canonicalUrl,
  })
}

export default async function Page({ params, searchParams }: PageProps<'/college/[sport]/news'>) {
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
