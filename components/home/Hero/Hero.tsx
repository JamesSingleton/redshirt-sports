import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClockIcon } from '@heroicons/react/outline'
import { parseISO, format } from 'date-fns'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'

interface HeroProps {
  post: Post
}
const Hero: FC<HeroProps> = ({ post }) => {
  const date = parseISO(post.publishedAt)
  return (
    <div className="relative overflow-hidden shadow sm:rounded-lg">
      <div className="relative">
        <section className="realtive w-full">
          <Link href={`/${post.slug}`}>
            <a>
              <div className="relative">
                <Image
                  src={
                    urlForImage(post.mainImage).width(1020).height(574).url()!
                  }
                  alt={post.mainImage.caption}
                  width="1020"
                  height="574"
                  layout="responsive"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-400 to-gray-50 mix-blend-multiply" />
              </div>
              <div className="px-5 pb-2 pt-14 text-left absolute w-full top-auto left-0 bottom-0 sm:pb-5">
                <div className="w-full">
                  <div className="relative mb-1 sm:mb-2.5 left-auto top-auto">
                    <span className="text-gray-50 uppercase p-0 text-xs font-normal">
                      {post.categories[0]}
                    </span>
                  </div>
                  <div className="m-0 w-full transform-none">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {post.title}
                    </h1>
                  </div>
                  <div className="mt-1 relative w-full hidden sm:block">
                    <span className="text-gray-50 text-xs font-normal">
                      {post.author.name}
                    </span>
                    <span className="text-gray-50 ml-2 text-xs font-normal">
                      <ClockIcon className="w-3 h-3 mr-1 inline-block" />
                      <time dateTime={post.publishedAt}>
                        {format(date, 'LLLL	d, yyyy')}
                      </time>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </Link>
        </section>
      </div>
    </div>
  )
}

export default Hero
