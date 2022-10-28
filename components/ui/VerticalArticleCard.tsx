import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import { Date, BlurImage } from '@components/ui'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface VerticalArticleCardProps {
  article: Post
}

const VerticalArticleCard: FC<VerticalArticleCardProps> = ({ article }) => {
  return (
    <Link
      href={`/${article.slug}`}
      prefetch={false}
      className="flex transition duration-300 ease-in-out hover:scale-105"
    >
      <article className="flex flex-col overflow-hidden rounded-2xl shadow-xl">
        <Image
          src={urlForImage(article.mainImage).width(400).height(200).quality(40).url()}
          alt={article.mainImage.caption}
          width={388}
          height={192}
          quality={40}
          sizes="50vw"
          placeholder="blur"
          blurDataURL={article.mainImage.asset.metadata.lqip ?? undefined}
          className="h-48 w-full flex-shrink-0 object-cover"
        />
        <div className="flex flex-1 flex-col justify-between bg-white p-6">
          <div className="flex-1">
            <p className="text-sm font-medium uppercase text-brand-600">{article.category}</p>
            <div className="mt-2">
              <h3 className="font-cal text-xl font-semibold text-slate-900">{article.title}</h3>
              <p className="mt-3 text-base text-slate-500">{article.excerpt}</p>
            </div>
          </div>
          <div className="mt-6 flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10">
                <span className="sr-only">{article.author.name}</span>
                <Image
                  src={urlForImage(article.author.image).quality(40).url()}
                  alt={`${article.author.name}'s avatar`}
                  width={80}
                  height={80}
                  sizes="50vw"
                  quality={50}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-900">{article.author.name}</p>
              <div className="flex space-x-1 text-sm text-slate-500">
                <Date dateString={article.publishedAt} />
                <span aria-hidden="true">&middot;</span>
                <span>{article.estimatedReadingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}

export default VerticalArticleCard
