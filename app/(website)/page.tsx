import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import { Hero } from '@components/home'
import { ArticleCard } from '@components/ui'
import { Date, ImageComponent } from '@components/ui'
import { getHeroPost, getLatestDivisionArticles } from '@lib/sanity.client'
import { Org, Web } from '@lib/ldJson'

import type { Graph } from 'schema-dts'

const jsonLd: Graph = {
  '@context': 'https://schema.org',
  '@graph': [Org, Web],
}

export default async function Page() {
  const lastThreeFBSArticles = await getLatestDivisionArticles({ division: 'FBS' })
  const lastThreeFCSArticles = await getLatestDivisionArticles({ division: 'FCS' })
  const lastThreeD2Articles = await getLatestDivisionArticles({ division: 'D2' })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <section className="bg-secondary py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-16">
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">FBS</h2>
                <div className="shrink-0">
                  <Link
                    href="/news/fbs"
                    className="group inline-flex items-center bg-brand-500 px-4 py-2 text-base font-semibold text-white hover:bg-brand-600 hover:text-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    View all
                    <span className="sr-only">FBS Articles</span>
                    <ChevronRight className="-mr-0.5 ml-1 h-5 w-5" />
                  </Link>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
                {lastThreeFBSArticles.map((article: any) => (
                  <ArticleCard
                    key={article._id}
                    title={article.title}
                    excerpt={article.excerpt}
                    date={article.publishedAt}
                    image={article.mainImage}
                    slug={article.slug.current}
                    division={article.division}
                    conferences={article.conferences}
                  />
                ))}
              </div>
            </div>
            <hr className="border-zinc-200" />
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">FCS</h2>
                <div className="shrink-0">
                  <Link
                    href="/news/fcs"
                    className="group inline-flex items-center bg-brand-500 px-4 py-2 text-base font-semibold text-white hover:bg-brand-600 hover:text-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    View all
                    <span className="sr-only">FCS Articles</span>
                    <ChevronRight className="-mr-0.5 ml-1 h-5 w-5" />
                  </Link>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
                {lastThreeFCSArticles.map((article: any) => (
                  <ArticleCard
                    key={article._id}
                    title={article.title}
                    excerpt={article.excerpt}
                    date={article.publishedAt}
                    image={article.mainImage}
                    slug={article.slug.current}
                    division={article.division}
                    conferences={article.conferences}
                  />
                ))}
              </div>
            </div>
            <hr className="border-zinc-200" />
            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">D2</h2>
                <div className="shrink-0">
                  <Link
                    href="/news/d2"
                    className="group inline-flex items-center bg-brand-500 px-4 py-2 text-base font-semibold text-white hover:bg-brand-600 hover:text-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  >
                    View all
                    <span className="sr-only">D2 Articles</span>
                    <ChevronRight className="-mr-0.5 ml-1 h-5 w-5" />
                  </Link>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
                {lastThreeD2Articles.map((article: any) => (
                  <ArticleCard
                    key={article._id}
                    title={article.title}
                    excerpt={article.excerpt}
                    date={article.publishedAt}
                    image={article.mainImage}
                    slug={article.slug.current}
                    division={article.division}
                    conferences={article.conferences}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
