import Head from 'next/head'

import { Layout, SEO } from '@components/common'
import { sanityClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableTextComponent } from '@lib/sanity'
import { PostHeader, PostFooter } from '@components/post'
import { createPostLDJson } from '@lib/createLDJson'
import { VerticalArticleCard, Tweet } from '@components/ui'
import { getTweets } from '@lib/twitter'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface PostProps {
  currentPost: Post
  morePosts: Post[]
}

export default function Post({ currentPost, morePosts }: PostProps) {
  const content = createPostLDJson(currentPost)
  return (
    <>
      <Head>
        <script
          id={`${currentPost.title}-ld-json`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(content),
          }}
        />
      </Head>
      <SEO
        title={currentPost.title}
        description={currentPost.excerpt}
        canonical={`https://www.redshirtsports.xyz/${currentPost.slug}`}
        openGraph={{
          url: `https://www.redshirtsports.xyz/${currentPost.slug}`,
          title: currentPost.title,
          description: currentPost.excerpt,
          type: 'article',
          article: {
            publishedTime: currentPost.publishedAt,
            modifiedTime: currentPost._updatedAt,
            section: currentPost.category,
            authors: [`https://www.redshirtsports.xyz/authors/${currentPost.author.slug}`],
          },
          images: [
            {
              url: urlForImage(currentPost.mainImage).width(1200).height(630).url(),
              width: '1200',
              height: '630',
              alt: currentPost.mainImage.caption,
            },
          ],
        }}
      />
      <Layout>
        <article className="bg-slate-50 pb-12 sm:pb-16 lg:pb-24">
          <PostHeader post={currentPost} />
          <div className="px-5 lg:px-0">
            <div className="prose-md prose m-auto w-11/12 prose-a:text-blue-600 hover:prose-a:text-blue-500 sm:prose-lg sm:w-3/4">
              <PortableTextComponent value={currentPost.body} />
            </div>
            <PostFooter
              author={currentPost.author}
              title={currentPost.title}
              slug={currentPost.slug}
            />
          </div>
        </article>
        <section className="mx-auto w-full max-w-7xl pb-14 pt-12 sm:py-20 lg:pt-24">
          <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
            <h2 className="relative border-b border-slate-300 pb-2 font-cal text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
              Related Articles
            </h2>
            <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
              {morePosts.map((post) => (
                <VerticalArticleCard key={post._id} article={post} />
              ))}
            </div>
          </div>
        </section>
      </Layout>
    </>
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

  const { currentPost, morePosts } =
    (await sanityClient.fetch(postQuery, {
      slug: params?.slug,
    })) || {}

  if (!currentPost || currentPost === null) {
    return {
      notFound: true,
    }
  }

  const enriched = []

  for (const block of currentPost.body) {
    if (block._type === 'twitter') {
      const tweetData = await getTweets(block.id)
      enriched.push({
        ...block,
        metadata: tweetData,
      })
      continue
    }
    enriched.push(block)
  }

  currentPost.body = enriched

  return {
    props: {
      currentPost,
      morePosts,
    },
  }
}
