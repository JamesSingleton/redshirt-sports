import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { stegaClean } from 'next-sanity'

import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import ArticleFeed from '@/components/article-feed'
import {
  conferenceInfoBySlugQuery,
  queryArticlesBySportDivisionAndConference,
  sportInfoBySlug,
} from '@/lib/sanity/query'
import { sanityFetch } from '@/lib/sanity/live'
import { JsonLdScript, organizationId, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'
import { getSEOMetadata } from '@/lib/seo'

import type { Metadata } from 'next'
import type { Post } from '@/types'
import type { CollectionPage, WithContext } from 'schema-dts'

async function fetchConferenceInfo(slug: string, { stega = true } = {}) {
  return await sanityFetch({
    query: conferenceInfoBySlugQuery,
    params: {
      slug,
    },
    stega,
  })
}

async function fetchSportNewsForDivisionAndConference({
  sport,
  division,
  conference,
  pageIndex,
}: {
  sport: string
  division: string
  conference: string
  pageIndex: number
}) {
  return await sanityFetch({
    query: queryArticlesBySportDivisionAndConference,
    params: {
      sport,
      division,
      conference,
      pageIndex,
    },
  })
}

async function fetchSportInfoBySlug(slug: string, { stega = true } = {}) {
  return await sanityFetch({
    query: sportInfoBySlug,
    params: {
      slug,
    },
    stega,
  })
}

export async function getDivisionOrSubgroupingDisplayName(
  slugOrShortName: string,
  { stega = true } = {},
) {
  return await sanityFetch({
    query: `
      *[
        (_type == "sportSubgrouping" && lower(shortName) == lower($slugOrShortName)) ||
        (_type == "division" && slug.current == $slugOrShortName)
      ][0]{
        _type,
        "displayName": select(
          _type == "sportSubgrouping" => shortName,
          _type == "division" => title
        )
      }
    `,
    params: { slugOrShortName },
    stega,
  })
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { sport, division, conference } = await params
  const { page } = await searchParams

  const [divisionDisplayName, conferenceInfo, sportTitle] = await Promise.all([
    getDivisionOrSubgroupingDisplayName(division, { stega: false }),
    fetchConferenceInfo(conference, { stega: false }),
    fetchSportInfoBySlug(sport, { stega: false }),
  ])

  if (!conferenceInfo || !sportTitle.data?.title || !divisionDisplayName?.data) {
    return {}
  }

  const conferenceName = conferenceInfo.data?.shortName ?? conferenceInfo.data?.name
  let canonical = `/college/${sport}/news/${division}/${conference}`

  const baseTitle = `${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} News, Updates & Analysis`
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`

  let finalTitle = baseTitle
  let finalDescription = baseDescription

  if (page && parseInt(page) > 1) {
    finalTitle = `${baseTitle} - Page ${page}`
    finalDescription = `Continue exploring coverage of ${conferenceName} ${divisionDisplayName?.data.displayName} ${sportTitle.data.title} on Page ${page}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`
    canonical = `/college/${sport}/news/${division}/${conference}?page=${page}`
  }

  return await getSEOMetadata({
    title: finalTitle,
    description: finalDescription,
    slug: canonical,
  })
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport, division, conference } = await params
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const baseUrl = getBaseUrl()

  const [newsResponse, sportInfoResponse, divisionNameResponse] = await Promise.all([
    fetchSportNewsForDivisionAndConference({
      sport,
      division,
      conference,
      pageIndex,
    }),
    fetchSportInfoBySlug(sport),
    getDivisionOrSubgroupingDisplayName(division),
  ])

  const news = newsResponse.data
  const sportInfo = sportInfoResponse.data
  const divisionOrSubgroupingName = divisionNameResponse?.data.displayName

  if (!news || !news.posts || !news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const sportTitle = stegaClean(sportInfo?.title)

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} ${sportTitle} News`
    : `${news.conferenceInfo.name} ${sportTitle} News`

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: `Stay informed with breaking ${news.conferenceInfo.shortName ?? news.conferenceInfo.name} ${stegaClean(divisionOrSubgroupingName)} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}/${conference}${page ? `?page=${page}` : ''}`,
    isPartOf: { '@id': websiteId, '@type': 'WebSite' },
    publisher: { '@id': organizationId, '@type': 'Organization' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: news.posts.map((post: Post, index: number) => ({
        '@id': `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: news.totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'News',
          item: `${baseUrl}/college/news`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: sportTitle,
          item: `${baseUrl}/college/${sport}/news`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: stegaClean(divisionOrSubgroupingName),
          item: `${baseUrl}/college/${sport}/news/${division}`,
        },
        {
          '@type': 'ListItem',
          position: 5,
          name: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
          item: `${baseUrl}/college/${sport}/news/${division}/${conference}`,
        },
      ],
    },
  }

  const breadcrumbItems = [
    {
      title: 'News',
      href: '/college/news',
    },
    {
      title: sportInfo?.title,
      href: `/college/${sport}/news`,
    },
    {
      title: divisionOrSubgroupingName,
      href: `/college/${sport}/news/${division}`,
    },
    {
      title: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
      href: `/college/${sport}/news/${division}/${conference}`,
    },
  ]

  return (
    <>
      <JsonLdScript
        data={collectionPageJsonLd}
        id={`collection-page-${sport}-${division}-${conference}`}
      />
      <PageHeader title={title} breadcrumbs={breadcrumbItems} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
