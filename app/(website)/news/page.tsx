import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { ArticleCard, Pagination } from '@components/ui'
import { PageHeader } from '@components/common'
import { getPaginatedPosts } from '@lib/sanity.client'
import { baseUrl, perPage } from '@lib/constants'
import { Org, Web } from '@lib/ldJson'

import type { Post } from '@types'
import { urlForImage } from '@lib/sanity.image'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const { page } = searchParams
  return {
    title: page ? `Latest College Football News - Page ${page}` : 'Latest College Football News',
    description:
      'Stay updated on exciting college football news with Redshirt Sports - your go to source for in-depth coverage and the latest updates!',
    openGraph: {
      title: page ? `Latest College Football News - Page ${page}` : 'Latest College Football News',
      description:
        'Stay updated on exciting college football news with Redshirt Sports - your go to source for in-depth coverage and the latest updates!',
      url: `${baseUrl}/news${page ? `?page=${page}` : ''}`,
    },
    alternates: {
      canonical: `${baseUrl}/news${page ? `?page=${page}` : ''}`,
    },
  }
}

export default async function Page({ searchParams }: { searchParams: { [key: string]: string } }) {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1
  const news = await getPaginatedPosts({ pageIndex })

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
          {news.posts.map((post: Post) => (
            <ArticleCard
              key={post._id}
              title={post.title}
              excerpt={post.excerpt}
              date={post.publishedAt}
              image={post.mainImage}
              slug={post.slug}
              division={post.division}
              conferences={post.conferences}
            />
          ))}
        </div>
        {totalPages > 1 && (
          <Pagination
            currentPage={pageIndex}
            totalPosts={news.totalPosts}
            nextDisabled={nextDisabled}
            prevDisabled={prevDisabled}
            slug="/news"
          />
        )}
      </section>
    </>
  )
}
