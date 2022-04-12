import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import Parser from 'rss-parser'
import { Layout } from '@components/common'
import { Hero, Podcasts, LatestArticles } from '@components/home'
import { homePageQuery } from '@lib/sanityGroqQueries'
import { getClient } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'
import { SITE_URL } from '@lib/constants'

interface HomeProps {
  heroPosts: Post[]
  latestPosts: Post[]
  featuredArticle: Post
  topThreePodcasts: []
}
function Home({
  heroPosts,
  latestPosts,
  featuredArticle,
  topThreePodcasts,
}: HomeProps) {
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
        <button
          type="button"
          onClick={() => {
            throw new Error('Sentry Frontend Error')
          }}
        >
          Throw error
        </button>
        <Hero posts={heroPosts} featuredArticle={featuredArticle} />
        <LatestArticles posts={latestPosts} />
        <Podcasts podcasts={topThreePodcasts} />
      </div>
    </>
  )
}

Home.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const { heroPosts, featuredArticle, latestPosts } = await getClient().fetch(
    homePageQuery
  )
  const feed = await new Parser().parseURL(
    'https://media.rss.com/fcsnation/feed.xml'
  )

  const topThreePodcasts = feed.items.slice(0, 3)

  return {
    props: {
      heroPosts,
      latestPosts,
      featuredArticle,
      topThreePodcasts,
    },
    revalidate: 86400, // Revalidate every hour
  }
}

export default Home
