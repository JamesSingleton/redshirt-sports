import Link from 'next/link'
import Image from 'next/image'
import CalendarIcon from '@heroicons/react/24/outline/CalendarIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'

import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'
import Date from './Date'

interface HorizontalCardProps {
  post: Post
}

const HorizontalCard = ({ post }: HorizontalCardProps) => {
  return (
    <article>
      <Link
        href={`/${post.slug}`}
        prefetch={false}
        className="hover:scale-105 hover:duration-300 md:grid md:grid-cols-4 md:gap-8"
      >
        <div className="md:col-span-1">
          <div className="aspect-h-9 aspect-w-16 md:aspect-h-1 md:aspect-w-1">
            <Image
              src={urlForImage(post.mainImage).width(640).height(480).quality(40).url()}
              alt={post.mainImage.caption}
              className="overflow-hidden rounded-2xl object-cover"
              quality={40}
              width={640}
              height={480}
            />
          </div>
        </div>
        <div className="group relative mt-6 flex flex-col flex-wrap md:col-span-3 md:mt-0">
          <div className="mb-8 box-border flex w-full flex-1 flex-col justify-between border-b-2 border-b-slate-100 px-6 pb-8 md:px-0">
            <h2 className="font-cal text-xl font-medium leading-tight text-slate-900 decoration-2 sm:text-2xl lg:text-xl xl:text-2xl">
              {post.title}
            </h2>
            <p className="mt-3 block text-base leading-relaxed text-slate-500 line-clamp-2">
              {post.excerpt}
            </p>
            <footer className="mt-5 flex items-center sm:mt-7">
              <Image
                src={urlForImage(post.author.image).width(64).height(64).url()}
                alt={`${post.author.name}'s profile picture`}
                width={32}
                height={32}
                className="mr-3 h-7 w-7 overflow-hidden rounded-full object-cover lg:h-8 lg:w-8"
              />
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
      </Link>
    </article>
  )
}

HorizontalCard.displayName = 'HorizontalCard'

export default HorizontalCard
