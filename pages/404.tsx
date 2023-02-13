import { GetStaticProps } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'

import { SEO } from '@components/common'
import { recentArticlesQuery } from '@lib/queries'
import { sanityClient } from '@lib/sanity.server'

import type { Post } from '@types'
import { Date } from '@components/ui'
import { urlForImage } from '@lib/sanity'

interface Custom404Props {
  recentArticles: Post[]
}

const Custom404 = ({ recentArticles }: Custom404Props) => {
  return (
    <>
      <SEO
        title="The page you are looking for could not be found"
        description="Sorry, the page you are looking for does not exist. Try going back or visiting a different link."
        openGraph={{
          title: 'The page you are looking for could not be found | Redshirt Sports',
          description:
            'Sorry, the page you are looking for does not exist. Try going back or visiting a different link.',
        }}
      />
      <section className="bg-slate-50">
        <div className="mx-auto min-h-screen max-w-2xl py-12 px-4 sm:px-6 sm:pt-16 lg:flex lg:max-w-screen-2xl lg:items-center lg:px-12 xl:py-20">
          <div className="flex flex-col justify-center lg:w-1/2 2xl:w-2/5">
            <div className="max-w-lg">
              <span className="relative block text-sm uppercase tracking-widest text-brand-500">
                Error 404
              </span>
              <h1 className="mt-3 font-cal text-4xl font-medium tracking-normal text-slate-900 md:text-5xl md:tracking-tight lg:leading-tight">
                Page not found
              </h1>
              <p className="mt-4 text-base leading-loose text-slate-600">
                Sorry, the page you are looking for does not exist. Try going back or visiting a
                different link.
              </p>
              <Link
                href="/"
                prefetch={false}
                className="group mt-4 flex items-center text-brand-500 transition duration-300 hover:text-brand-600 sm:mt-5"
              >
                Go back home
                <ArrowRightIcon className="ml-2 h-5 w-5 transition duration-300 ease-in-out group-hover:translate-x-1 group-hover:transform" />
              </Link>
            </div>
          </div>
          <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 2xl:ml-16 2xl:w-3/5">
            <h2 className="relative border-b border-slate-300 pb-2 font-cal text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
              Recent Articles
            </h2>
            <div className="grid pt-12 lg:gap-6 2xl:grid-cols-2">
              {recentArticles.map((recentArticle) => (
                <article key={recentArticle._id}>
                  <Link
                    href={`/${recentArticle.slug}`}
                    prefetch={false}
                    className="py-8 sm:flex lg:items-center lg:py-6 xl:py-8"
                  >
                    <div className="order-2 w-full sm:w-2/5 lg:order-1 lg:w-24 xl:w-1/3">
                      <div className="aspect-h-9 aspect-w-9 lg:aspect-h-1 lg:aspect-w-1">
                        <Image
                          src={urlForImage(recentArticle.mainImage).quality(40).url()}
                          alt={recentArticle.mainImage.caption}
                          width={134}
                          height={134}
                          sizes="50vw"
                          placeholder="blur"
                          blurDataURL={recentArticle.mainImage.asset.metadata.lqip ?? undefined}
                          quality={40}
                          className="overflow-hidden rounded-2xl object-cover"
                        />
                      </div>
                    </div>
                    <div className="order-1 mt-5 w-full px-2 sm:mr-4 sm:mt-0 sm:max-w-sm sm:px-0 lg:order-2 lg:mr-0 lg:ml-4 lg:flex-1">
                      <span className="text-sm font-medium uppercase tracking-widest text-brand-500">
                        {recentArticle.category}
                      </span>
                      <h3 className="mt-2 font-cal text-lg font-medium tracking-normal text-slate-900 decoration-slate-800 decoration-2 transition duration-300 ease-in-out hover:underline lg:text-base xl:text-lg xl:leading-normal">
                        {recentArticle.title}
                      </h3>
                      <div className="mt-4 flex items-center justify-between lg:mt-3">
                        <div className="flex items-end justify-center">
                          <Image
                            src={urlForImage(recentArticle.author.image).quality(50).url()}
                            alt={`${recentArticle.author.name}'s avatar`}
                            width={24}
                            height={24}
                            sizes="50vw"
                            quality={50}
                            className="mr-3 h-6 w-6 overflow-hidden rounded-full object-cover lg:hidden"
                          />
                          <div className="text-sm">
                            <span className="text-slate-500">By&nbsp;</span>
                            <span className="font-medium text-slate-600 hover:underline">
                              {recentArticle.author.name}
                            </span>
                            <span aria-hidden="true">&nbsp;&middot;&nbsp;</span>
                            <Date dateString={recentArticle.publishedAt} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const recentArticles = await sanityClient.fetch(recentArticlesQuery)

  return {
    props: {
      recentArticles,
    },
  }
}

export default Custom404
