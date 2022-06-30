import { useRouter } from 'next/router'
import { Fragment } from 'react'
import Link from 'next/link'
import { CalendarIcon, ClockIcon } from '@heroicons/react/outline'

import { Layout } from '@components/common'
import { sanityClient, getClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { BlurImage, Date } from '@components/ui'

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
        <header>
          <div className="aspect-w-3 aspect-h-2 w-full bg-slate-100 sm:aspect-h-1">
            {currentPost.mainImage && (
              <BlurImage
                alt={currentPost?.mainImage.caption}
                src={urlForImage(currentPost?.mainImage).url()}
                layout="fill"
                priority
                blurDataURL={currentPost?.mainImage.asset.metadata.lqip ?? undefined}
              />
            )}
          </div>
          <div className="px-5 lg:px-0">
            <div className="prose mx-auto mb-8 border-b border-slate-300/70 pt-10 pb-8 text-lg sm:pt-16">
              <Link href={`/${currentPost.categories[0].toLowerCase()}`}>
                <a className="relative text-sm font-medium uppercase tracking-widest text-brand-500 duration-300 ease-in-out">
                  {currentPost.categories[0]}
                </a>
              </Link>
              <h1 className="mt-3 text-4xl font-medium text-slate-900 transition duration-300 ease-in-out sm:my-5 sm:text-4xl sm:leading-tight md:tracking-tight lg:text-5xl">
                {currentPost.title}
              </h1>
              <p className="mt-4 text-base leading-loose text-slate-600">{currentPost.excerpt}</p>
              <div className="mt-6 flex items-center sm:mt-8">
                <Link href={`/authors/${currentPost.author.name}`}>
                  <a className="mr-3 shrink-0">
                    <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-slate-100 sm:h-9 sm:w-9">
                      <BlurImage
                        alt={currentPost.author.name}
                        src={urlForImage(currentPost.author.image).width(40).height(40).url()}
                        blurDataURL={currentPost.author.image.asset.metadata.lqip ?? undefined}
                        width={36}
                        height={36}
                        layout="responsive"
                        className="rounded-xl"
                      />
                    </div>
                  </a>
                </Link>
                <div className="flex items-center text-sm lg:text-base">
                  <span className="hidden text-slate-500 sm:inline-block">By&nbsp;</span>
                  <Link href={`/authors/${currentPost.author.slug}`}>
                    <a className="font-medium text-slate-700">{currentPost.author.name}</a>
                  </Link>
                  <CalendarIcon className="ml-4 h-5 w-5 text-slate-400" />
                  <Date className="ml-1 text-slate-500" dateString={currentPost.publishedAt} />
                  <span className="hidden items-center sm:flex">
                    <ClockIcon className="ml-3 h-5 w-5 text-slate-400" />
                    <span className="ml-1 text-slate-500">{`${currentPost.estimatedReadingTime} min read`}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="px-5 lg:px-0">
          <div className="prose mx-auto sm:prose-lg">
            <PortableText value={currentPost?.body} />
          </div>
          <footer className="mx-auto mt-12 max-w-prose divide-y text-lg sm:mt-14">
            <div className="py-8 sm:py-10">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-slate-900">Share</span>
                <ul className="flex items-center space-x-3">
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        currentPost.title
                      )}&url=https://www.redshirtsports.xyz/${currentPost.slug}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition duration-300 ease-in-out sm:h-12 sm:w-12"
                    >
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 transform text-slate-700 transition duration-300 ease-in-out"
                      >
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://www.facebook.com/sharer.php?u=https://www.redshirtsports.xyz/${
                        currentPost.slug
                      }&quote=${encodeURIComponent(currentPost.title)}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 transition duration-300 ease-in-out sm:h-12 sm:w-12"
                    >
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 transform text-slate-700 transition duration-300 ease-in-out"
                      >
                        <path
                          fillRule="evenodd"
                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="py-8 sm:py-10">
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-col sm:flex-row">
                  <div className="shrink-0">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 sm:h-24 sm:w-24">
                      <BlurImage
                        alt={currentPost.author.name}
                        src={urlForImage(currentPost.author.image).width(100).height(100).url()}
                        blurDataURL={currentPost.author.image.asset.metadata.lqip ?? undefined}
                        layout="responsive"
                        className="rounded-2xl"
                        width={96}
                        height={96}
                      />
                    </div>
                  </div>
                  <div className="mt-5 text-left sm:ml-6 sm:mt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-col">
                        <span className="block text-sm uppercase tracking-widest text-brand-500">
                          {currentPost.author.role}
                        </span>
                        <span className="mt-1 text-xl font-medium tracking-normal text-slate-900 md:tracking-tight lg:leading-tight">
                          {currentPost.author.name}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-base leading-loose text-slate-500">
                      <PortableText value={currentPost.author.bio} />
                    </div>
                    <ul className="mt-3 flex items-center">
                      <li>
                        <a href={currentPost.author.twitterURL} target="_blank" rel="noreferrer">
                          <svg
                            fill="currentColor"
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            className="h-5 w-5 text-slate-400 transition duration-300 ease-in-out"
                          >
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </footer>
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

  const { currentPost, nextPost, previousPost, morePosts } = await getClient().fetch(postQuery, {
    slug: params?.slug,
  })

  if (!currentPost) {
    return {
      notFound: true,
      revalidate: 10,
    }
  }
  console.log(previousPost)
  console.log(nextPost)
  console.log(morePosts)

  return {
    props: {
      currentPost,
      nextPost,
    },
    revalidate: 3600,
  }
}
