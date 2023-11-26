import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { ArticleCard, Pagination } from '@components/ui'
import { PageHeader } from '@components/common'
import { getNews } from '@lib/sanity.fetch'
import { baseUrl, perPage } from '@lib/constants'
import { Org, Web } from '@lib/ldJson'
import { urlForImage } from '@lib/sanity.image'
import { defineMetadata } from '@lib/utils.metadata'

import type { Post } from '@types'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export const runtime = 'edge'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const defaultMetadata = defineMetadata({
    title: `College Football News and Updates${
      searchParams.page ? ` Page ${searchParams.page}` : ''
    }`,
    description:
      'Stay in the know with the latest college football news, updates, and insights. From FCS to FBS, D2 to D3, catch up on all the action with Redshirt Sports.',
  })
  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent('College Football News')}`,
          width: 1200,
          height: 630,
          alt: 'College Football News',
        },
      ],
      url: `/news${searchParams.page ? `?page=${searchParams.page}` : ''}`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: `/news${searchParams.page ? `?page=${searchParams.page}` : ''}`,
    },
    twitter: {
      ...defaultMetadata.twitter,
      images: [
        {
          url: `${baseUrl}/api/og?title=${encodeURIComponent('College Football News')}`,
          width: 1200,
          height: 630,
          alt: 'College Football News',
        },
      ],
    },
  }
}

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const news = await getNews(pageIndex)

  if (!news) {
    return notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/news${page ? `?page=${page}` : ''}`,
        url: `${baseUrl}/news${page ? `?page=${page}` : ''}`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          name: 'News Breadcrumbs',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${baseUrl}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'News',
              item: `${baseUrl}/news`,
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
            url: `${baseUrl}/authors/${post.author.slug}`,
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
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          {news.posts.map((post: Post, index: number) => (
            <ArticleCard
              index={index}
              key={post._id}
              title={post.title}
              date={post.publishedAt}
              image={post.mainImage}
              slug={post.slug}
              division={post.division}
              conferences={post.conferences}
              author={post.author}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <Suspense fallback={<>Loading</>}>
            <Pagination
              currentPage={pageIndex}
              totalPosts={news.totalPosts}
              nextDisabled={nextDisabled}
              prevDisabled={prevDisabled}
              slug="/news"
            />
          </Suspense>
        )}
      </section>
    </>
  )
}
