import { GetStaticProps } from 'next'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import { ArrowRightIcon } from '@heroicons/react/outline'

import { Layout } from '@components/common'
import { recentArticlesQuery } from '@lib/queries'
import { getClient } from '@lib/sanity.server'

import type { Post } from '@types'

interface Custom404Props {
  recentArticles: Post[]
}

const Custom404 = ({ recentArticles }: Custom404Props) => {
  const plausible = usePlausible()
  return (
    <Layout>
      <section className="bg-slate-50">
        <div className="mx-auto min-h-screen max-w-2xl py-12 px-4 sm:px-6 sm:pt-16 lg:flex lg:max-w-screen-2xl lg:items-center lg:px-12 xl:py-20">
          <div className="flex flex-col justify-center lg:w-1/2 2xl:w-2/5">
            <div className="max-w-lg">
              <span className="relative block text-sm uppercase tracking-widest text-brand-500">
                Error 404
              </span>
              <h1 className="mt-3 text-4xl font-medium tracking-normal text-slate-900 md:text-5xl md:tracking-tight lg:leading-tight">
                Page not found
              </h1>
              <p className="mt-4 text-base leading-loose text-slate-600">
                Sorry, the page you are looking for does not exist. Try going back or visiting a
                different link.
              </p>
              <Link href="/">
                <a className="group mt-4 flex items-center text-brand-500 transition duration-300 hover:text-brand-600 sm:mt-5">
                  Go back home
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition duration-300 ease-in-out group-hover:translate-x-1 group-hover:transform" />
                </a>
              </Link>
            </div>
          </div>
          <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 2xl:ml-16 2xl:w-3/5">
            <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
              Recent stories
            </h2>
            <div className="grid lg:gap-6 2xl:grid-cols-2">
              {recentArticles.map((recentArticle) => (
                <article key={recentArticle._id}>
                  <h3>{recentArticle.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const recentArticles = await getClient().fetch(recentArticlesQuery)

  return {
    props: {
      recentArticles,
    },
  }
}

export default Custom404
