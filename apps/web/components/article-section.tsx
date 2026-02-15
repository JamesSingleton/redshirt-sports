import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

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
    <section className="pb-10 lg:pb-14">
      <div className="container">
        {/* Section header with accent bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold uppercase tracking-wide text-foreground">{title}</h2>
          </div>
          <Link
            href={slug}
            className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            prefetch={false}
          >
            View All
            <span className="sr-only"> {title}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Featured article */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={imageFirst ? 'lg:order-2' : 'lg:order-1'}>
            <Link href={`/${firstArticle.slug}`} prefetch={false} className="group block">
              <div className="relative aspect-video overflow-hidden rounded-lg">
                <CustomImage
                  image={firstArticle.mainImage}
                  width={860}
                  height={573}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>
          <div className={`flex flex-col justify-center ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
            <h3 className="mb-3 text-balance text-2xl font-extrabold leading-tight tracking-tight lg:text-3xl">
              <Link
                href={`/${firstArticle.slug}`}
                className="transition-colors hover:text-primary"
                prefetch={false}
              >
                {firstArticle.title}
              </Link>
            </h3>
            <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground lg:text-base">
              {firstArticle.excerpt}
            </p>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link
                href={`/authors/${firstArticle.authors[0]?.slug}`}
                className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
                prefetch={false}
              >
                <CustomImage
                  image={firstArticle.authors[0]?.image}
                  width={28}
                  height={28}
                  className="size-7 rounded-full"
                />
                {firstArticle.authors[0]?.name}
              </Link>
              {firstArticle.publishedAt && (
                <>
                  <span className="text-border" aria-hidden="true">{'/'}</span>
                  <FormatDate dateString={firstArticle.publishedAt} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Article grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
