import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { ArticleCard, PaginationControls } from '@/components/common'
import { PageHeader } from '@/components/common'
import { getNewsByConference } from '@/lib/sanity.fetch'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { urlForImage } from '@/lib/sanity.image'
import { defineMetadata } from '@/lib/utils.metadata'
import ArticleFeed from '../../_components/ArticleFeed'

import type { Metadata, ResolvingMetadata } from 'next'
import type { Post } from '@/types'

export async function generateMetadata(
  {
    params,
    searchParams,
  }: {
    params: { [key: string]: string }
    searchParams: { [key: string]: string }
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const conference = await getNewsByConference(params.conference, pageIndex)

  if (!conference) {
    return {}
  }

  let title = `${conference?.name} Football, Rumors, and More`
  let canonical = `${HOME_DOMAIN}/news/${conference.division.slug}/${conference?.slug}`
  if (pageIndex > 1) {
    title = `${conference?.name} Football, Rumors, and More - Page ${pageIndex}`
    canonical = `${HOME_DOMAIN}/news/${conference.division.slug}/${conference.slug}?page=${pageIndex}`
  }

  const fallBackDescription = `Explore the latest in ${
    conference.division.name
  } college football from the ${
    conference.shortName ?? conference.name
  } conference at Redshirt Sports. Get news, highlights, and more.`

  const defaultMetadata = defineMetadata({
    title,
    description: conference?.description ?? fallBackDescription,
  })

  const previousImages = (await parent).openGraph?.images || []

  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [...previousImages],
      url: `/news/${conference.division.slug}/${conference?.slug}${
        pageIndex > 1 ? `?page=${pageIndex}` : ''
      }`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical,
    },
    metadataBase: new URL(HOME_DOMAIN),
  }
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
          '@type': 'BreadcrumbList',
          name: `${conference.division.name} Breadcrumbs`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${HOME_DOMAIN}`,
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
