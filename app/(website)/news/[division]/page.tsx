import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { Graph } from 'schema-dts'

import { getNewsByDivision } from '@/lib/sanity.fetch'
import PageHeader from '@/components/common/PageHeader'
import PaginationControls from '@/components/common/PaginationControls'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { urlForImage } from '@/lib/sanity.image'
import ArticleFeed from '../_components/ArticleFeed'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Metadata } from 'next'
import type { Post } from '@/types'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const { division } = params
  const { page } = searchParams

  let finalTitle: string = `Latest ${division.toUpperCase()} Football Coverage | ${process.env.NEXT_PUBLIC_APP_NAME}`
  let finalDescription: string = `Discover the latest articles and insights on ${division.toUpperCase()} football. Get comprehensive coverage at ${process.env.NEXT_PUBLIC_APP_NAME}.`
  let canonical = `/news/${division}`

  if (page) {
    finalTitle = `Latest ${division.toUpperCase()} Football Coverage - Page ${page} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    finalDescription = `Explore more ${division.toUpperCase()} football insights on page ${page}. Get comprehensive coverage at ${process.env.NEXT_PUBLIC_APP_NAME}.`

    if (parseInt(page) > 1) {
      canonical = `/news/${division}?page=${page}`
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
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}) {
  const { page } = searchParams

  if (parseInt(page) === 1) {
    return redirect(`/news/${params.division}`)
  }

  const pageIndex = page !== undefined ? parseInt(page) : 1
  const division = await getNewsByDivision(params.division, pageIndex)

  if (!division) {
    notFound()
  }
  const totalPages = Math.ceil(division?.totalPosts / perPage)

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
          '@id': `${HOME_DOMAIN}/news/${params.division}#breadcrumb`,
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
      {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/news/${params.division}#breadcrumb`,
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
            name: division?.name,
            item: `${HOME_DOMAIN}/news/${params.division}`,
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
