import { GetStaticProps } from 'next'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { Layout, AdBanner } from '@components/common'
import { Hero, FeaturedArticleSection, ArticlesSection } from '@components/home'
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
              url: urlForImage(heroPost.mainImage)
                .width(800)
                .height(600)
                .url()!,
              width: 800,
              height: 600,
              alt: heroPost.title,
              type: 'image/jpeg',
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
            <AdBanner />
            <div className="bg-white rounded-lg shadow">
              <h2 className="h-11 mx-3 flex items-center justify-between text-base font-medium text-gray-900 border-b border-gray-300">
                Podcasts
              </h2>
              <div className="mt-6 flex flex-col overflow-hidden rounded-b-lg">
                <div className="flex-shrink-0 text-center">
                  <Image
                    src="/images/FCS_Nation_Logo.jpeg"
                    alt="FCS Nation Logo"
                    width="176"
                    height="176"
                  />
                </div>
                <div className="grid grid-cols-2 mb-6">
                  <a
                    href="https://podcasts.apple.com/us/podcast/fcs-nation/id1436799349?mt=2&ls=1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src="/images/US_UK_Apple_Podcasts_Listen_Badge_RGB.svg"
                      height="38"
                      width="185"
                      alt="Listen on Apple Podcasts"
                      quality="65"
                      layout="responsive"
                    />
                  </a>
                  <a
                    href="https://www.stitcher.com/show/fcs-nation"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Image
                      src="/images/stitcher_logo.svg"
                      height="38"
                      width="185"
                      alt="Listen on Stitcher"
                      quality="65"
                      layout="responsive"
                    />
                  </a>
                </div>
              </div>
            </div>
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
