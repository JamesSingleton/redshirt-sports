import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@redshirt-sports/ui/lib/utils'
import { buttonVariants } from '@redshirt-sports/ui/components/button'

import FormatDate from '@/components/format-date'
import ArticleCard from '@/components/article-card'
import CustomImage from '@/components/sanity-image'

import type { QueryLatestCollegeSportsArticlesResult, Author } from '@redshirt-sports/sanity/types'

interface ArticleSectionProps {
  title: string
  slug: string
  articles: QueryLatestCollegeSportsArticlesResult
  imageFirst?: boolean
}

export default function ArticleSection({
  title,
  slug,
  articles,
  imageFirst = false,
}: ArticleSectionProps) {
  const firstArticle = articles[0]!
  const remainingArticles = articles.slice(1)!

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
      <div className="container">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <Link
            href={slug}
            className={cn(buttonVariants({ variant: 'default' }), 'flex items-center space-x-2')}
            prefetch={false}
          >
            <span className="text-sm">View All</span>
            <span className="sr-only">the {title}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-col gap-4 pt-4 md:flex-row">
          <div
            className={cn(
              'order-1 md:flex md:w-1/2 md:items-center xl:w-1/3',
              imageFirst ? 'md:order-2' : 'md:order-1',
            )}
          >
            <div className="space-y-2 md:flex-1">
              <h3 className="text-3xl font-semibold lg:text-4xl">
                <Link
                  href={`/${firstArticle.slug}`}
                  className="hover:underline hover:decoration-2 hover:underline-offset-1"
                  prefetch={false}
                >
                  {firstArticle.title}
                </Link>
              </h3>
              <p className="text-muted-foreground">{firstArticle.excerpt}</p>
              <div className="text-muted-foreground flex items-center gap-2">
                <Link
                  href={`/authors/${firstArticle.authors[0]?.slug}`}
                  className="text-primary flex items-center gap-2"
                  prefetch={false}
                >
                  <CustomImage
                    image={firstArticle.authors[0]?.image}
                    width={32}
                    height={32}
                    className="mr-2 size-8 rounded-full"
                  />
                  {firstArticle.authors[0]?.name}
                </Link>
                {firstArticle.publishedAt && <FormatDate dateString={firstArticle.publishedAt} />}
              </div>
            </div>
          </div>
          <div className={cn('md:w-1/2 xl:w-2/3', imageFirst ? 'md:order-1' : 'md:order-2')}>
            <CustomImage
              image={firstArticle.mainImage}
              width={860}
              height={573}
              className="w-full overflow-hidden rounded-lg shadow-md"
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {remainingArticles.map((article) => (
            <ArticleCard
              title={article.title}
              date={article.publishedAt}
              image={article.mainImage}
              slug={article.slug}
              author={(article.authors[0] as unknown as Author)?.name}
              key={article._id}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
