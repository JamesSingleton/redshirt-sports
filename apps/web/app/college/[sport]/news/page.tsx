import { notFound } from "next/navigation";

import { sanityFetch } from "@/lib/sanity/live";
import { querySportsNews } from "@/lib/sanity/query";
import type { Metadata } from "next"
import { perPage } from "@/lib/constants";
import PageHeader from "@/components/page-header";
import ArticleFeed from "@/components/article-feed";
import PaginationControls from "@/components/pagination-controls";

async function fetchSportsNews({ sport, pageIndex }: {sport: string; pageIndex: number}) {
  return await sanityFetch({
    query: querySportsNews,
    params: {
      sport,
      pageIndex
    }
  })
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `College Football News & Updates | ${process.env.NEXT_PUBLIC_APP_NAME}`
  }
}

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport } = await params
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const {data: news } = await fetchSportsNews({ sport, pageIndex })

  if (!news) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  return (
    <>
      <PageHeader title="Latest College News" breadcrumbs={breadcrumbs} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <ArticleFeed articles={news.posts} />
        {totalPages > 1 && (
          <PaginationControls totalPosts={news.totalPosts} />
        )}
      </section>
    </>
  )
}