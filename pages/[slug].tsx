import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo, ArticleJsonLd, BreadcrumbJsonLd } from 'next-seo'

import { usePlausible } from 'next-plausible'
import { parseISO, format } from 'date-fns'

import { Layout } from '@components/common'
import {
  MorePosts,
  OtherAuthors,
  PostHeader,
  PostImage,
  WrittenBy,
} from '@components/post'
import { postSlugsQuery, postQuery } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'

interface PostProps {
  post: Post
  morePosts: Post[]
}

const Article = ({ post, morePosts }: PostProps) => {
  const plausible = usePlausible()
  let categoryName = 'FCS'

  post.categories.map((category) => {
    if (category === 'FBS') {
      categoryName = category
    }
  })
  return (
    <>
      <article>
        <div className="pt-10 lg:pt-16">
          <PostHeader
            title={post.title}
            publishedAt={post.publishedAt}
            category={categoryName}
            author={post.author}
            excerpt={post.excerpt}
            estimatedReadingTime={post.estimatedReadingTime}
          />
          <PostImage image={post.mainImage} />
          <div className="container mx-auto px-4 lg:px-32 flex flex-col my-10 lg:flex-row">
            <section className="w-full lg:w-3/5 xl:w-2/3 xl:pr-20">
              <div className="space-y-10">
                <div className="prose prose-slate prose-lg prose-a:text-indigo-600 hover:prose-a:text-indigo-500 !max-w-screen-md  mx-auto dark:prose-invert">
                  <PortableText blocks={post.body} />
                </div>
                <div className="max-w-screen-md mx-autor flex flex-wrap">
                  <Link href={`/${categoryName.toLowerCase()}`}>
                    <a className="nc-Tag inline-block bg-white text-sm py-2 px-3 rounded-lg border border-slate-300 md:py-2.5 md:px-4 dark:bg-slate-700 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-6000 mr-2 mb-2">
                      {categoryName}
                    </a>
                  </Link>
                </div>
                <div className="max-w-screen-md mx-auto border-b border-t border-slate-200 dark:border-slate-700" />
                <WrittenBy author={post.author} />
              </div>
            </section>
            <section className="w-full mt-12 lg:mt-0 lg:w-2/5 lg:pl-10 xl:pl-0 xl:w-1/3">
              <div className="space-y-6">
                <OtherAuthors otherAuthors={post.otherAuthors!} />
              </div>
            </section>
          </div>
          <MorePosts morePosts={morePosts} />
        </div>
      </article>
    </>
  )
}

Article.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { post, morePosts } = await getClient().fetch(postQuery, {
    slug: params?.slug,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
      morePosts: overlayDrafts(morePosts),
    },
    revalidate: 60, // In seconds
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export default Article
