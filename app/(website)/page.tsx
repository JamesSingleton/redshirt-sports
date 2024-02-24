import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Hero, ArticleSection } from '@components/home'
import { ArticleCard } from '@components/common'
import {
  getHeroPosts,
  getLatestArticlesForHomePage,
  getLatestDivisionArticlesForHomePage,
} from '@lib/sanity.fetch'
import { Org, Web } from '@lib/ldJson'
import { buttonVariants } from '@components/ui/Button'
import { cn } from '@lib/utils'
import { defineMetadata } from '@lib/utils.metadata'

import type { Graph } from 'schema-dts'
import type { Metadata } from 'next'

const jsonLd: Graph = {
  '@context': 'https://schema.org',
  '@graph': [Org, Web],
}

const defaultMetadata = defineMetadata({
  title: 'Your Hub for College Football: FCS, FBS, D2, D3, Transfers, News, and Analysis',
  description:
    'Explore the diverse realm of college football at Redshirt Sports. From FCS to FBS, D2 to D3, stay updated on news, analysis, and the latest in transfers.',
})

export const metadata: Metadata = {
  ...defaultMetadata,
  openGraph: {
    ...defaultMetadata.openGraph,
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Redshirt Sports',
      },
    ],
  },
  twitter: {
    ...defaultMetadata.twitter,
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Redshirt Sports',
      },
    ],
  },
}

export default async function Page() {
  const heroPosts = await getHeroPosts()
  const latestArticles = await getLatestArticlesForHomePage()
  const articleIds = [...heroPosts, ...latestArticles].map((article) => article._id)

  const fcsArticles = await getLatestDivisionArticlesForHomePage('FCS', articleIds)
  const fbsArticles = await getLatestDivisionArticlesForHomePage('FBS', articleIds)
  const d2Articles = await getLatestDivisionArticlesForHomePage('D2', articleIds)
  const d3Articles = await getLatestDivisionArticlesForHomePage('D3', articleIds)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero heroPosts={heroPosts} />
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
                author={article.author}
                key={article._id}
              />
            ))}
          </div>
        </div>
      </section>
      <ArticleSection title="FCS College Football News" slug="/news/fcs" articles={fcsArticles} />
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
      {d3Articles.length > 0 && (
        <ArticleSection
          title="Division III (D3) Football News"
          slug="/news/d3"
          articles={d3Articles}
          imageFirst={true}
        />
      )}
    </>
  )
}
