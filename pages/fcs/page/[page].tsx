import { Layout } from '@components/common'
import { totalFCSPosts, fcsPostsQuery } from '@lib/queries'
import { getClient } from '@lib/sanity.server'
import BlogCard from '@components/ui/BlogCard'
import { CategoryHeader } from '@components/category'
import { HorizontalCard, Pagination } from '@components/ui'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'
import { ParsedUrlQuery } from 'querystring'

interface fcsProps {
  posts: Post[]
  pagination: {
    totalPages: number
    currentPage: number
  }
}

interface Params extends ParsedUrlQuery {
  page: string
}

export default function FCSIndexPage({ posts, pagination }: fcsProps) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 lg:py-24 xl:px-32">
        <div className="relative mb-4 flex flex-col">
          <CategoryHeader
            heading="FCS Football"
            subHeading="NCAA Division 1 Football Championship Subdivision"
          />
        </div>
        <div className="grid w-full grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
          {posts && posts.map((post) => <BlogCard key={post.title} data={post} />)}
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            basePath="/fcs"
          />
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

export const getStaticProps: GetStaticProps = async (context) => {
  const params = context.params as Params
  const { page } = params
  const { posts, pagination } = await getClient().fetch(fcsPostsQuery, {
    pageIndex: parseInt(page) - 1,
  })

  return {
    props: {
      posts,
      pagination,
    },
  }
}
