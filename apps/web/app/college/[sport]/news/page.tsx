import { notFound } from "next/navigation";

import { sanityFetch } from "@/lib/sanity/live";
import { querySportsNews } from "@/lib/sanity/query";
import { perPage } from "@/lib/constants";
import PageHeader from "@/components/page-header";
import ArticleFeed from "@/components/article-feed";
import PaginationControls from "@/components/pagination-controls";

import type { Metadata } from "next"

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

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ sport: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { sport } = await params
  const sportTitleCase = sport.charAt(0).toUpperCase() + sport.slice(1)
  const { page } = await searchParams
  const pageIndex = page !== undefined ? parseInt(page) : 1

  const {data: news } = await fetchSportsNews({ sport, pageIndex })  

  if (!news.posts.length) {
    notFound()
  }

  const totalPages = Math.ceil(news.totalPosts / perPage)

  return (
    <>
      <PageHeader title={`Latest College ${sportTitleCase} News`} />
      <section className="container pb-12">
        <ArticleFeed articles={news.posts} sport={sport} />
        {totalPages > 1 && (
          <PaginationControls totalPosts={news.totalPosts} />
        )}
      </section>
    </>
  )
}