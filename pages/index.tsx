import { GetStaticProps } from 'next'
import { Layout } from '@components/common'
import { Hero, FeaturedArticleSection, ArticlesSection } from '@components/home'
import { indexQuery } from '@lib/sanityGroqQueries'
import { getClient } from '@lib/sanity.server'

interface HomeProps {
  allPosts: [
    {
      _id: string
      _updatedAt: string
      author: {
        name: string
        image: string
        slug: string
      }
      mainImage: string
      publishedAt: string
      slug: string
      title: string
      category: {
        title: string
        description: string
      }
    }
  ]
}
function Home({ allPosts }: HomeProps) {
  const heroPost = allPosts[0]
  const morePosts = allPosts.slice(1)

  return (
    <div className="sm:py-10 max-w-3xl mx-auto sm:px-6 lg:max-w-8xl lg:px-8 lg:grid lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-9">
        <Hero post={heroPost} />
      </div>
      <aside className="px-4 py-4 sm:px-0 lg:py-0 lg:col-span-3">
        <div className="sticky top-28 space-y-4">
          <ArticlesSection />
          <FeaturedArticleSection />
        </div>
      </aside>
    </div>
  )
}

Home.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const allPosts = await getClient().fetch(indexQuery)

  return {
    props: {
      allPosts,
    },
  }
}

export default Home
