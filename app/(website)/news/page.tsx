import { Suspense } from 'react'

import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { ArticleCard, PaginationControls } from '@components/common'
import { PageHeader } from '@components/common'
import { getNews } from '@lib/sanity.fetch'
import { BASE_URL, perPage } from '@lib/constants'
import { Org, Web } from '@lib/ldJson'
import { urlForImage } from '@lib/sanity.image'
import { defineMetadata } from '@lib/utils.metadata'

import type { Post } from '@types'
import type { Metadata, ResolvingMetadata } from 'next'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

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
  const defaultMetadata = defineMetadata({
    title: `College Football News and Updates${
      searchParams.page ? ` Page ${searchParams.page}` : ''
    }`,
    description:
      'Stay in the know with the latest college football news, updates, and insights. From FCS to FBS, D2 to D3, catch up on all the action with Redshirt Sports.',
  })
  const previousImages = (await parent).openGraph?.images || []
  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [...previousImages],
      url: `/news${searchParams.page ? `?page=${searchParams.page}` : ''}`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: `/news${searchParams.page ? `?page=${searchParams.page}` : ''}`,
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

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/news${page ? `?page=${page}` : ''}`,
        url: `${BASE_URL}/news${page ? `?page=${page}` : ''}`,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          name: 'News Breadcrumbs',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${BASE_URL}`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'News',
              item: `${BASE_URL}/news`,
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
            url: `${BASE_URL}/authors/${post.author.slug}`,
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
            <PaginationControls totalPosts={news.totalPosts} />
          </Suspense>
        )}
      </section>
    </>
  )
}
