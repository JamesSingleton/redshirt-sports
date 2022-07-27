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
      <div className="w-full overflow-hidden rounded-tl-2xl rounded-tr-2xl bg-slate-50">
        <Link href={`/${article.slug}`} prefetch={false}>
          <a>
            <BlurImage
              src={urlForImage(article.mainImage).width(388).height(194).url()}
              alt={article.mainImage.caption}
              blurDataURL={article.mainImage.asset.metadata.lqip ?? undefined}
              width={388}
              height={194}
              layout="responsive"
              sizes="50vw"
              className="group-hover:scale-105 group-hover:duration-300"
            />
          </a>
        </Link>
      </div>
      <div className="box-border flex w-full flex-1 flex-col justify-between rounded-bl-2xl rounded-br-2xl border-r-2 border-l-2 border-b-2 border-slate-100 bg-white p-6 transition duration-300 ease-in-out group-hover:border-transparent xl:p-7">
        <div>
          <Link href={`/${article.categories[0].toLowerCase()}`} prefetch={false}>
            <a className="text-sm font-medium uppercase tracking-widest text-brand-500 duration-300">
              {article.categories[0]}
            </a>
          </Link>
          <h3 className="mt-3 text-xl font-medium leading-tight text-slate-900 decoration-2 transition duration-300 ease-in-out hover:underline sm:text-2xl lg:text-xl xl:text-2xl">
            <Link href={`/${article.slug}`} prefetch={false}>
              <a>{article.title}</a>
            </Link>
          </h3>
          <p className="mt-4 block text-base leading-relaxed text-slate-500 line-clamp-2">
            {article.excerpt}
          </p>
        </div>
        <div className="mt-5 flex items-center sm:mt-6">
          <Link href={`/authors/${article.author.slug}`} prefetch={false}>
            <a className="relative h-10 w-10 overflow-hidden rounded-xl">
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
            </a>
          </Link>
          <div className="ml-3">
            <Link href={`/authors/${article.author.slug}`} prefetch={false}>
              <a className="relative text-sm font-medium text-slate-700 hover:underline">
                {article.author.name}
              </a>
            </Link>
            <p className="text-sm text-slate-500">
              <Date dateString={article.publishedAt} />
              <span aria-hidden="true"> &middot; </span>
              <span>{`${article.estimatedReadingTime} min read`}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default VerticalArticleCard
