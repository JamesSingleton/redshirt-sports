import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { getNewsByDivision } from '@/lib/sanity.fetch'
import { PaginationControls, PageHeader } from '@/components/common'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { defineMetadata } from '@/lib/utils.metadata'
import { urlForImage } from '@/lib/sanity.image'
import ArticleFeed from '../_components/ArticleFeed'

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
  const division = await getNewsByDivision(params.division, pageIndex)

  if (!division) {
    return {}
  }

  let title = `${division?.heading}, Rumors, and More`
  let canonical = `${HOME_DOMAIN}/news/${division?.slug}`
  if (pageIndex > 1) {
    title = `${division?.heading}, Rumors, and More - Page ${pageIndex}`
    canonical = `${HOME_DOMAIN}/news/${division?.slug}?page=${pageIndex}`
  }

  const defaultMetadata = defineMetadata({
    title,
    description: division?.description,
  })

  const previousImages = (await parent).openGraph?.images || []

  return {
    ...defaultMetadata,
    metadataBase: new URL(HOME_DOMAIN),
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [...previousImages],
      url: `/news/${division?.slug}${pageIndex > 1 ? `?page=${pageIndex}` : ''}`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}) {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const division = await getNewsByDivision(params.division, pageIndex)

  if (!division) {
    notFound()
  }
  const totalPages = Math.ceil(division?.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  const breadcrumbs = [
    {
      title: 'News',
      href: '/news',
    },
    {
      title: division?.name,
      href: `/news/${division?.slug}`,
    },
  ]

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/news/${params.division}${page ? `?page=${page}` : ''}`,
        url: `${HOME_DOMAIN}/news/${params.division}${page ? `?page=${page}` : ''}`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          name: `${division?.name} Breadcrumbs`,
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
              name: division?.name,
              item: `${HOME_DOMAIN}/news/${params.division}`,
            },
          ],
        },
      },
      {
        '@type': 'CollectionPage',
        mainEntity: division.posts.map((post: Post) => ({
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
      <PageHeader title={division?.heading} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={division.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading...</>}>
            <PaginationControls totalPosts={division.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
