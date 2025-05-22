import { notFound } from 'next/navigation'

import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { sanityFetch } from '@/lib/sanity/live'
import { querySportsAndDivisionNews } from '@/lib/sanity/query'
import { perPage } from '@/lib/constants'

import type { Metadata } from 'next'

async function fetchSportsAndDivisionNews({
  sport,
  division,
  pageIndex,
}: {
  sport: string
  division: string
  pageIndex: number
}) {
  return await sanityFetch({
    query: querySportsAndDivisionNews,
    params: {
      sport,
      division,
      pageIndex,
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sport: string; division: string }>
}): Promise<Metadata> {
  const { sport, division } = await params

  // title case sport
  const sportTitleCase = sport.charAt(0).toUpperCase() + sport.slice(1)

  return {
    title: `Latest ${division.toUpperCase()} ${sportTitleCase} News | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Discover the latest articles and insights on ${division.toUpperCase()} ${sport}. Get comprehensive coverage at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport, division } = await params
  const sportTitleCase = sport.charAt(0).toUpperCase() + sport.slice(1)
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const { data: news } = await fetchSportsAndDivisionNews({ sport, division, pageIndex })

  if (!news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  return (
    <>
      <PageHeader title={`Latest ${division.toUpperCase()} ${sportTitleCase} News`} />
      <section className="container pb-12">
        <ArticleFeed articles={news.posts} sport={sport} />
        {totalPages > 1 && <PaginationControls totalPosts={news.totalPosts} />}
      </section>
    </>
  )
}
