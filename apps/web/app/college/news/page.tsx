import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'
import { collegeNewsQuery } from '@/lib/sanity/query'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'

async function fetchCollegeNews({ pageIndex }: { pageIndex: number }) {
  return await sanityFetch({
    query: collegeNewsQuery,
    params: {
      pageIndex,
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

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name' // Fallback for app name

  // Placeholder for fetching college news specific information if needed
  // const collegeNewsInfo = await fetchCollegeNewsInfo({ stega: false });

  const baseTitle = `Latest College Sports News`
  const baseCanonical = `/college/news`

  let title: string
  let description: string
  let canonical: string

  if (isFirstPage) {
    title = `${baseTitle} | ${appName}`
    // Original: "Stay updated with comprehensive coverage of college sports, including breaking news, game highlights, recruiting updates, and in-depth analysis from across the NCAA." (169 chars)
    // Revised (159 chars):
    description = `Stay updated with comprehensive college sports coverage: breaking news, game highlights, recruiting updates, and in-depth analysis from across the NCAA.`
    canonical = baseCanonical
  } else {
    title = `${baseTitle} - Page ${pageNumber} | ${appName}`
    // Original: "More college sports stories on Page ${pageNumber}. Continued coverage of college athletics, team news, player features, and postseason analysis." (149 chars) - Already good, minor tweak for consistency
    // Revised (155 chars):
    description = `More college sports stories on Page ${pageNumber}. Get continued coverage of college athletics, team news, player features, & postseason analysis.`
    canonical = `${baseCanonical}?page=${pageNumber}`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: appName,
      images: [
        {
          url: 'https://cdn.sanity.io/images/8pbt9f8w/production/429b65d83baa82c7178798a398fdf3ee28972fe6-1200x630.png',
          width: 1200,
          height: 630,
        },
      ],
      url: `${getBaseUrl()}/college/news${!isFirstPage ? `?page=${pageNumber}` : ''}`,
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
      types: {
        'application/rss+xml': `${getBaseUrl()}/api/rss/feed.xml`,
      },
    },
    metadataBase: new URL(getBaseUrl()),
  }
}

const breadcrumbItems = [
  {
    title: 'News',
    href: '/college/news',
  },
]

export default async function CollegeSportsNews({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const {
    data: { posts, totalPosts },
  } = await fetchCollegeNews({ pageIndex })

  const totalPages = Math.ceil(totalPosts / perPage)

  return (
    <>
      <PageHeader title="College Sports News" breadcrumbs={breadcrumbItems} />
      <section className="container pb-12">
        <ArticleFeed articles={posts} />
        {totalPages > 1 && <PaginationControls totalPosts={totalPosts} />}
      </section>
    </>
  )
}
