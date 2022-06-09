import { useRouter } from 'next/router'
import Link from 'next/link'

import Layout from '@components/common/Layout'
import BlogCard from '@components/ui/BlogCard'
import BlurImage from '@components/ui/BlurImage'
import Loader from '@components/ui/Loader'
import { sanityClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import Date from '@components/ui/Date'
import { urlForImage, PortableText } from '@lib/sanity'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface PostProps {
  post: Post
  morePosts: Post[]
}

export default function Post({ post, morePosts }: PostProps) {
  const router = useRouter()

  if (router.isFallback) return <Loader />

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center">
        <div className="m-auto w-full text-center md:w-7/12">
          <p className="m-auto my-5 w-10/12 text-sm font-light md:text-base">
            <Date dateString={post.publishedAt.toString()} />
          </p>
          <h1 className="mb-10 font-cal text-3xl font-bold md:text-6xl">
            {post.title}
          </h1>
          <p className="text-md m-auto w-10/12 md:text-lg">{post.excerpt}</p>
        </div>
        <Link href={`/authors/${post.author.slug}`}>
          <a>
            <div className="my-8">
              <div className="relative inline-block h-8 w-8 overflow-hidden rounded-full align-middle md:h-12 md:w-12">
                {post.author.image ? (
                  <BlurImage
                    alt={post.author.name ?? 'Author Avatar'}
                    height={80}
                    width={80}
                    src={urlForImage(post.author.image)
                      .width(80)
                      .height(80)
                      .url()}
                  />
                ) : (
                  <div className="absolute flex h-full w-full select-none items-center justify-center bg-gray-100 text-4xl text-gray-500">
                    ?
                  </div>
                )}
              </div>
              <div className="text-md ml-3 inline-block align-middle md:text-lg">
                by <span className="font-semibold">{post?.author?.name}</span>
              </div>
            </div>
          </a>
        </Link>
      </div>
      <div className="lg:2/3 relative m-auto mb-10 h-80 w-full max-w-screen-lg overflow-hidden md:mb-20 md:h-150 md:w-5/6 md:rounded-2xl">
        {post.mainImage ? (
          <BlurImage
            alt={post.mainImage.caption ?? 'Post image'}
            layout="fill"
            objectFit="cover"
            placeholder="blur"
            blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
            src={urlForImage(post.mainImage).url()}
          />
        ) : (
          <div className="absolute flex h-full w-full select-none items-center justify-center bg-gray-100 text-4xl text-gray-500">
            ?
          </div>
        )}
      </div>
      <article className="prose-md prose prose-slate m-auto w-11/12 prose-a:text-indigo-600 hover:prose-a:text-indigo-500 dark:prose-invert dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-600 sm:prose-lg sm:w-3/4">
        <PortableText value={post.body} />
      </article>
      {morePosts.length > 0 && (
        <div className="relative mt-10 mb-20 sm:mt-20">
          <div
            className="absolute inset-0 flex items-center"
            aria-hidden="true"
          >
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm dark:bg-slate-900">
              Continue Reading
            </span>
          </div>
        </div>
      )}
      {morePosts && (
        <div className="mx-5 mb-20 grid max-w-screen-xl grid-cols-1 gap-x-4 gap-y-8 md:grid-cols-2 lg:mx-12 xl:grid-cols-3 2xl:mx-auto">
          {morePosts.map((data, index) => (
            <BlogCard key={index} data={data} />
          ))}
        </div>
      )}
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: posts.map((slug: string) => ({ params: { slug } })),
    fallback: true,
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) throw new Error('No path parameters found')

  const { slug } = params
  const { post, morePosts } = await sanityClient.fetch(postQuery, { slug })

  if (!post) {
    return {
      notFound: true,
      revalidate: 10,
    }
  }

  return {
    props: {
      post,
      morePosts,
    },
    revalidate: 3600,
  }
}
