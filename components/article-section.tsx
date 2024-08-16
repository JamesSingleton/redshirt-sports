import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

import Date from '@/components/date'
import ArticleCard from '@/components/article-card'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Image as SanityImage } from '@/components/image'

import { Post } from '@/types'

interface ArticleSectionProps {
  title: string
  slug: string
  articles: Post[]
  imageFirst?: boolean
}

export default function ArticleSection({
  title,
  slug,
  articles,
  imageFirst = false,
}: ArticleSectionProps) {
  const firstArticle = articles[0]
  const remainingArticles = articles.slice(1)

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
              <div className="flex items-center gap-2 text-muted-foreground">
                <Link
                  href={`/authors/${firstArticle.author.slug}`}
                  className="flex items-center gap-2 text-primary"
                  prefetch={false}
                >
                  <SanityImage
                    src={firstArticle.author.image as any}
                    alt={`${firstArticle.author.name}'s profile picture`}
                    width={48}
                    height={48}
                    className="mr-2 h-12 w-12 rounded-full"
                  />
                  {firstArticle.author.name}
                </Link>
                <Date dateString={firstArticle.publishedAt} />
              </div>
            </div>
          </div>
          <div className={cn('md:w-1/2 xl:w-2/3', imageFirst ? 'md:order-1' : 'md:order-2')}>
            <SanityImage
              src={firstArticle.mainImage as any}
              alt={firstArticle.mainImage.caption}
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
              conferences={article.conferences}
              division={article.division}
              date={article.publishedAt}
              image={article.mainImage}
              slug={article.slug}
              author={article.author.name}
              key={article._id}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
