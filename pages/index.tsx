import { NextSeo } from 'next-seo'

import { Layout, SocialMediaFollow } from '@components/common'
import { Hero, FeaturedArticles, ArticleSection, MostRead } from '@components/home'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import { SITE_URL } from '@lib/constants'

import type { GetStaticProps } from 'next'
import type { Post } from '@types'

interface HomePageProps {
  mainArticle: Post
  recentArticles: Post[]
  otherArticles: Post[]
  featuredArticles: Post[]
  mostReadArticles: Post[]
}

export default function Home({
  mainArticle,
  recentArticles,
  otherArticles,
  featuredArticles,
  mostReadArticles,
}: HomePageProps) {
  return (
    <>
      <NextSeo canonical={SITE_URL} />
      <Layout>
        <Hero mainArticle={mainArticle} recentArticles={recentArticles} />
        <section className="relative mx-auto max-w-7xl py-12 md:py-16 lg:py-20 lg:px-8">
          <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="col-span-2">
              <ArticleSection otherArticles={otherArticles} />
            </div>
            <div className="mx-auto mt-12 w-full max-w-xl space-y-8 px-4 sm:mt-16 sm:px-6 md:max-w-3xl md:px-8 lg:col-span-1 lg:mt-0 lg:max-w-none lg:px-0">
              <FeaturedArticles featuredArticles={featuredArticles} />
              <SocialMediaFollow />
              <MostRead mostReadArticles={mostReadArticles} />
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const topArticles = await fetch(
    'https://plausible.io/api/v1/stats/breakdown?site_id=redshirtsports.xyz&period=6mo&property=event:page&limit=5',
    {
      headers: {
        Authorization: `Bearer ${process.env.PLAUSIBLE_API_TOKEN}`,
      },
    }
  )
    .then(async (res) => res.json())
    .then((res) =>
      res.results
        .filter((result: { page: string }) => result.page !== '/')
        .map((result: { page: string }) => result.page.replace('/', ''))
    )

  const { mainArticle, recentArticles, otherArticles, featuredArticles, mostReadArticles } =
    await getClient().fetch(homePageQuery, {
      topArticles: topArticles,
    })

  return {
    props: {
      mainArticle,
      recentArticles,
      otherArticles,
      featuredArticles,
      mostReadArticles,
    },
  }
}
