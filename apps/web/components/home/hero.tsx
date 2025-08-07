import Link from 'next/link'

import Date from '@/components/date'
import ArticleCard from '@/components/article-card'
import CustomImage from '../sanity-image'
import { QueryHomePageDataResult } from '@/lib/sanity/sanity.types'

const Hero = ({ heroPosts }: { heroPosts: QueryHomePageDataResult }) => {
  const heroArticle = heroPosts[0]!
  const recentArticles = heroPosts.slice(1)

  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative aspect-[2/1] overflow-hidden rounded-lg shadow-md">
              <CustomImage
                image={heroArticle.mainImage}
                className="h-full w-full object-cover object-top"
              />
            </div>
            <div className="mt-4 space-y-2">
              <h1 className="text-2xl font-bold lg:text-5xl">
                <Link href={`/${heroArticle.slug}`} prefetch={false}>
                  {heroArticle.title}
                </Link>
              </h1>
              <p className="text-muted-foreground line-clamp-2">{heroArticle.excerpt}</p>
              <div className="text-muted-foreground flex flex-wrap items-center space-x-2 text-base">
                <Link
                  href={`/authors/${heroArticle.authors[0]?.slug}`}
                  className="flex items-center gap-2"
                  prefetch={false}
                >
                  <CustomImage
                    image={heroArticle.authors[0]?.image}
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                  <span className="text-primary">{heroArticle.authors[0]?.name}</span>
                </Link>
                <Date dateString={heroArticle.publishedAt} />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
            {recentArticles.map((article) => (
              <ArticleCard
                title={article.title}
                date={article.publishedAt}
                image={article.mainImage}
                imagePriority={true}
                slug={article.slug}
                author={article.authors[0]!.name}
                key={article._id}
                headingLevel="h2"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
