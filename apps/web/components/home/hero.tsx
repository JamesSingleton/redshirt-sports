import Link from 'next/link'

import FormatDate from '@/components/format-date'
import ArticleCard from '@/components/article-card'
import CustomImage from '../sanity-image'
import { QueryHomePageDataResult } from '@redshirt-sports/sanity/types'

const Hero = ({ heroPosts }: { heroPosts: QueryHomePageDataResult }) => {
  const heroArticle = heroPosts[0]!
  const recentArticles = heroPosts.slice(1)

  return (
    <section className="pt-6 pb-10 lg:pt-8 lg:pb-14">
      <div className="container">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-block h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
            Top Stories
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Featured Hero Article */}
          <div className="lg:col-span-2">
            <Link
              href={`/${heroArticle.slug}`}
              prefetch={false}
              className="group block"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                <CustomImage
                  image={heroArticle.mainImage}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                  <h1 className="mb-2 text-balance text-2xl font-extrabold tracking-tight text-white drop-shadow-lg lg:text-4xl">
                    {heroArticle.title}
                  </h1>
                  <p className="mb-3 line-clamp-2 text-sm text-white/85 lg:text-base">
                    {heroArticle.excerpt}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex items-center gap-2">
                      <CustomImage
                        image={heroArticle.authors[0]?.image}
                        width={28}
                        height={28}
                        className="size-7 rounded-full ring-2 ring-white/30"
                      />
                      <span className="font-medium">{heroArticle.authors[0]?.name}</span>
                    </div>
                    {heroArticle.publishedAt && (
                      <>
                        <span className="text-white/50" aria-hidden="true">{'|'}</span>
                        <FormatDate dateString={heroArticle.publishedAt} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Sidebar Recent Articles */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1">
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
                variant="compact"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
