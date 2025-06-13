import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { stegaClean } from 'next-sanity'

import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { sanityFetch } from '@/lib/sanity/live'
import { querySportsAndDivisionNews, sportInfoBySlug } from '@/lib/sanity/query'
import { perPage } from '@/lib/constants'
import { JsonLdScript, organizationId, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'
import type { Post } from '@/types'
import type { CollectionPage, WithContext } from 'schema-dts'

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
  params: Promise<{ sport: string; division: string }>
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { sport, division } = await params
  const { page } = await searchParams

  const [sportInfoResponse, divisionDisplayName] = await Promise.all([
    fetchSportInfoBySlug(sport, { stega: false }), // Clean data for metadata
    getDivisionOrSubgroupingDisplayName(division, { stega: false }),
  ])

  const sportTitle = sportInfoResponse?.data?.title
  const divisionName = divisionDisplayName.data?.displayName

  if (!sportTitle || !divisionName) {
    return {
      title: `Sports News | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      description: `Stay updated with the latest sports news and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    }
  }

  const baseTitle = `Latest ${divisionName} ${sportTitle} News`
  const baseDescription = `Complete ${divisionName} ${sportTitle} coverage including breaking news, game analysis, player spotlights, and coaching updates. Your go-to source for ${sportTitle} insights.`

  const baseCanonical = `/college/${sport}/news/${division}`

  const pageNumber = page ? parseInt(page, 10) : 1
  const isFirstPage = !page || pageNumber <= 1

  let title: string
  let description: string
  let canonical: string

  if (isFirstPage) {
    title = `${baseTitle} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    description = baseDescription
    canonical = baseCanonical
  } else {
    title = `${baseTitle} - Page ${pageNumber} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    description = `More ${divisionName} ${sportTitle} stories on Page ${pageNumber}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis.`
    canonical = `${baseCanonical}?page=${pageNumber}`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: process.env.NEXT_PUBLIC_APP_NAME,
      images: [
        {
          url: 'https://cdn.sanity.io/images/8pbt9f8w/production/429b65d83baa82c7178798a398fdf3ee28972fe6-1200x630.png',
          width: 1200,
          height: 630,
        },
      ],
      url: `${getBaseUrl()}/college/${sport}/news/${division}${page ? `?page=${page}` : ''}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [
        'https://cdn.sanity.io/images/8pbt9f8w/production/429b65d83baa82c7178798a398fdf3ee28972fe6-1200x630.png',
      ],
      site: '@_redshirtsports',
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
  params: Promise<{ sport: string; division: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport, division } = await params
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const baseUrl = getBaseUrl()

  const [newsResponse, sportInfoResponse, divisionNameResponse] = await Promise.all([
    fetchSportsAndDivisionNews({ sport, division, pageIndex }),
    fetchSportInfoBySlug(sport),
    getDivisionOrSubgroupingDisplayName(division),
  ])

  const news = newsResponse.data
  const sportInfo = sportInfoResponse.data
  const divisionOrSubgroupingName = divisionNameResponse?.data.displayName

  if (!news || !news.posts || !news.posts.length) {
    notFound()
  }

  const sportTitle = stegaClean(sportInfo?.title)
  const divisionTitle = stegaClean(divisionOrSubgroupingName)

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const collectionPageJsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${divisionTitle} ${sportTitle} News`,
    description: `Stay informed with breaking ${stegaClean(divisionOrSubgroupingName)} ${sportTitle} news and in-depth analysis. ${process.env.NEXT_PUBLIC_APP_NAME} delivers comprehensive coverage, articles, and updates you need.`,
    url: `${baseUrl}/college/${sport}/news/${division}${page ? `?page=${page}` : ''}`,
    isPartOf: { '@id': websiteId, '@type': 'WebSite' },
    publisher: { '@id': organizationId, '@type': 'Organization' },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: news.posts.map((post: Post, index: number) => ({
        '@id': `${baseUrl}/${post.slug}#article`,
      })),
      numberOfItems: news.totalPosts,
      url: `${baseUrl}/college/${sport}/news/${division}`,
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
          name: divisionTitle,
          item: `${baseUrl}/college/${sport}/news/${division}`,
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
  ]

  return (
    <>
      <JsonLdScript data={collectionPageJsonLd} id={`collection-page-${sport}-${division}`} />
      <PageHeader
        title={`${divisionOrSubgroupingName} ${sportInfo?.title} News`}
        breadcrumbs={breadcrumbItems}
      />
      <section className="container pb-12">
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
