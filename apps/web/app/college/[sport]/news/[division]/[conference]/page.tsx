import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { getConferenceInfoBySlug } from '@/lib/sanity.fetch'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { urlForImage } from '@/lib/sanity.image'
import ArticleFeed from '@/components/article-feed'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Metadata } from 'next'
import type { Post } from '@/types'
import { sanityFetch } from '@/lib/sanity/live'
import { queryArticlesBySportDivisionAndConference, sportInfoBySlug } from '@/lib/sanity/query'

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
  // First, try to find it as a SportSubgrouping by its shortName (case-insensitive)
  const subgroupingShortName = await sanityFetch({
    query: `*[_type == "sportSubgrouping" && lower(shortName) == lower($slugOrShortName)][0].shortName`,
    params: { slugOrShortName },
    stega,
  })
  if (subgroupingShortName.data) {
    return subgroupingShortName // e.g., "FCS", "FBS"
  }

  // If not found as a SportSubgrouping, then try to find it as a Division by its slug
  const divisionName = await sanityFetch({
    query: `*[_type == "division" && slug.current == $slugOrShortName][0].title`,
    params: { slugOrShortName },
    stega,
  })
  if (divisionName.data) {
    return divisionName // e.g., "Division II", "Division III"
  }

  return null // Return null if no matching document is found
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
    getConferenceInfoBySlug(conference),
    fetchSportInfoBySlug(sport, { stega: false }),
  ])

  if (!conferenceInfo || !sportTitle.data.title || !divisionDisplayName?.data) {
    return {}
  }

  const conferenceName = conferenceInfo.shortName ?? conferenceInfo.name
  let canonical = `/college/${sport}/news/${division}/${conference}`

  const baseTitle = `${conferenceName} ${divisionDisplayName?.data} ${sportTitle.data.title} News, Updates & Analysis`
  const baseDescription = `Stay informed with breaking ${conferenceName} ${divisionDisplayName?.data} ${sportTitle.data.title} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`

  let finalTitle = `${baseTitle} | ${process.env.NEXT_PUBLIC_APP_NAME}`
  let finalDescription = baseDescription

  if (page && parseInt(page) > 1) {
    finalTitle = `${baseTitle} - Page ${page} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    finalDescription = `Continue exploring coverage of ${conferenceName} ${divisionDisplayName?.data} ${sportTitle.data.title} on Page ${page}. Find more detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`
    canonical = `/college/${sport}/news/${division}/${conference}?page=${page}`
  }

  return constructMetadata({
    title: finalTitle,
    description: finalDescription,
    canonical,
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
  const divisionOrSubgroupingName = divisionNameResponse?.data

  if (!news || !news.posts || !news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} ${sportInfo.title} News`
    : `${news.conferenceInfo.name} ${sportInfo.title} News`

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/college/${sport}/news/${division}/${conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }#webpage`,
        url: `${HOME_DOMAIN}/college/${sport}/news/${division}/${conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        breadcrumb: {
          '@id': `${HOME_DOMAIN}/college/${sport}/news/${division}/${conference}#breadcrumb`,
        },
      },
      {
        '@type': 'CollectionPage',
        mainEntity: news.posts.map((post: Post) => ({
          '@type': 'NewsArticle',
          headline: post.title,
          description: post.excerpt,
          image: {
            '@type': 'ImageObject',
            url: urlForImage(post.mainImage).width(1200).height(630).url(),
            width: 1200,
            height: 630,
            alt: post.mainImage.caption,
          },
          datePublished: post.publishedAt,
          dateModified: post._updatedAt,
          author: {
            '@type': 'Person',
            name: post.author.name,
            url: `${HOME_DOMAIN}/authors/${post.author.slug}`,
          },
          publisher: {
            '@id': `${HOME_DOMAIN}#organization`,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/college/${sport}/news/${division}/${conference}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: HOME_DOMAIN,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'News',
            item: `${HOME_DOMAIN}/college/news`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'News',
            item: `${HOME_DOMAIN}/college/${sport}/news`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: divisionOrSubgroupingName,
            item: `${HOME_DOMAIN}/college/${sport}/news/${division}`,
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
            item: `${HOME_DOMAIN}/college/${sport}/news/${division}/${conference}`,
          },
        ],
      },
    ],
  }

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
    {
      title: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
      href: `/college/${sport}/news/${division}/${conference}`,
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
