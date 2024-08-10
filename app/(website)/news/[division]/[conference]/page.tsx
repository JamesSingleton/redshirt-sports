import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import PageHeader from '@/components/common/PageHeader'
import PaginationControls from '@/components/common/PaginationControls'
import { getNewsByConference, getConferenceInfoBySlug } from '@/lib/sanity.fetch'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { urlForImage } from '@/lib/sanity.image'
import ArticleFeed from '../../_components/ArticleFeed'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Metadata, ResolvingMetadata } from 'next'
import type { Post } from '@/types'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const { division, conference } = params
  const { page } = searchParams

  const conferenceInfo = await getConferenceInfoBySlug(conference)

  if (!conferenceInfo) {
    return {}
  }

  const conferenceName = conferenceInfo.shortName ?? conferenceInfo.name
  let finalCanonical = `/news/${division}/${conference}`

  let finalTitle: string = `${conferenceName} Football News | ${process.env.NEXT_PUBLIC_APP_NAME}`
  let finalDescription: string = `Explore extensive coverage of ${conferenceName} football. Dive into detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}, your go-to source for all ${conferenceName} football news.`

  if (page) {
    finalTitle = `${conferenceName} Football News - Page ${page} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    finalDescription = `Explore extensive coverage of ${conferenceName} football on Page ${page}. Dive into detailed articles, updates, and analysis at ${process.env.NEXT_PUBLIC_APP_NAME}, your go-to source for all ${conferenceName} football news.`

    if (parseInt(page) > 1) {
      finalCanonical = `/news/${division}/${conference}?page=${page}`
    }
  }

  return constructMetadata({
    title: finalTitle,
    description: finalDescription,
    canonical: finalCanonical,
  })
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}) {
  const pageIndex = searchParams.page ? parseInt(searchParams.page) : 1
  const conference = await getNewsByConference(params.conference, pageIndex)

  if (!conference) {
    notFound()
  }

  const totalPages = Math.ceil(conference.totalPosts / perPage)

  const breadcrumbs = [
    {
      title: 'News',
      href: '/news',
    },
    {
      title: conference?.division.name,
      href: `/news/${conference.division.slug}`,
    },
    {
      title: conference?.shortName,
      href: `/news/${conference?.division.slug}/${conference?.slug}`,
    },
  ]

  const title = conference.shortName
    ? `${conference.shortName} Football News`
    : `${conference.name} Football News`

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/news/${params.division}/${params.conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        url: `${HOME_DOMAIN}/news/${params.division}/${params.conference}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        breadcrumb: {
          '@id': `${HOME_DOMAIN}/news/${params.division}/${params.conference}#breadcrumb`,
        },
      },
      {
        '@type': 'CollectionPage',
        mainEntity: conference.posts.map((post: Post) => ({
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
        '@id': `${HOME_DOMAIN}/news/${params.division}/${params.conference}#breadcrumb`,
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
            name: conference.division.name,
            item: `${HOME_DOMAIN}/news/${params.division}`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: conference.shortName ?? conference.name,
            item: `${HOME_DOMAIN}/news/${params.division}/${params.conference}`,
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
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={conference.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={conference.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
