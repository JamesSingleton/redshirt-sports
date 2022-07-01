import { useRouter } from 'next/router'
import { Fragment } from 'react'

import { Layout } from '@components/common'
import { sanityClient, getClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { BlurImage, Date } from '@components/ui'
import { PostHeader, PostFooter } from '@components/post'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface PostProps {
  currentPost: Post
  nextPost: Post
}

export default function Post({ currentPost, nextPost }: PostProps) {
  return (
    <Layout>
      <article className="bg-slate-50 pb-12 sm:pb-16 lg:pb-24">
        <PostHeader post={currentPost} />
        <div className="px-5 lg:px-0">
          <div className="prose mx-auto sm:prose-lg">
            <PortableText value={currentPost?.body} />
          </div>
          <PostFooter
            author={currentPost.author}
            title={currentPost.title}
            slug={currentPost.slug}
          />
        </div>
      </article>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) throw new Error('No path parameters found')

  const { currentPost, nextPost, previousPost } =
    (await getClient().fetch(postQuery, {
      slug: params?.slug,
    })) || {}

  if (!currentPost || currentPost === null) {
    return {
      notFound: true,
      revalidate: 10,
    }
  }

  return {
    props: {
      currentPost,
      nextPost,
    },
    revalidate: 3600,
  }
}
