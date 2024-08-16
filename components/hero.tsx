import Link from 'next/link'

import Date from '@/components/date'
import ArticleCard from '@/components/article-card'
import { badgeVariants } from '@/components/ui/badge'
import { Image } from '@/components/image'

import { Post } from '@/types'
import { imageBuilder } from '@/lib/sanity.image'

const Hero = ({ heroPosts }: { heroPosts: Post[] }) => {
  const heroArticle = heroPosts[0]
  const recentArticles = heroPosts.slice(1)
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Link
              href={`/${heroArticle.slug}`}
              className="aspect-h-1 aspect-w-2 relative block overflow-hidden rounded-lg shadow-md"
              prefetch={false}
            >
              <Image
                src={heroArticle.mainImage as any}
                alt={heroArticle.mainImage.caption}
                width={800}
                height={400}
                className="object-cover object-top"
                priority
              />
            </Link>
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap space-x-2 py-2">
                {heroArticle.division && (
                  <Link
                    href={`/news/${heroArticle.division.slug}`}
                    className={badgeVariants({ variant: 'default' })}
                    prefetch={false}
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
                      prefetch={false}
                    >
                      {conference.shortName ?? conference.name}
                    </Link>
                  ))}
              </div>
              <h1 className="text-2xl font-bold lg:text-5xl">
                <Link href={`/${heroArticle.slug}`} prefetch={false}>
                  {heroArticle.title}
                </Link>
              </h1>
              <p className="line-clamp-2 text-muted-foreground">{heroArticle.excerpt}</p>
              <div className="flex flex-wrap items-center space-x-2 text-base text-muted-foreground">
                <Link
                  href={`/authors/${heroArticle.author.slug}`}
                  className="flex items-center gap-2"
                  prefetch={false}
                >
                  <Image
                    src={heroArticle.author.image as any}
                    alt={`${heroArticle.author.name}'s profile picture`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full"
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
