import { FC } from 'react'
import Link from 'next/link'

import { Date, BlurImage } from '@components/ui'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface VerticalArticleCardProps {
  article: Post
}

const VerticalArticleCard: FC<VerticalArticleCardProps> = ({ article }) => {
  return (
    <Link href={`/${article.slug}`} prefetch={false}>
      <a className="flex">
        <article className="flex flex-col overflow-hidden rounded-2xl shadow-xl">
          <div className="h-48 w-full flex-shrink-0">
            <BlurImage
              className="h-48 w-full object-cover"
              src={urlForImage(article.mainImage).width(388).height(192).url()}
              alt={article.mainImage.caption}
              blurDataURL={article.mainImage.asset.metadata.lqip ?? undefined}
              layout="responsive"
              objectFit="cover"
              placeholder="blur"
              width={388}
              height={192}
              sizes="50vw"
            />
          </div>
          <div className="flex flex-1 flex-col justify-between bg-white p-6">
            <div className="flex-1">
              <p className="text-sm font-medium uppercase text-brand-600">
                {article.categories[0]}
              </p>
              <div className="mt-2">
                <h3 className="font-cal text-xl font-semibold text-gray-900">{article.title}</h3>
                <p className="mt-3 text-base text-gray-500">{article.excerpt}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10">
                  <span className="sr-only">{article.author.name}</span>
                  <BlurImage
                    className="rounded-full"
                    src={urlForImage(article.author.image).width(80).height(80).url()}
                    alt={`${article.author.name}'s avatar`}
                    width={80}
                    height={80}
                    layout="responsive"
                    sizes="50vw"
                  />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{article.author.name}</p>
                <div className="flex space-x-1 text-sm text-gray-500">
                  <Date dateString={article.publishedAt} />
                  <span aria-hidden="true">&middot;</span>
                  <span>{article.estimatedReadingTime} min read</span>
                </div>
              </div>
            </div>
          </div>
        </article>
      </a>
    </Link>
  )
}

export default VerticalArticleCard
