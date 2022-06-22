import Link from 'next/link'
import { NextSeo } from 'next-seo'

import Layout from '@components/common/Layout/Layout'
import { Hero } from '@components/home'
import { getClient } from '@lib/sanity.server'
import { homePageQuery } from '@lib/queries'
import BlogCard from '@components/ui/BlogCard'
import BlurImage from '@components/ui/BlurImage'
import { urlForImage } from '@lib/sanity'
import { Date } from '@components/ui'
import { SITE_URL } from '@lib/constants'

import type { GetStaticProps } from 'next'
import type { Post } from '@types'

interface HomePageProps {
  heroPost: Post
  latestPosts: Post[]
  featuredArticle: Post
}

export default function Home({ heroPost, latestPosts, featuredArticle }: HomePageProps) {
  return (
    <>
      <NextSeo canonical={SITE_URL} />
      <Layout>
        <main>
          <section className="pt-12 sm:pt-16 lg:pt-20">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:flex lg:max-w-screen-2xl lg:items-start lg:px-8">
              <article className="relative lg:sticky lg:top-8 lg:w-1/2">
                <Link href={`/${heroPost.slug}`}>
                  <a className="group aspect-h-9 aspect-w-16 relative z-10 block overflow-hidden rounded-2xl">
                    <BlurImage
                      src={urlForImage(heroPost.mainImage).width(736).height(414).url()}
                      layout="fill"
                      alt={heroPost.mainImage.caption}
                      placeholder="blur"
                      objectFit="cover"
                      blurDataURL={heroPost.mainImage.asset.metadata.lqip ?? undefined}
                      className="group-hover:scale-105 group-hover:duration-300"
                    />
                  </a>
                </Link>
                <div className="mt-6 md:align-middle">
                  <Link href={`/${heroPost.categories[0].toLowerCase()}`}>
                    <a className="text-sm font-medium uppercase tracking-widest duration-300 ease-in-out">
                      {heroPost.categories[0]}
                    </a>
                  </Link>
                  <Link href={`/${heroPost.slug}`}>
                    <a className="mt-3 block">
                      <h1 className="text-3xl font-medium tracking-normal decoration-slate-800 decoration-3 transition duration-300 ease-in-out hover:underline md:tracking-tight lg:text-4xl lg:leading-tight">
                        {heroPost.title}
                      </h1>
                      <div>
                        <p className="mt-4 text-base leading-8">{heroPost.excerpt}</p>
                      </div>
                    </a>
                  </Link>
                  <div className="mt-4 flex items-center sm:mt-8">
                    <Link href={`/authors/${heroPost.author.slug}`}>
                      <a className="relative">
                        <BlurImage
                          src={urlForImage(heroPost.author.image).width(40).height(40).url()}
                          width={40}
                          height={40}
                          alt={heroPost.author.name}
                          className="rounded-xl"
                        />
                      </a>
                    </Link>
                    <div className="ml-3">
                      <Link href={`/authors/${heroPost.author.slug}`}>
                        <a className="text-sm font-medium">{heroPost.author.name}</a>
                      </Link>
                      <p className="text-xs">
                        <Date dateString={heroPost.publishedAt} />
                        <span aria-hidden="true"> &middot; </span>
                        <span>{`${heroPost.estimatedReadingTime} min read`}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
              <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 xl:ml-16">
                <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-[#DC2727]">
                  Recent stories
                </h2>
                <div className="gird divide-y lg:grid-cols-2 lg:gap-5 xl:grid-cols-1">
                  {latestPosts.map((post) => (
                    <article
                      className="py-8 md:flex lg:flex-col xl:flex-row xl:items-center"
                      key={post.title}
                    >
                      <Link href={`/${post.slug}`}>
                        <a className="order-2 w-full md:w-2/5 lg:order-1 lg:w-full xl:w-2/5">
                          <div className="group aspect-h-9 aspect-w-16 relative z-10 overflow-hidden rounded-2xl">
                            <BlurImage
                              alt={post.mainImage.caption}
                              src={urlForImage(post.mainImage).url()}
                              blurDataURL={heroPost.mainImage.asset.metadata.lqip ?? undefined}
                              placeholder="blur"
                              layout="fill"
                              objectFit="cover"
                              className="group-hover:scale-105 group-hover:duration-300"
                            />
                          </div>
                        </a>
                      </Link>
                      <div className="order-1 mt-5 w-full px-2 md:mt-0 md:max-w-sm md:pl-0 md:pr-5 lg:order-2 lg:mt-4 xl:ml-5 xl:mt-0 xl:shrink xl:grow xl:basis-0">
                        <Link href={`/${post.categories[0].toLowerCase()}`}>
                          <a className="text-xs font-medium uppercase tracking-widest text-[#DC2727] duration-300 ease-in-out">
                            {post.categories[0]}
                          </a>
                        </Link>
                        <Link href={`/${post.title}`}>
                          <a>
                            <h3 className="mt-2 text-xl font-medium leading-normal tracking-normal decoration-2 transition duration-300 ease-in-out hover:underline">
                              {post.title}
                            </h3>
                          </a>
                        </Link>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center justify-center">
                            <Link href={`/authors/${post.author.slug}`}>
                              <a className="relative mr-3 h-6 w-6">
                                <BlurImage
                                  alt={post.author.name}
                                  src={urlForImage(post.author.image).url()}
                                  width={24}
                                  height={24}
                                  objectFit="cover"
                                  className="rounded-lg"
                                />
                              </a>
                            </Link>
                            <div className="text-sm">
                              <span className="text-slate-500">By </span>
                              <Link href={`/authors/${post.author.slug}`}>
                                <a className="font-medium text-slate-700 decoration-inherit">
                                  {post.author.name}
                                </a>
                              </Link>
                              <span aria-hidden="true"> &middot; </span>
                              <Date dateString={heroPost.publishedAt} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
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
  const { heroPost, featuredArticle, latestPosts } = await getClient().fetch(homePageQuery)

  return {
    props: {
      heroPost,
      latestPosts,
      featuredArticle,
    },
  }
}
