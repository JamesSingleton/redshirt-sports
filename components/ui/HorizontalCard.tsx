import { forwardRef } from 'react'
import Link from 'next/link'
import { CalendarIcon, ClockIcon } from '@heroicons/react/outline'
import { usePlausible } from 'next-plausible'

import { urlForImage } from '@lib/sanity'
import BlurImage from './BlurImage'

import type { Post } from '@types'
import Date from './Date'

interface HorizontalCardProps {
  post: Post
}

const HorizontalCard = forwardRef<HTMLElement, HorizontalCardProps>(({ post }, ref) => {
  const plausible = usePlausible()
  return (
    <article ref={ref}>
      <Link href={`/${post.slug}`} prefetch={false}>
        <a className="hover:scale-105 hover:duration-300 md:grid md:grid-cols-4 md:gap-8">
          <div className="md:col-span-1">
            <div className="aspect-h-9 aspect-w-16 block overflow-hidden rounded-2xl md:aspect-h-1 md:aspect-w-1">
              <BlurImage
                src={urlForImage(post.mainImage).quality(40).url()}
                alt={post.mainImage.caption}
                layout="fill"
                blurDataURL={post.mainImage.asset.metadata.lqip}
                className="overflow-hidden rounded-2xl"
                quality={40}
              />
            </div>
          </div>
          <div className="group relative mt-6 flex flex-col flex-wrap md:col-span-3 md:mt-0">
            <div className="mb-8 box-border flex w-full flex-1 flex-col justify-between border-b-2 border-b-slate-100 px-6 pb-8 md:px-0">
              <h2 className="text-xl font-medium leading-tight text-slate-900 decoration-2 sm:text-2xl lg:text-xl xl:text-2xl">
                {post.title}
              </h2>
              <p className="mt-3 block text-base leading-relaxed text-slate-500 line-clamp-2">
                {post.excerpt}
              </p>
              <footer className="mt-5 flex items-center sm:mt-7">
                <div className="relative mr-3 h-7 w-7 overflow-hidden rounded-lg lg:h-8 lg:w-8">
                  <BlurImage
                    src={urlForImage(post.author.image).width(64).height(64).url()}
                    alt={post.author.name}
                    blurDataURL={post.author.image.asset.metadata.lqip}
                    width={64}
                    height={64}
                    className="overflow-hidden rounded-lg"
                  />
                </div>
                <div className="flex items-center text-base">
                  <span className="hidden text-slate-500 sm:inline-block">By&nbsp;</span>
                  <span className="font-medium text-slate-700">{post.author.name}</span>
                  <CalendarIcon className="ml-3 h-5 w-5 text-slate-400" />
                  <Date dateString={post.publishedAt} className="ml-1 text-slate-500" />
                  <span className="hidden items-center sm:flex">
                    <ClockIcon className="ml-3 h-5 w-5 text-slate-400" />
                    <span className="ml-1 text-slate-500">{`${post.estimatedReadingTime} min read`}</span>
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </a>
      </Link>
    </article>
  )
})

HorizontalCard.displayName = 'HorizontalCard'

export default HorizontalCard
