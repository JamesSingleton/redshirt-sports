import { notFound } from 'next/navigation'

import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { sanityFetch } from '@redshirt-sports/sanity/live'
import { collegeNewsQuery } from '@redshirt-sports/sanity/queries'
import { getBaseUrl } from '@/lib/get-base-url'
import { JsonLdScript, websiteId, organizationId } from '@/components/json-ld'
import { getSEOMetadata } from '@/lib/seo'
import { validatePageIndex } from '@/utils/validate-page-index'

import type { Metadata } from 'next'
import type { WithContext, CollectionPage } from 'schema-dts'
import { type Post } from '@redshirt-sports/sanity/types'

const baseUrl = getBaseUrl()

async function fetchCollegeNews({ pageIndex }: { pageIndex: number }) {
  const from = (pageIndex - 1) * perPage
  const to = pageIndex * perPage

  return await sanityFetch({
    query: collegeNewsQuery,
    params: {
      from,
      to,
    },
  })
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const params = await searchParams
  const page = params.page

  const pageNumber = typeof page === 'string' ? parseInt(page, 10) : 1
  const isFirstPage = !page || pageNumber <= 1

  const appName = process.env.NEXT_PUBLIC_APP_NAME

  const baseTitle = `College Sports News`
  const baseCanonical = `/college/news`

  let title: string
  let description: string
  let canonical: string

  if (isFirstPage) {
    title = baseTitle
    description = `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, & in-depth analysis from across the NCAA. Get the latest from ${appName}.`
    canonical = baseCanonical
  } else {
    title = `${baseTitle} - Page ${pageNumber}`
    description = `Continue reading more college sports news on Page ${pageNumber}. Find the latest updates, player features, and postseason analysis from ${appName}.`
    canonical = `${baseCanonical}?page=${pageNumber}`
  }

  return getSEOMetadata({
    title,
    description,
    slug: canonical,
  })
}

const breadcrumbItems = [
  {
    title: 'News',
    href: '/college/news',
  },
]

export default async function CollegeSportsNews({ searchParams }: PageProps<'/college/news'>) {
  const { page } = await searchParams
  const pageIndex = validatePageIndex(page)
  const {
    data: { posts, totalPosts },
  } = await fetchCollegeNews({ pageIndex })

  if (posts.length === 0) {
    notFound()
  }

  const totalPages = Math.ceil(totalPosts / perPage)

  const newsJsonLd: WithContext<CollectionPage> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'College Sports News',
    url: `${baseUrl}/college/news`,
    description: `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting, & in-depth analysis from across the NCAA. Get the latest from ${process.env.NEXT_PUBLIC_APP_NAME}.`,
    isPartOf: {
      '@type': 'WebSite',
      '@id': websiteId,
    },
    publisher: {
      '@type': 'Organization',
      '@id': organizationId,
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post: Post, index: number) => ({
        '@id': `${baseUrl}/${post.slug}#article`,
        position: index + 1,
      })),
      numberOfItems: posts.length,
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
          name: 'College Sports News',
          item: `${baseUrl}/college/news`,
        },
      ],
    },
  }

  return (
    <>
      <JsonLdScript data={newsJsonLd} id="college-sports-news-json-ld" />
      <PageHeader title="College Sports News" breadcrumbs={breadcrumbItems} />
      <section className="container pb-12">
        <ArticleFeed articles={posts} />
        {totalPages > 1 && <PaginationControls totalPosts={totalPosts} />}
      </section>
    </>
  )
}
