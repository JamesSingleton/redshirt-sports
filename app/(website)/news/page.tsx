import { Suspense } from 'react'

import { notFound, redirect } from 'next/navigation'
import { Graph } from 'schema-dts'

import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { getNews } from '@/lib/sanity.fetch'
import { HOME_DOMAIN, perPage } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { urlForImage } from '@/lib/sanity.image'
import ArticleFeed from './_components/ArticleFeed'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Post } from '@/types'
import type { Metadata } from 'next'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { page } = await searchParams
  let finalTitle: string = `College Football News & Updates | ${process.env.NEXT_PUBLIC_APP_NAME}`
  let finalDescription: string = `Get the latest college football news, covering FCS, FBS, D2, and D3. Explore insightful articles and stay informed with ${process.env.NEXT_PUBLIC_APP_NAME}.`
  let canonical = '/news'

  if (page) {
    finalTitle = `College Football News & Updates - Page ${page} | ${process.env.NEXT_PUBLIC_APP_NAME}`
    finalDescription = `Explore more college football insights on page ${page}. Discover the latest FCS, FBS, D2, and D3 coverage at ${process.env.NEXT_PUBLIC_APP_NAME}.`

    if (parseInt(page) > 1) {
      canonical = `/news?page=${page}`
    }
  }

  const defaultMetadata = constructMetadata({
    title: finalTitle,
    description: finalDescription,
    canonical,
  })

  return defaultMetadata
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  if (parseInt(page) === 1) {
    return redirect('/news')
  }
  const news = await getNews(pageIndex)

  if (!news) {
    return notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/news${page ? `?page=${page}` : ''}`,
        url: `${HOME_DOMAIN}/news${page ? `?page=${page}` : ''}`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          name: 'News Breadcrumbs',
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
          ],
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
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader title="Latest College Football News" breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <Suspense fallback={<>Loading</>}>
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
