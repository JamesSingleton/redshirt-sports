import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { buttonVariants } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'

import Hero from '@/components/home/hero'
import { sanityFetch } from '@/lib/sanity/live'
import {
  queryHomePageData,
  queryLatestArticles,
  queryLatestCollegeSportsArticles,
} from '@/lib/sanity/query'
import ArticleCard from '@/components/article-card'
import ArticleSection from '@/components/article-section'
import { WebPage, WithContext } from 'schema-dts'
import { JsonLdScript, organizationId, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'

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
    division: 'FBS',
    title: 'FBS College Football News',
    slug: '/college/football/news/fbs',
    imageFirst: false,
  },
  {
    key: 'fcs',
    division: 'FCS',
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

  const sectionOrder = ['fcs', 'fbs', 'd2', 'd3']

  const webPageJson: WithContext<WebPage> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': baseUrl,
    url: baseUrl,
    isPartOf: {
      '@id': websiteId,
    },
    about: {
      '@id': organizationId,
    },
    inLanguage: 'en-US',
    datePublished: '2021-12-13T00:00:00-07:00',
    dateModified: homePageData[0]?.publishedAt,
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
      {latestArticles.length > 0 && (
        <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
          <div className="container">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Latest News</h2>
              <Link
                href="/college/news"
                prefetch={false}
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'flex items-center space-x-2',
                )}
              >
                <span className="text-sm">View All</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestArticles &&
                latestArticles.map((article) => (
                  <ArticleCard
                    title={article.title}
                    date={article.publishedAt}
                    image={article.mainImage}
                    slug={article.slug}
                    key={article._id}
                    author={article.author!.name}
                  />
                ))}
            </div>
          </div>
        </section>
      )}
      {sectionOrder.map((key) => {
        const section = divisionsWithArticles.find((d) => d.key === key)
        if (!section) return null

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
