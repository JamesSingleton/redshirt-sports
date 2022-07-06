import { FC } from 'react'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'

import BlurImage from '@components/ui/BlurImage'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface FeaturedArticlesProps {
  featuredArticles: Post[]
}

const FeaturedArticles: FC<FeaturedArticlesProps> = ({ featuredArticles }) => {
  return (
    <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
      <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
        Featured
      </h2>
      <div className="pt-6">
        {featuredArticles.map((featuredArticle) => (
          <article key={featuredArticle._id} className="flex space-x-4 sm:space-x-6 lg:space-x-4">
            <Link href={`/${featuredArticle.slug}`}>
              <a className="h-24 w-24 overflow-hidden rounded-2xl sm:h-28 sm:w-28 lg:h-20 lg:w-20 xl:h-24 xl:w-24">
                <BlurImage
                  alt={featuredArticle.mainImage.caption}
                  src={urlForImage(featuredArticle.mainImage).width(96).height(96).url()}
                  blurDataURL={featuredArticle.mainImage.asset.metadata.lqip ?? undefined}
                  width={96}
                  height={96}
                  layout="responsive"
                  className="rounded-2xl"
                />
              </a>
            </Link>
            <div className="w-2/3">
              <div className="flex h-full w-full flex-1 flex-col justify-center">
                <div>
                  <Link href={`/${featuredArticle.slug}`}>
                    <a className="text-lg font-medium leading-snug tracking-normal text-slate-900 decoration-slate-800 decoration-2 transition duration-300 ease-in-out hover:underline">
                      {featuredArticle.title}
                    </a>
                  </Link>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-slate-500">By&nbsp;</span>
                  <Link href={`/authors/${featuredArticle.author.slug}`}>
                    <a className="font-medium text-slate-900 hover:underline">
                      {featuredArticle.author.name}
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default FeaturedArticles
