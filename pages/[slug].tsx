import { useRouter } from 'next/router'
import { Fragment } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

import { sanityClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { Layout } from '@components/common'
import { urlForImage, PortableText } from '@lib/sanity'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

import { ChatAltIcon, PlusSmIcon } from '@heroicons/react/solid'

interface PostProps {
  post: Post
  morePosts: Post[]
}

const whoToFollow = [
  {
    name: 'Leonard Krasner',
    handle: 'leonardkrasner',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Leonard Krasner',
    handle: 'leonardkrasner',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    name: 'Leonard Krasner',
    handle: 'leonardkrasner',
    href: '#',
    imageUrl:
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
]
const trendingPosts = [
  {
    id: 1,
    user: {
      name: 'Floyd Miles',
      imageUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    body: 'What books do you have on your bookshelf just to look smarter than you actually are?',
    comments: 291,
  },
  {
    id: 2,
    user: {
      name: 'Floyd Miles',
      imageUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    body: 'What books do you have on your bookshelf just to look smarter than you actually are?',
    comments: 291,
  },
  {
    id: 3,
    user: {
      name: 'Floyd Miles',
      imageUrl:
        'https://images.unsplash.com/photo-1463453091185-61582044d556?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    },
    body: 'What books do you have on your bookshelf just to look smarter than you actually are?',
    comments: 291,
  },
]

export default function Post({ post, morePosts }: PostProps) {
  return (
    <Layout>
      <div className="py-10">
        <div className="mx-auto max-w-3xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-12 lg:gap-8 lg:px-8">
          <main className="lg:col-span-8">
            <article>
              <div className="prose-md prose prose-slate m-auto prose-a:text-indigo-600 hover:prose-a:text-indigo-500 dark:prose-invert dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-600 sm:prose-lg">
                <PortableText value={post?.body} />
              </div>
            </article>
          </main>
          <aside className="hidden xl:col-span-4 xl:block">
            <div className="sticky top-4 space-y-4">
              <section aria-labelledby="who-to-follow-heading">
                <div className="rounded-lg bg-white shadow">
                  <div className="p-6">
                    <h2 id="who-to-follow-heading" className="text-base font-medium text-gray-900">
                      Who to follow
                    </h2>
                    <div className="mt-6 flow-root">
                      <ul role="list" className="-my-4 divide-y divide-gray-200">
                        {whoToFollow.map((user) => (
                          <li key={user.handle} className="flex items-center space-x-3 py-4">
                            <div className="flex-shrink-0">
                              <img className="h-8 w-8 rounded-full" src={user.imageUrl} alt="" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                <a href={user.href}>{user.name}</a>
                              </p>
                              <p className="text-sm text-gray-500">
                                <a href={user.href}>{'@' + user.handle}</a>
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                type="button"
                                className="inline-flex items-center rounded-full bg-rose-50 px-3 py-0.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                              >
                                <PlusSmIcon
                                  className="-ml-1 mr-0.5 h-5 w-5 text-rose-400"
                                  aria-hidden="true"
                                />
                                <span>Follow</span>
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <a
                        href="#"
                        className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        View all
                      </a>
                    </div>
                  </div>
                </div>
              </section>
              <section aria-labelledby="trending-heading">
                <div className="rounded-lg bg-white shadow">
                  <div className="p-6">
                    <h2 id="trending-heading" className="text-base font-medium text-gray-900">
                      Trending
                    </h2>
                    <div className="mt-6 flow-root">
                      <ul role="list" className="-my-4 divide-y divide-gray-200">
                        {trendingPosts.map((post) => (
                          <li key={post.id} className="flex space-x-3 py-4">
                            <div className="flex-shrink-0">
                              <img
                                className="h-8 w-8 rounded-full"
                                src={post.user.imageUrl}
                                alt={post.user.name}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-800">{post.body}</p>
                              <div className="mt-2 flex">
                                <span className="inline-flex items-center text-sm">
                                  <button
                                    type="button"
                                    className="inline-flex space-x-2 text-gray-400 hover:text-gray-500"
                                  >
                                    <ChatAltIcon className="h-5 w-5" aria-hidden="true" />
                                    <span className="font-medium text-gray-900">
                                      {post.comments}
                                    </span>
                                  </button>
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-6">
                      <a
                        href="#"
                        className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        View all
                      </a>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </div>
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
