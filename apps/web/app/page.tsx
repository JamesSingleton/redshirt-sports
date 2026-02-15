import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { buttonVariants } from '@redshirt-sports/ui/components/button'
import { cn } from '@redshirt-sports/ui/lib/utils'

import Hero from '@/components/home/hero'
import { sanityFetch } from '@redshirt-sports/sanity/live'
import {
  queryHomePageData,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
} from '@redshirt-sports/sanity/queries'
import ArticleCard from '@/components/article-card'
import ArticleSection from '@/components/article-section'
import { WebPage, WithContext } from 'schema-dts'
import { JsonLdScript, organizationId, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'
import { getSEOMetadata } from '@/lib/seo'

import type { Metadata } from 'next'

async function fetchHomePageData() {
  return await sanityFetch({
    query: queryHomePageData,
  })
}

async function fetchLatestArticles() {
  return await sanityFetch({
    query: queryLatestArticles,
  })
}

async function fetchLatestCollegeSportsArticles({
  division,
  sport,
  articleIds,
}: {
  division: string
  sport: string
  articleIds: string[]
}) {
  return await sanityFetch({
    query: queryLatestCollegeSportsArticles,
    params: { division, sport, articleIds },
  })
}

const divisions = [
  {
    key: 'fbs',
    division: 'Football Bowl Subdivision',
    title: 'FBS College Football News',
    slug: '/college/football/news/fbs',
    imageFirst: false,
  },
  {
    key: 'fcs',
    division: 'Football Championship Subdivision',
    title: 'FCS College Football News',
    slug: '/college/football/news/fcs',
    imageFirst: false,
  },
  {
    key: 'd2',
    division: 'D2',
    title: 'Division II Football News',
    slug: '/college/football/news/d2',
    imageFirst: false,
  },
  {
    key: 'd3',
    division: 'D3',
    title: 'Division III Football News',
    slug: '/college/football/news/d3',
    imageFirst: true,
  },
]

const baseUrl = getBaseUrl()

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata()
}

export default async function HomePage() {
  const [{ data: homePageData }, { data: latestArticles }] = await Promise.all([
    fetchHomePageData(),
    fetchLatestArticles(),
  ])

  const articleIds = [...homePageData, ...latestArticles].map((article) => article._id)

  const collegeSportsResults = await Promise.all(
    divisions.map(({ division }) =>
      fetchLatestCollegeSportsArticles({
        division,
        sport: 'Football',
        articleIds,
      }),
    ),
  )

  const divisionsWithArticles = divisions.map((division, index) => ({
    ...division,
    articles: collegeSportsResults[index]?.data,
  }))

  const sectionOrder = ['fbs', 'fcs', 'd2', 'd3']

  const webPageJson: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': baseUrl,
    url: baseUrl,
    isPartOf: {
      '@type': 'WebSite',
      '@id': websiteId,
    },
    about: {
      '@id': organizationId,
    },
    inLanguage: 'en-US',
    datePublished: '2021-12-13T00:00:00-07:00',
    dateModified: homePageData[0]?.publishedAt || new Date().toISOString(),
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
      ],
    },
  }

  return (
    <>
      <JsonLdScript data={webPageJson} id="home-webpage-json-ld" />
      <Hero heroPosts={homePageData} />

      {/* Transfer Portal Feature Banner */}
      <section className="bg-primary py-8 lg:py-10">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="text-center md:text-left">
              <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-primary-foreground lg:text-3xl">
                College Football Transfer Portal
              </h2>
              <p className="text-sm text-primary-foreground/80 lg:text-base">
                Track all transfer portal entries, commitments, and player movements in real-time
              </p>
            </div>
            <Link
              href="/transfer-portal"
              prefetch={false}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'font-bold',
              )}
            >
              View Transfer Portal
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestArticles.length > 0 && (
        <section className="py-10 lg:py-14">
          <div className="container">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-block h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
                <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">Latest News</h2>
              </div>
              <Link
                href="/college/news"
                prefetch={false}
                className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
              >
                View All
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestArticles.map((article) => (
                <ArticleCard
                  title={article.title}
                  date={article.publishedAt}
                  image={article.mainImage}
                  slug={article.slug}
                  key={article._id}
                  author={article.authors[0]!.name}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {sectionOrder.map((key) => {
        const section = divisionsWithArticles.find((d) => d.key === key)
        if (!section || section.articles === undefined) return null

        return (
          <ArticleSection
            key={section.key}
            title={section.title}
            slug={section.slug}
            articles={section.articles}
            imageFirst={section.imageFirst}
          />
        )
      })}
    </>
  )
}
