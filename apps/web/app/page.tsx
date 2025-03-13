import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import Hero from '@/components/home/hero'
import { sanityFetch } from '@/lib/sanity/live'
import ArticleCard from '@/components/article-card'
import ArticleSection from '@/components/article-section'

import { type Metadata } from "next"

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

async function fetchLatestCollegeSportsArticles({division, sport, articleIds}: {division: string, sport: string, articleIds: string[]}) {
  return await sanityFetch({
    query: `
*[_type == "post" && division->name == $division && sport->title match $sport && !(_id in $articleIds)] | order(publishedAt desc)[0..4]{
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
    authors[]->{
      name,
      "slug": slug.current,
      image{
        ...,
        "alt": coalesce(asset->altText, asset->originalFilename, "Image-Broken"),
        "blurData": asset->metadata.lqip,
        "dominantColor": asset->metadata.palette.dominant.background,
        "credit": coalesce(asset->creditLine, attribution, "Unknown"),
      },
    }
  }`,
    params: {division, sport, articleIds}
  })
}

export const metadata: Metadata = {
  title: "Home Page",
  description: "The home page of the website",
}

export default async function HomePage() {
  const {data: homePageData} = await fetchHomePageData()
  const {data: latestArticles} = await fetchLatestArticles()

  const articleIds = [...homePageData, ...latestArticles].map((article) => article._id)

  const {data: fbsArticles} = await fetchLatestCollegeSportsArticles({division: "FBS", sport: "Football", articleIds})
  const {data: fcsArticles} = await fetchLatestCollegeSportsArticles({division: "FCS", sport: "Football", articleIds})
  const {data: d2Articles} = await fetchLatestCollegeSportsArticles({division: "D2", sport: "Football", articleIds})
  const {data: d3Articles} = await fetchLatestCollegeSportsArticles({division: "D3", sport: "Football", articleIds})

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
      <ArticleSection title="FCS College Football News" slug="/college/football/news/fcs" articles={fcsArticles} />
      <ArticleSection
        title="FBS College Football News"
        slug="/news/fbs"
        articles={fbsArticles}
        imageFirst={true}
      />
      <ArticleSection
        title="Division II (D2) Football News"
        slug="/news/d2"
        articles={d2Articles}
      />
      <ArticleSection
          title="Division III (D3) Football News"
          slug="/news/d3"
          articles={d3Articles}
          imageFirst={true}
        />
    </>
  )
}
