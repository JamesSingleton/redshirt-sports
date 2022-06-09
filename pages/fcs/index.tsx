import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Card } from '@components/ui'
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
              <Card
                key={post.title}
                post={post}
                location="FCS"
                showExcerpt={true}
              />
            ))}
        </div>
        <nav
          className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
          aria-label="Pagination"
        >
          <div className="hidden sm:block">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{' '}
              <span className="font-medium">10</span> of{' '}
              <span className="font-medium">20</span> results
            </p>
          </div>
          <div className="flex flex-1 justify-between sm:justify-end">
            <a
              href="#"
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Previous
            </a>
            <a
              href="#"
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Next
            </a>
          </div>
        </nav>
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
