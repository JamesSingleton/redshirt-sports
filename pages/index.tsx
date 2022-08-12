import Head from 'next/head'

import { Layout, SocialMediaFollow, SEO } from '@components/common'
import { Hero, FeaturedArticles, ArticleSection, MostRead } from '@components/home'
import { sanityClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import { SITE_URL } from '@lib/constants'
import { Organization, WebSite } from '@lib/ldJson'

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
  const content = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: 'Redshirt Sports',
        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },
        about: {
          '@id': `${SITE_URL}/#organization`,
        },
        dateModified: mainArticle._updatedAt,
        description:
          'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
        breadcrumb: {
          '@id': `${SITE_URL}/#breadcrumb`,
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: [SITE_URL],
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/#breadcrumb`,
        name: 'Home Breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
        ],
      },
    ],
  }
  return (
    <>
      <Head>
        <script
          id="home-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(content),
          }}
        />
      </Head>
      <SEO canonical="https://www.redshirtsports.xyz" />
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
  const response = await fetch(
    'https://plausible.io/api/v1/stats/breakdown?site_id=redshirtsports.xyz&period=6mo&property=event:page&limit=5',
    {
      headers: {
        Authorization: `Bearer ${process.env.PLAUSIBLE_API_TOKEN}`,
      },
    }
  )

  const topArticles = await response
    .json()
    .then((res) =>
      res.results
        .filter((result: { page: string }) => result.page !== '/')
        .map((result: { page: string }) => result.page.replace('/', ''))
    )

  const { mainArticle, recentArticles, otherArticles, featuredArticles, mostReadArticles } =
    await sanityClient.fetch(homePageQuery, {
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
