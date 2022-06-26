import { FC } from 'react'
import Link from 'next/link'

import { Date, BlurImage } from '@components/ui'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface ArticleSectionProps {
  otherArticles: Post[]
}

const ArticleSection: FC<ArticleSectionProps> = ({ otherArticles }) => {
  return (
    <div className="mx-auto grid max-w-xl gap-6 px-4 sm:px-6 md:max-w-3xl md:grid-cols-2 md:px-8 lg:max-w-none lg:px-0">
      {otherArticles.map((post) => (
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
          <div className="box-border flex w-full flex-1 flex-col justify-between rounded-bl-2xl rounded-br-2xl border-r-2 border-l-2 border-b-2 border-slate-100 bg-white p-6 transition duration-300 ease-in-out group-hover:border-transparent xl:p-7">
            <div>
              <Link href={`/${post.categories[0].toLowerCase()}`}>
                <a className="relative z-10 text-sm font-medium uppercase tracking-widest text-brand-500 duration-300">
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
                <a className="relative h-10 w-10 overflow-hidden rounded-xl">
                  <BlurImage
                    alt={post.author.name}
                    src={urlForImage(post.author.image).width(80).height(80).url()}
                    blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                    width={80}
                    height={80}
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
  )
}

export default ArticleSection
