import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
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
import { queryArticlesBySportDivisionAndConference } from '@/lib/sanity/query'

async function fetchSportNewsForDivisionAndConference({sport, division, conference, pageIndex}: { sport: string; division: string; conference: string; pageIndex: number }) {
  return await sanityFetch({
    query: queryArticlesBySportDivisionAndConference,
    params: {
      sport,
      division,
      conference,
      pageIndex
    }
  })
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string, division: string; conference: string }>
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { sport, division, conference } = await params
  const { page } = await searchParams

  const conferenceInfo = await getConferenceInfoBySlug(conference)

  if (!conferenceInfo) {
    return {}
  }

  const conferenceName = conferenceInfo.shortName ?? conferenceInfo.name
  let canonical = `/college/${sport}/news/${division}/${conference}`

  let finalTitle: string = `${conferenceName} Football News | ${process.env.NEXT_PUBLIC_APP_NAME}`
  let finalDescription: string = `Explore extensive coverage of ${conferenceName} football. Dive into detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}, your go-to source for all ${conferenceName} football news.`

  if (page) {
    finalTitle = `${conferenceName} Football News - Page ${page} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    finalDescription = `Explore extensive coverage of ${conferenceName} football on Page ${page}. Dive into detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}, your go-to source for all ${conferenceName} football news.`

    if (parseInt(page) > 1) {
      canonical = `/college/${sport}/news/${division}/${conference}?page=${page}`
    }
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
  params: Promise<{ sport: string, division: string; conference: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport, division, conference } = await params
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1


  const { data: news } = await fetchSportNewsForDivisionAndConference({
    sport,
    division,
    conference,
    pageIndex
  })

  if (!news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const title = news.conferenceInfo.shortName
    ? `${news.conferenceInfo.shortName} Football News`
    : `${news.conferenceInfo.name} Football News`

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/news/${division}/${conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        url: `${HOME_DOMAIN}/news/${division}/${conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        breadcrumb: {
          '@id': `${HOME_DOMAIN}/news/${division}/${conference}#breadcrumb`,
        },
      },
      {
        '@type': 'CollectionPage',
        mainEntity: news.posts.map((post: Post) => ({
          '@type': 'NewsArticle',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt,
          image: urlForImage(post.mainImage).url(),
          author: {
            '@type': 'Person',
            name: post.author.name,
            url: `${HOME_DOMAIN}/authors/${post.author.slug}`,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/news/${division}/${conference}#breadcrumb`,
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
            item: `${HOME_DOMAIN}/news`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: division,
            item: `${HOME_DOMAIN}/news/${division}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: news.conferenceInfo.shortName ?? news.conferenceInfo.name,
            item: `${HOME_DOMAIN}/news/${division}/${conference}`,
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader title={title} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} sport={sport} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}