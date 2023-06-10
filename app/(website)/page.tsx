import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/solid'

import { SocialMediaFollow, AuthorsCard } from '@components/common'
import { ArticleSection, FeaturedArticles, Hero } from '@components/home'
import { ArticleCard } from '@components/ui'
import { getLatestDivisionArticles } from '@lib/sanity.client'

export default async function Page() {
  const lastThreeFBSArticles = await getLatestDivisionArticles({ division: 'FBS' })
  const lastThreeFCSArticles = await getLatestDivisionArticles({ division: 'FCS' })
  const lastThreeD2Articles = await getLatestDivisionArticles({ division: 'D2' })
  const lastThreeD3Articles = await getLatestDivisionArticles({ division: 'D3' })

  return (
    <>
      <Hero />
      <section className="bg-zinc-800 py-12 sm:py-16 lg:py-20">
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
                    <ChevronRightIcon className="-mr-0.5 ml-1 h-5 w-5" />
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
                    parentCategory={article.parentCategory}
                    subcategory={article.subcategory}
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
                    <ChevronRightIcon className="-mr-0.5 ml-1 h-5 w-5" />
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
                    parentCategory={article.parentCategory}
                    subcategory={article.subcategory}
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
                    <ChevronRightIcon className="-mr-0.5 ml-1 h-5 w-5" />
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
                    parentCategory={article.parentCategory}
                    subcategory={article.subcategory}
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
