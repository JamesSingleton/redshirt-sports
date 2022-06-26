import { useRouter } from 'next/router'
import { Fragment } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

import { Layout } from '@components/common'
import { sanityClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { BlurImage } from '@components/ui'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface PostProps {
  post: Post
}

export default function Post({ post }: PostProps) {
  return (
    <Layout>
      <article className="bg-slate-50 pb-12 sm:pb-16 lg:pb-24">
        <header>
          <div className="aspect-w-3 aspect-h-2 w-full bg-slate-100 sm:aspect-h-1">
            {post.mainImage && (
              <BlurImage
                alt={post?.mainImage.caption}
                src={urlForImage(post?.mainImage).url()}
                layout="fill"
                priority
                blurDataURL={post?.mainImage.asset.metadata.lqip ?? undefined}
              />
            )}
          </div>
          <div className="px-5 lg:px-0">
            <div className="mx-auto mb-8 max-w-[65ch] border-b border-slate-300/70 pt-10 pb-8 text-lg sm:pt-16">
              <Link href={`/${post.categories[0].toLowerCase()}`}>
                <a className="relative text-sm font-medium uppercase tracking-widest text-brand-500 duration-300 ease-in-out">
                  {post.categories[0]}
                </a>
              </Link>
              <h1 className="mt-3 text-4xl font-medium text-slate-900 transition duration-300 ease-in-out sm:my-5 sm:text-4xl sm:leading-tight md:tracking-tight lg:text-5xl">
                {post.title}
              </h1>
              <p className="mt-4 text-base leading-loose text-slate-600">{post.excerpt}</p>
              <div className="mt-6 flex items-center sm:mt-8">
                <Link href={`/authors/${post.author.name}`}>
                  <a className="mr-3 shrink-0">
                    <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-slate-100 sm:h-9 sm:w-9">
                      <BlurImage
                        alt={post.author.name}
                        src={urlForImage(post.author.image).width(40).height(40).url()}
                        blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                        width={36}
                        height={36}
                        layout="responsive"
                        className="rounded-xl"
                      />
                    </div>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </header>
      </article>
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
  const { post } = await sanityClient.fetch(postQuery, { slug })
  console.log(post.title)

  if (!post) {
    return {
      notFound: true,
      revalidate: 10,
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 3600,
  }
}
