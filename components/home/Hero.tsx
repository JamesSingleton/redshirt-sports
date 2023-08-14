import Link from 'next/link'

import { ArticleCard, ImageComponent, Date } from '@components/ui'
import { badgeVariants } from '@components/ui/Badge'
import { Post } from '@types'

const Hero = ({ heroArticle, recentArticles }: { heroArticle: Post; recentArticles: Post[] }) => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Link
              href={`/${heroArticle.slug}`}
              className="aspect-h-1 aspect-w-2 relative block overflow-hidden rounded-xl shadow-md"
            >
              <ImageComponent
                image={heroArticle.mainImage}
                alt={heroArticle.mainImage.caption}
                width={363}
                height={181}
              />
            </Link>
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap space-x-2 py-2">
                {heroArticle.division && (
                  <Link
                    href={`/news/${heroArticle.division.slug}`}
                    className={badgeVariants({ variant: 'default' })}
                  >
                    {heroArticle.division.name}
                  </Link>
                )}
                {heroArticle.conferences &&
                  heroArticle.conferences.map((conference) => (
                    <Link
                      href={`/news/${heroArticle.division.slug}/${conference.slug}`}
                      key={conference._id}
                      className={badgeVariants({ variant: 'default' })}
                    >
                      {conference.shortName ?? conference.name}
                    </Link>
                  ))}
              </div>
              <h1 className="font-cal text-2xl lg:text-5xl">
                <Link href={`/${heroArticle.slug}`}>{heroArticle.title}</Link>
              </h1>
              <p className="line-clamp-2 text-muted-foreground">{heroArticle.excerpt}</p>
              <div className="flex flex-wrap items-center space-x-2 text-base text-muted-foreground">
                <Link
                  href={`/authors/${heroArticle.author.slug}`}
                  className="flex items-center gap-2"
                >
                  <ImageComponent
                    image={heroArticle.author.image}
                    alt={heroArticle.author.name}
                    width={44}
                    height={44}
                    className="h-11 w-11 rounded-full"
                  />
                  <span className="text-primary">{heroArticle.author.name}</span>
                </Link>
                <Date dateString={heroArticle.publishedAt} />
                <span>{heroArticle.estimatedReadingTime} min</span>
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
                slug={article.slug}
                author={article.author}
                key={article._id}
                estimatedReadingTime={article.estimatedReadingTime}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
