import { Layout } from '@components/common'
import { totalFCSPosts, fcsPostsQuery } from '@lib/queries'
import { getClient } from '@lib/sanity.server'
import { Card } from '@components/ui'
import { CategoryHeader } from '@components/category'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface fcsProps {
  posts: Post[]
}

export default function FCSIndexPage({ posts }: fcsProps) {
  return (
    <Layout>
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
      </div>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const totalPosts = await getClient().fetch(totalFCSPosts)
  const totalPages = Math.ceil(totalPosts / 10)

  const paths = []

  for (let page = 2; page <= totalPages; page++) {
    paths.push({ params: { page: page.toString() } })
  }

  return {
    paths,
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async ({ params: { page } }) => {
  const { posts } = await getClient().fetch(fcsPostsQuery, {
    pageIndex: page - 1,
  })

  return {
    props: {
      posts,
    },
  }
}
