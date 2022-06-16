import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Card, Pagination } from '@components/ui'
import { CategoryHeader, EmptyState } from '@components/category'
import { getClient } from '@lib/sanity.server'
import { allFCSPosts, fcsPostsQuery } from '@lib/queries'
import type { Post } from '@lib/types/post'

interface fcsProps {
  posts: Post[]
}

const FCS = ({ posts }: fcsProps) => {
  return (
    <Layout>
      <NextSeo
        title="FCS Football"
        description="All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision"
        canonical="https://www.redshirtsports.xyz/fcs"
        openGraph={{
          title: 'FCS Football - Redshirt Sports',
          description:
            'All Articles by Redshirt Sports on NCAA Division 1 Football Championship Subdivision',
        }}
      />
      <div className="container mx-auto px-4 py-12 lg:py-24 xl:px-32">
        <div className="relative mb-4 flex flex-col">
          <CategoryHeader
            heading="FCS Football"
            subHeading="NCAA Division 1 Football Championship Subdivision"
          />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts &&
            posts.map((post) => (
              <Card key={post.title} post={post} location="FCS" showExcerpt={true} />
            ))}
        </div>
        <div className="mt-10">
          <Pagination />
        </div>
      </div>
    </Layout>
  )
}

FCS.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { posts } = await getClient().fetch(fcsPostsQuery, {
    pageIndex: 0,
  })

  return {
    props: {
      posts,
    },
  }
}

export default FCS
