import { Fragment } from 'react'
import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo, ArticleJsonLd, BreadcrumbJsonLd } from 'next-seo'
import { CameraIcon, HomeIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { ShareIcon, DuplicateIcon, InboxIcon } from '@heroicons/react/outline'
import { usePlausible } from 'next-plausible'
import { Menu, Transition } from '@headlessui/react'
import { Layout } from '@components/common'
import { PostHeader, RelatedArticles } from '@components/post'
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
          <header className="container mx-auto px-4">
            <div className="max-w-screen-md mx-auto">
              <div className="space-y-5">
                <div className="flex flex-wrap space-x-2">
                  <a
                    href={`/${categoryName.toLowerCase()}`}
                    className="transition-colors hover:text-white duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600"
                  >
                    {categoryName}
                  </a>
                </div>
                <h1 className="text-slate-900 dark:text-slate-50 font-semibold text-3xl md:text-4xl lg:text-5xl max-w-4xl">
                  {post.title}
                </h1>
                <span className="block text-base md:text-lg pb-1">
                  {post.excerpt}
                </span>
                <div className="w-full border-b border-slate-100 dark:border-slate-800" />
                <div className="flex flex-col sm:flex-row justify-between sm:items-end space-y-5 sm:space-y-0 sm:space-x-5">
                  <div className="flex items-center flex-wrap text-slate-700 text-left dark:text-slate-200 text-sm leading-none shrink-0">
                    <a className="flex items-center space-x-2" href="#">
                      <div className="relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-full h-10 w-10 sm:h-11 sm:w-11 text-xl ring-1 ring-white dark:ring-slate-900">
                        <Image
                          className="absolute inset-0 w-full h-full object-cover"
                          src={urlForImage(post.author.image).url()!}
                          alt={`Profile image of ${post.author.name}`}
                          width={44}
                          height={44}
                        />
                      </div>
                    </a>
                    <div className="ml-3">
                      <div className="flex items-center">
                        <a className="block font-semibold" href="#">
                          {post.author.name}
                        </a>
                      </div>
                      <div className="text-xs mt-2">
                        <span>May 20, 2021</span>
                        <span className="mx-2 font-semibold">·</span>
                        <span>6 min read</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row space-x-2.5 items-center">
                    <Menu as="div" className="relative inline-block text-left">
                      <Menu.Button className="flex items-center justify-center rounded-full h-9 w-9 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900">
                        <ShareIcon aria-hidden="true" className="h-5 w-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 w-56 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="px-1 py-1 ">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-slate-500 text-white'
                                      : 'text-slate-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  {active ? (
                                    <svg
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5 mr-2"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5 mr-2"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  Facebook
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-slate-500 text-white'
                                      : 'text-slate-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  {active ? (
                                    <svg
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5 mr-2"
                                    >
                                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                  ) : (
                                    <svg
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                      className="h-5 w-5 mr-2"
                                    >
                                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                  )}
                                  Twitter
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-slate-500 text-white'
                                      : 'text-slate-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  {active ? (
                                    <DuplicateIcon
                                      className="w-5 h-5 mr-2"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <DuplicateIcon
                                      className="w-5 h-5 mr-2"
                                      aria-hidden="true"
                                    />
                                  )}
                                  Copy Link
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  className={`${
                                    active
                                      ? 'bg-slate-500 text-white'
                                      : 'text-slate-900'
                                  } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                >
                                  {active ? (
                                    <InboxIcon
                                      className="w-5 h-5 mr-2"
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <InboxIcon
                                      className="w-5 h-5 mr-2"
                                      aria-hidden="true"
                                    />
                                  )}
                                  Email
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <div className="container my-10 sm:my-12 mx-auto px-4 xl:px-32">
            <figure>
              <Image
                className="object-cover w-full h-full rounded-md"
                src={urlForImage(post.mainImage).width(1280).height(606).url()!}
                width={1280}
                height={606}
                alt={post.mainImage.caption}
                layout="responsive"
                sizes="50vw"
              />
              <figcaption className="mt-3 ml-3 flex text-sm">
                <CameraIcon className="flex-none w-5 h-5" aria-hidden="true" />
                <span className="ml-2">{`Source: ${post.mainImage.attribution}`}</span>
              </figcaption>
            </figure>
          </div>
          <div className="container mx-auto px-4 lg:px-32 flex flex-col my-10 lg:flex-row">
            <section className="w-full lg:w-3/5 xl:w-2/3 xl:pr-20">
              <div className="space-y-10">
                <div className="prose prose-slate prose-lg prose-a:text-indigo-600 hover:prose-a:text-indigo-500 !max-w-screen-md  mx-auto dark:prose-dark">
                  <PortableText blocks={post.body} />
                </div>
                <div className="max-w-screen-md mx-autor flex flex-wrap">
                  <Link href={`/${categoryName.toLowerCase()}`}>
                    <a className="nc-Tag inline-block bg-white text-sm text-slate-600 py-2 px-3 rounded-lg border border-slate-100 md:py-2.5 md:px-4 dark:bg-slate-700 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-6000 mr-2 mb-2">
                      {categoryName}
                    </a>
                  </Link>
                </div>
                <div className="max-w-screen-md mx-auto border-b border-2 border-slate-100 dark:border-slate-700" />
                <div className="max-w-screen-md mx-auto">
                  <div className="flex">
                    <Link
                      href={`/authors/${post.author.slug}`}
                      prefetch={false}
                    >
                      <a>
                        <div className="wil-avatar relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-xl h-12 w-12 text-lg sm:text-xl sm:h-24 sm:w-24 ring-1 ring-white dark:ring-slate-900">
                          <Image
                            className="absolute inset-0 w-full h-full object-cover"
                            src={urlForImage(post.author.image).url()!}
                            alt={`Profile image of ${post.author.name}`}
                            width={96}
                            height={96}
                          />
                        </div>
                      </a>
                    </Link>
                    <div className="flex flex-col ml-3 max-w-lg sm:ml-5">
                      <span className="text-xs uppercase tracking-wider">
                        written by
                      </span>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        <Link
                          href={`/authors/${post.author.slug}`}
                          prefetch={false}
                        >
                          <a>{post.author.name}</a>
                        </Link>
                      </h2>
                      <span className="text-sm sm:text-base">
                        <PortableText
                          blocks={post.author.bio}
                          className="line-clamp-1"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full mt-12 lg:mt-0 lg:w-2/5 lg:pl-10 xl:pl-0 xl:w-1/3">
              <div className="space-y-6">
                <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center justify-between p-4 xl:p-5 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg text-slate-900 dark:text-slate-50 font-semibold grow">
                      Discover Authors
                    </h2>
                    <Link href="/authors" prefetch={false}>
                      <a className="shrink-0 block text-indigo-700 dark:text-indigo500 font-semibold text-sm">
                        View all
                      </a>
                    </Link>
                  </div>
                  <div className="flow-root">
                    <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
                      <Link href="/authors/fcs-nation" prefetch={false}>
                        <a className="flex items-center p-4 xl:p-5 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden text-neutral-100 uppercase font-semibold shadow-inner rounded-full h-10 w-10 text-base mr-4">
                            <img
                              className="absolute inset-0 w-full h-full object-cover"
                              src={urlForImage(post.author.image).url()}
                            />
                          </div>
                          <div>
                            <h3 className="text-base text-slate-900 dark:text-slate-100 font-semibold">
                              FCS Nation Radio
                            </h3>
                            <span className="block -mt-1">Author Job</span>
                          </div>
                        </a>
                      </Link>
                      <Link href="/authors/fcs-nation" prefetch={false}>
                        <a className="flex items-center p-4 xl:p-5 hover:bg-slate-200 dark:hover:bg-slate-700">
                          <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden text-neutral-100 uppercase font-semibold shadow-inner rounded-full h-10 w-10 text-base mr-4">
                            <img
                              className="absolute inset-0 w-full h-full object-cover"
                              src={urlForImage(post.author.image).url()}
                            />
                          </div>
                          <div>
                            <h3 className="text-base text-slate-900 dark:text-slate-100 font-semibold">
                              FCS Nation Radio
                            </h3>
                            <span className="block -mt-1">Author Job</span>
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
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
