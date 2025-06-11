import Link from 'next/link'

import Date from '@/components/date'
import ArticleCard from '@/components/article-card'
import CustomImage from '../sanity-image'

import { Post } from '@/types'

const Hero = ({ heroPosts }: { heroPosts: Post[] }) => {
  const heroArticle = heroPosts[0]!
  const recentArticles = heroPosts.slice(1)
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Link
              href={`/${heroArticle.slug}`}
              className="relative block aspect-[2/1] overflow-hidden rounded-lg shadow-md"
              prefetch={false}
            >
              <CustomImage
                image={heroArticle.mainImage}
                className="h-full w-full object-cover object-top"
              />
            </Link>
            <div className="mt-4 space-y-2">
              <h1 className="text-2xl font-bold lg:text-5xl">
                <Link href={`/${heroArticle.slug}`} prefetch={false}>
                  {heroArticle.title}
                </Link>
              </h1>
              <p className="text-muted-foreground line-clamp-2">{heroArticle.excerpt}</p>
              <div className="text-muted-foreground flex flex-wrap items-center space-x-2 text-base">
                <Link
                  href={`/authors/${heroArticle.author.slug}`}
                  className="flex items-center gap-2"
                  prefetch={false}
                >
                  <CustomImage
                    image={heroArticle.author.image}
                    // alt={`${heroArticle.author.name}'s profile picture`}
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                  <span className="text-primary">{heroArticle.author.name}</span>
                </Link>
                <Date dateString={heroArticle.publishedAt} />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
            {recentArticles.map((article) => (
              <ArticleCard
                title={article.title}
                conferences={article.conferences}
                division={article.division}
                date={article.publishedAt}
                image={article.mainImage}
                imagePriority={true}
                slug={article.slug}
                author={article.author.name}
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
