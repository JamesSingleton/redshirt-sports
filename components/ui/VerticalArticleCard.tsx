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
    <article
      key={article.title}
      className="group relative flex flex-col flex-wrap rounded-2xl transition duration-300 hover:shadow-xl"
    >
      <Link href={`/${article.slug}`} prefetch={false}>
        <a>
          <div className="w-full overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-slate-50">
            <BlurImage
              src={urlForImage(article.mainImage).width(776).height(388).url()}
              alt={article.mainImage.caption}
              blurDataURL={article.mainImage.asset.metadata.lqip ?? undefined}
              width={776}
              height={388}
              layout="responsive"
              sizes="50vw"
              className="group-hover:scale-105 group-hover:duration-300"
            />
          </div>
          <div className="box-border flex w-full flex-1 flex-col justify-between rounded-bl-2xl rounded-br-2xl border-r-2 border-l-2 border-b-2 border-slate-100 bg-white p-6 transition duration-300 ease-in-out group-hover:border-transparent xl:p-7">
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-brand-500 duration-300">
                {article.categories[0]}
              </span>
              <h3 className="mt-3 text-xl font-medium leading-tight text-slate-900 transition duration-300 ease-in-out sm:text-2xl lg:text-xl xl:text-2xl">
                {article.title}
              </h3>
              <p className="mt-4 block text-base leading-relaxed text-slate-500 line-clamp-2">
                {article.excerpt}
              </p>
            </div>
            <div className="mt-5 flex items-center sm:mt-6">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl">
                <BlurImage
                  alt={article.author.name}
                  src={urlForImage(article.author.image).width(80).height(80).url()}
                  blurDataURL={article.author.image.asset.metadata.lqip ?? undefined}
                  width={80}
                  height={80}
                  layout="responsive"
                  sizes="50vw"
                  className="rounded-xl"
                />
              </div>
              <div className="ml-3">
                <span className="relative text-sm font-medium text-slate-700">
                  {article.author.name}
                </span>
                <p className="text-sm text-slate-500">
                  <Date dateString={article.publishedAt} />
                  <span aria-hidden="true"> &middot; </span>
                  <span>{`${article.estimatedReadingTime} min read`}</span>
                </p>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </article>
  )
}

export default VerticalArticleCard
