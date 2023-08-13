import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Hero, ArticleSection } from '@components/home'
import { ArticleCard } from '@components/ui'
import { getHomePage } from '@lib/sanity.client'
import { Org, Web } from '@lib/ldJson'
import { buttonVariants } from '@components/ui/Button'
import { cn } from '@lib/utils'

import type { Graph } from 'schema-dts'

const jsonLd: Graph = {
  '@context': 'https://schema.org',
  '@graph': [Org, Web],
}

export default async function Page() {
  const {
    heroArticle,
    recentArticles,
    latestArticles,
    fcsArticles,
    fbsArticles,
    d2Articles,
    d3Articles,
  } = await getHomePage()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero heroArticle={heroArticle} recentArticles={recentArticles} />
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="font-cal text-2xl">Latest News</h2>
            <Link
              href="/news"
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
                estimatedReadingTime={article.estimatedReadingTime}
              />
            ))}
          </div>
        </div>
      </section>
      <ArticleSection title="Latest FCS News" slug="/news/fcs" articles={fcsArticles} />
      <ArticleSection
        title="Latest FBS News"
        slug="/news/fbs"
        articles={fbsArticles}
        imageFirst={true}
      />
      <ArticleSection title="Latest D2 News" slug="/news/d2" articles={d2Articles} />
      {d3Articles.length > 0 && (
        <ArticleSection
          title="Latest D3 News"
          slug="/news/d3"
          articles={d3Articles}
          imageFirst={true}
        />
      )}
    </>
  )
}
