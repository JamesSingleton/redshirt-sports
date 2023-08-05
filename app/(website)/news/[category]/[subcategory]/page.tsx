import { notFound } from 'next/navigation'
import { Graph } from 'schema-dts'

import { ArticleCard, Pagination } from '@components/ui'
import { PageHeader } from '@components/common'
import { getConferenceBySlug } from '@lib/sanity.client'
import { baseUrl, perPage } from '@lib/constants'
import { Org, Web } from '@lib/ldJson'
import { urlForImage } from '@lib/sanity.image'

import type { Metadata } from 'next'
import type { Post } from '@types'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { [key: string]: string }
  searchParams: { [key: string]: string }
}): Promise<Metadata> {
  const { page } = searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const conference = await getConferenceBySlug({ slug: params.subcategory, pageIndex })

  if (!conference) {
    return {}
  }

  let title = `${conference?.name} Football, Rumors, and More`
  let canonical = `${baseUrl}/news/${conference.division.slug}/${conference?.slug}`
  if (pageIndex > 1) {
    title = `${conference?.name} Football, Rumors, and More - Page ${pageIndex}`
    canonical = `${baseUrl}/news/${conference.division.slug}/${conference.slug}?page=${pageIndex}`
  }

  return {
    title,
    description: conference?.description,
    openGraph: {
      title,
      description: conference?.description,
      url: canonical,
      siteName: 'Redshirt Sports',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: `/api/og?title=Redshirt Sports ${conference.name} News`,
          width: '1200',
          height: '630',
          alt: 'Redshirt Sports Logo',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: conference?.description,
    },
    alternates: {
      canonical,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { category: string; subcategory: string }
  searchParams: { [key: string]: string }
}) {
  const pageIndex = searchParams.page ? parseInt(searchParams.page) : 1
  const conference = await getConferenceBySlug({ slug: params.subcategory, pageIndex })
  if (!conference) {
    return notFound()
  }

  const totalPages = Math.ceil(conference.totalPosts / perPage)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

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
        '@id': `${baseUrl}/news/${params.category}/${params.subcategory}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
        url: `${baseUrl}/news/${params.category}/${params.subcategory}${
          pageIndex ? `?page=${pageIndex}` : ''
        }`,
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
            {
              '@type': 'ListItem',
              position: 3,
              name: conference.division.name,
              item: `${baseUrl}/news/${params.category}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: conference.shortName ?? conference.name,
              item: `${baseUrl}/news/${params.category}/${params.subcategory}`,
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
      <PageHeader title={title} breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
          {conference.posts.map((post: Post) => (
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
            totalPosts={conference.totalPosts}
            nextDisabled={nextDisabled}
            prevDisabled={prevDisabled}
            slug={`/news/${params.category}/${params.subcategory}`}
          />
        )}
      </section>
    </>
  )
}
