import { notFound } from 'next/navigation'

import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { sanityFetch } from '@/lib/sanity/live'
import { querySportsAndDivisionNews, sportInfoBySlug } from '@/lib/sanity/query'
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

async function fetchSportInfoBySlug(slug: string) {
  return await sanityFetch({
    query: sportInfoBySlug,
    params: {
      slug,
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

export async function getDivisionOrSubgroupingDisplayName(slugOrShortName: string) {
  // First, try to find it as a SportSubgrouping by its shortName (case-insensitive)
  const subgroupingShortName = await sanityFetch({
    query: `*[_type == "sportSubgrouping" && lower(shortName) == lower($slugOrShortName)][0].shortName`,
    params: { slugOrShortName },
  })
  if (subgroupingShortName.data) {
    return subgroupingShortName // e.g., "FCS", "FBS"
  }

  // If not found as a SportSubgrouping, then try to find it as a Division by its slug
  const divisionName = await sanityFetch({
    query: `*[_type == "division" && slug.current == $slugOrShortName][0].title`,
    params: { slugOrShortName },
  })
  if (divisionName.data) {
    return divisionName // e.g., "Division II", "Division III"
  }

  return null // Return null if no matching document is found
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport, division } = await params
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const { data: news } = await fetchSportsAndDivisionNews({ sport, division, pageIndex })

  if (!news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)
  const { data: sportInfo } = await fetchSportInfoBySlug(sport)
  const { data: divisionOrSubgroupingName } = await getDivisionOrSubgroupingDisplayName(division)

  const breadcrumbItems = [
    {
      title: 'News',
      href: '/college/news',
    },
    {
      title: sportInfo.title,
      href: `/college/${sport}/news`,
    },
    {
      title: divisionOrSubgroupingName,
      href: `/college/${sport}/news/${division}`,
    },
  ]

  return (
    <>
      <PageHeader
        title={`${divisionOrSubgroupingName} ${sportInfo.title} News`}
        breadcrumbs={breadcrumbItems}
      />
      <section className="container pb-12">
        <ArticleFeed articles={news.posts} sport={sport} />
        {totalPages > 1 && <PaginationControls totalPosts={news.totalPosts} />}
      </section>
    </>
  )
}
