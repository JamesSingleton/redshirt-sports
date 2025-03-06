import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import Hero from '@/components/home/hero'
import { sanityFetch } from '@/lib/sanity/live'

import { type Metadata } from "next"
import ArticleCard from '@/components/article-card'

async function fetchHomePageData() {
  return await sanityFetch({
    query: `
*[_type == "post" && featuredArticle != true] | order(publishedAt desc)[0...3]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    mainImage{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    },
    publishedAt,
    division->{
      name,
      "slug": slug.current
    },
    conferences[]->{
      name,
      "slug": slug.current,
      shortName
    },
    author->{
      name,
      "slug": slug.current,
      image
    },
    authors[]->{
      name,
      "slug": slug.current,
      image
    }
}
`
  })
}

async function fetchLatestArticles() {
  return await sanityFetch({
    query: `
*[_type == "post" && featuredArticle != true] | order(publishedAt desc)[3..6]{
    _id,
    title,
    excerpt,
    "slug": slug.current,
    mainImage{
      ...,
      "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
      "blurData": asset->metadata.lqip,
      "dominantColor": asset->metadata.palette.dominant.background,
      "credit": coalesce(asset->creditLine, attribution, "Unknown"),
    },
    publishedAt,
    division->{
      name,
      "slug": slug.current
    },
    conferences[]->{
      name,
      "slug": slug.current,
      shortName
    },
    author->{
      name,
      "slug": slug.current,
      image
    },
    authors[]->{
      name,
      "slug": slug.current,
      image
    }
}
`
  })
}

export const metadata: Metadata = {
  title: "Home Page",
  description: "The home page of the website",
}

export default async function HomePage() {
  const {data: homePageData} = await fetchHomePageData()
  const {data: latestArticles} = await fetchLatestArticles()

  return (
    <>
      <Hero heroPosts={homePageData} />
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Latest News</h2>
            <Link
              href="/news"
              prefetch={false}
              className={cn(buttonVariants({ variant: 'default' }), 'flex items-center space-x-2')}
            >
              <span className="text-sm">View All</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latestArticles.map((article) => (
              <ArticleCard
                title={article.title}
                conferences={article.conferences}
                division={article.division}
                date={article.publishedAt}
                image={article.mainImage}
                slug={article.slug}
                key={article._id}
                author={article.author.name}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
