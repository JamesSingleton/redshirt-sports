import { getHomePage } from '@lib/sanity.client'
import Hero from '@components/home/Hero'
import ArticleSection from '@components/home/ArticleSection'
import FeaturedArticles from '@components/home/FeaturedArticles'
import SocialMediaFollow from '@components/common/SocialMediaFollow'

export default async function IndexRoute() {
  const [posts] = await Promise.all([getHomePage()])

  return (
    <main>
      <Hero mainArticle={posts.mainArticle} recentArticles={posts.recentArticles} />
      <section className="relative mx-auto max-w-7xl py-12 md:py-16 lg:py-20 lg:px-8">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="col-span-2">
            <ArticleSection otherArticles={posts.otherArticles} />
          </div>
          <div className="mx-auto mt-12 w-full max-w-xl space-y-8 px-4 sm:mt-16 sm:px-6 md:max-w-3xl md:px-8 lg:col-span-1 lg:mt-0 lg:max-w-none lg:px-0">
            <FeaturedArticles featuredArticles={posts.featuredArticles} />
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </main>
  )
}
