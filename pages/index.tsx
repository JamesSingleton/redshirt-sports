import { GetStaticProps } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Hero, Podcasts, LatestArticles } from '@components/home'
import { homePageQuery } from '@lib/sanityGroqQueries'
import { getClient } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'
import { SITE_URL } from '@lib/constants'
import generateRssFeed from '@lib/generateRssFeed'
import { urlForImage } from '@lib/sanity'

interface HomeProps {
  heroPosts: Post[]
  latestPosts: Post[]
  featuredArticle: Post
}
function Home({ heroPosts, latestPosts, featuredArticle }: HomeProps) {
  return (
    <>
      <NextSeo
        canonical={SITE_URL}
        openGraph={{
          images: [
            {
              url: 'https://www.redshirtsports.xyz/images/icons/RS_horizontal_513x512.png',
              width: 513,
              height: 512,
              alt: 'Redshirt Sports',
              type: 'image/png',
            },
          ],
        }}
      />
      <div className="container relative mx-auto px-4 py-12">
        <Hero posts={heroPosts} featuredArticle={featuredArticle} />
        <LatestArticles posts={latestPosts} />
        <Podcasts />
      </div>
    </>
  )
}

Home.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const { heroPosts, featuredArticle, latestPosts } = await getClient().fetch(
    homePageQuery
  )
  await generateRssFeed()

  return {
    props: {
      heroPosts,
      latestPosts,
      featuredArticle,
    },
    revalidate: 86400, // Revalidate every hour
  }
}

export default Home
