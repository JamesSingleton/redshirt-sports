import ArticleFeed from '@/components/article-feed'
import PageHeader from '@/components/page-header'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'

import type { Metadata } from 'next'

async function fetchCollegeNews({ pageIndex }: { pageIndex: number }) {
  return await sanityFetch({
    query: `{
      "posts": *[_type == "post"] | order(publishedAt desc)[(($pageIndex - 1) * ${perPage})...$pageIndex * ${perPage}] {
        title,
        slug,
        publishedAt,
        sport-> {
          title
        },
        author-> {
          name,
          image
        },
        mainImage {
          asset-> {
            url
          }
        }
      },
      "totalPosts": count(*[_type == "post" && sport->title match "College"])
    }`,
    params: {
      pageIndex,
    },
  })
}

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
      <PageHeader title="College Sports News" />
      <section className="container pb-12">
        <ArticleFeed articles={posts} />
        {totalPages > 1 && <PaginationControls totalPosts={totalPosts} />}
      </section>
    </>
  )
}
