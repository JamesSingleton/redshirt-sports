import { NextSeo } from 'next-seo'

import Layout from '@components/common/Layout/Layout'
import { Hero } from '@components/home'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import { SITE_URL } from '@lib/constants'

import type { GetStaticProps } from 'next'
import type { Post } from '@types'

interface HomePageProps {
  heroPost: Post
  latestPosts: Post[]
  featuredArticle: Post
}

export default function Home({ heroPost, latestPosts, featuredArticle }: HomePageProps) {
  return (
    <>
      <NextSeo canonical={SITE_URL} />
      <Layout>
        <main>
          <Hero heroPost={heroPost} latestPosts={latestPosts} />
          <section className="w-full bg-slate-50 pb-14 pt-12 md:py-20 lg:pt-24">
            <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
              <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-[#DC2727]">
                Trending topics
              </h2>
            </div>
          </section>
        </main>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const { heroPost, featuredArticle, latestPosts } = await getClient().fetch(homePageQuery)

  return {
    props: {
      heroPost,
      latestPosts,
      featuredArticle,
    },
  }
}
