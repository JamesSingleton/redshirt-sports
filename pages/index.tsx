import Link from 'next/link'
import { NextSeo } from 'next-seo'

import Layout from '@components/common/Layout/Layout'
import { Hero } from '@components/home'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import BlogCard from '@components/ui/BlogCard'
import BlurImage from '@components/ui/BlurImage'
import { urlForImage } from '@lib/sanity'
import Date from '@components/ui/Date'
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
        <main className="pt-10">
          <Hero />
          {latestPosts.length > 1 && (
            <div className="mx-5 mb-20 max-w-screen-xl lg:mx-24 2xl:mx-auto">
              <h2 className="mb-10 font-cal text-4xl md:text-5xl">More stories</h2>
              <div className="grid w-full grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                {latestPosts.map((metadata, index) => (
                  <BlogCard key={index} data={metadata} />
                ))}
              </div>
            </div>
          )}
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
