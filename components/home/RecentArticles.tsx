import Link from 'next/link'

import { BlurImage, Date } from '@components/ui'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface RecentArticlesProps {
  recentArticles: Post[]
}

const RecentArticles = ({ recentArticles }: RecentArticlesProps) => {
  return (
    <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 xl:ml-16">
      <h2 className="relative border-b border-slate-300 pb-2 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
        Recent stories
      </h2>
      <div className="grid divide-y lg:grid-cols-2 lg:gap-5 xl:grid-cols-1">
        {recentArticles.map((post) => (
          <article key={post.title} className="py-8">
            <Link href={`/${post.slug}`} prefetch={false}>
              <a className="group md:flex lg:flex-col xl:flex-row xl:items-center">
                <div className="order-2 w-full md:w-2/5 lg:order-1 lg:w-full xl:w-2/5">
                  <div className="group overflow-hidden rounded-2xl">
                    <BlurImage
                      alt={post.mainImage.caption}
                      src={urlForImage(post.mainImage).width(564).height(316).url()}
                      blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
                      placeholder="blur"
                      layout="responsive"
                      width={282}
                      height={158}
                      sizes="50vw"
                      className="group-hover:scale-105 group-hover:duration-300"
                      quality={60}
                    />
                  </div>
                </div>
                <div className="order-1 mt-5 w-full px-2 md:mt-0 md:max-w-sm md:pl-0 md:pr-5 lg:order-2 lg:mt-4 xl:ml-5 xl:mt-0 xl:flex-1">
                  <span className="text-xs font-medium uppercase tracking-widest text-[#DC2727] duration-300 ease-in-out">
                    {post.categories[0]}
                  </span>
                  <h3 className="mt-2 text-xl font-medium leading-normal tracking-normal decoration-2 transition duration-300 ease-in-out hover:underline">
                    {post.title}
                  </h3>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center justify-center">
                      <div className="relative mr-3 h-6 w-6 overflow-hidden rounded-lg">
                        <BlurImage
                          alt={post.author.name}
                          src={urlForImage(post.author.image).url()}
                          width={24}
                          height={24}
                          objectFit="cover"
                          layout="responsive"
                          className="rounded-lg"
                          blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                        />
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">By </span>
                        <span className="font-medium text-slate-700 decoration-inherit">
                          {post.author.name}
                        </span>
                        <span aria-hidden="true"> &middot; </span>
                        <Date dateString={post.publishedAt} />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export default RecentArticles
