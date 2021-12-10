import { GetStaticProps } from 'next'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { Layout, AdBanner } from '@components/common'
import {
  Hero,
  FeaturedArticleSection,
  ArticlesSection,
  Podcasts,
} from '@components/home'
import { homePageQuery } from '@lib/sanityGroqQueries'
import { getClient } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { SITE_URL } from '@lib/constants'

interface HomeProps {
  heroPost: Post
  morePosts: Post[]
  featuredArticles: Post[]
}
function Home({ heroPost, morePosts, featuredArticles }: HomeProps) {
  return (
    <>
      <NextSeo
        canonical={SITE_URL}
        openGraph={{
          images: [
            {
              url: '/images/icons/RS_horizontal_513x512.png',
              width: 513,
              height: 512,
              alt: 'Redshirt Sports',
              type: 'image/png',
            },
          ],
        }}
      />
      <div className="sm:py-10 max-w-3xl mx-auto sm:px-6 lg:max-w-8xl lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-9">
          <Hero post={heroPost} />
        </div>
        <aside className="px-4 py-4 sm:px-0 lg:py-0 lg:col-span-3">
          <div className="sticky top-28 space-y-4">
            {morePosts.length > 0 && <ArticlesSection posts={morePosts} />}
            <Podcasts />
            <AdBanner adSlot={9178230911} />
            {featuredArticles.length > 0 && <FeaturedArticleSection />}
          </div>
        </aside>
      </div>
    </>
  )
}

Home.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { heroPost, morePosts, featuredArticles } = await getClient().fetch(
    homePageQuery
  )

  return {
    props: {
      heroPost,
      morePosts,
      featuredArticles,
    },
    revalidate: 3600, // Revalidate every hour
  }
}

export default Home
