import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/outline'

import Layout from '@components/common/Layout/Layout'
import { Hero } from '@components/home'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import { SITE_URL } from '@lib/constants'
import BlurImage from '@components/ui/BlurImage'
import { urlForImage } from '@lib/sanity'

import type { GetStaticProps } from 'next'
import type { Post } from '@types'
import { Date } from '@components/ui'

interface HomePageProps {
  mainArticle: Post
  recentArticles: Post[]
}

export default function Home({ mainArticle, recentArticles }: HomePageProps) {
  return (
    <>
      <NextSeo canonical={SITE_URL} />
      <Layout>
        <main>
          <Hero mainArticle={mainArticle} recentArticles={recentArticles} />
          <section className="w-full bg-slate-50 pb-14 pt-12 md:py-20 lg:pt-24">
            <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
              <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-[#DC2727]">
                Trending topics
              </h2>
            </div>
          </section>
          <section className="relative mx-auto max-w-7xl py-12 md:py-16 lg:py-20 lg:px-8">
            <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8">
              <div className="col-span-2">
                <div className="mx-auto grid max-w-xl gap-6 sm:px-6 md:max-w-3xl md:grid-cols-2 md:px-8 lg:max-w-none lg:px-0">
                  {recentArticles.map((post) => (
                    <article
                      key={post.title}
                      className="group relative flex flex-col flex-wrap rounded-2xl transition duration-300 hover:shadow-xl"
                    >
                      <div className="z-10 w-full overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-slate-50">
                        <Link href={`/${post.slug}`}>
                          <a>
                            <BlurImage
                              src={urlForImage(post.mainImage).width(388).height(194).url()}
                              alt={post.mainImage.caption}
                              blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
                              width={388}
                              height={194}
                              layout="responsive"
                              sizes="50vw"
                              className="group-hover:scale-105 group-hover:duration-300"
                            />
                          </a>
                        </Link>
                      </div>
                      <div className="box-border flex w-full flex-shrink flex-grow basis-[0%] flex-col justify-between rounded-bl-2xl rounded-br-2xl border-r-2 border-l-2 border-b-2 border-slate-100 bg-white p-6 transition duration-300 ease-in-out group-hover:border-transparent xl:p-7">
                        <div>
                          <Link href={`/${post.categories[0].toLowerCase()}`}>
                            <a className="relative z-10 text-sm font-medium uppercase tracking-widest duration-300">
                              {post.categories[0]}
                            </a>
                          </Link>
                          <h3 className="mt-3 text-xl font-medium leading-tight text-slate-900 decoration-2 transition duration-300 ease-in-out hover:underline sm:text-2xl lg:text-xl xl:text-2xl">
                            <Link href={`/${post.slug}`}>
                              <a>{post.title}</a>
                            </Link>
                          </h3>
                          <p className="mt-4 block text-base leading-relaxed text-slate-500 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                        <div className="mt-5 flex items-center sm:mt-6">
                          <Link href={`/authors/${post.author.slug}`}>
                            <a className="relative h-10 w-10">
                              <BlurImage
                                alt={post.author.name}
                                src={urlForImage(post.author.image).width(40).height(40).url()}
                                blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                                width={40}
                                height={40}
                                layout="responsive"
                                sizes="50vw"
                                className="rounded-xl"
                              />
                            </a>
                          </Link>
                          <div className="ml-3">
                            <Link href={`/authors/${post.author.slug}`}>
                              <a className="relative text-sm font-medium text-slate-700 hover:underline">
                                {post.author.name}
                              </a>
                            </Link>
                            <p className="text-sm text-slate-500">
                              <Date dateString={post.publishedAt} />
                              <span aria-hidden="true"> &middot; </span>
                              <span>{`${post.estimatedReadingTime} min read`}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="mx-auto mt-12 w-full max-w-xl space-y-8 px-4 sm:mt-16 sm:px-6 md:max-w-3xl md:px-8 lg:col-span-1 lg:mt-0 lg:max-w-none lg:px-0">
                <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
                  <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-[#DC2727]">
                    Featured
                  </h2>
                </div>
                <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
                  <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-[#DC2727]">
                    Follow Us
                  </h2>
                  <div className="space-y-4 overflow-hidden pt-5">
                    <a
                      target="_blank"
                      href="https://twitter.com/_redshirtsports"
                      rel="noreferrer"
                      className="items-centers flex w-full justify-between"
                    >
                      <div className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-transparent transition ease-in-out">
                          <span className="sr-only">Twitter</span>
                          <svg
                            className="h-4 w-4 transition duration-300 ease-in-out"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </div>
                        <div className="relative col-span-3 flex flex-col flex-wrap">
                          <div className="flex w-full flex-shrink flex-grow basis-0 flex-col justify-between px-5 md:px-0">
                            <div className="relative z-10 ml-3 text-base font-medium capitalize duration-300 ease-in-out">
                              Twitter
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <ArrowRightIcon className="mx-2 h-5 w-5 transform duration-300 ease-in-out" />
                      </div>
                    </a>
                    <a
                      target="_blank"
                      href="https://www.facebook.com/Redshirt-Sports-103392312412641"
                      rel="noreferrer"
                      className="items-centers flex w-full justify-between"
                    >
                      <div className="flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-transparent transition ease-in-out">
                          <span className="sr-only">Facebook</span>
                          <svg
                            className="h-4 w-4 transition duration-300 ease-in-out"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fillRule="evenodd"
                              d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="relative col-span-3 flex flex-col flex-wrap">
                          <div className="flex w-full flex-shrink flex-grow basis-0 flex-col justify-between px-5 md:px-0">
                            <div className="relative z-10 ml-3 text-base font-medium capitalize duration-300 ease-in-out">
                              Facebook
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <ArrowRightIcon className="mx-2 h-5 w-5 transform duration-300 ease-in-out" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const { mainArticle, recentArticles } = await getClient().fetch(homePageQuery)

  return {
    props: {
      mainArticle,
      recentArticles,
    },
  }
}
