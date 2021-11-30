import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { ClockIcon } from '@heroicons/react/outline'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'

interface SnippetProps {
  post: Post
}

const Snippet: FC<SnippetProps> = ({ post }) => {
  return (
    <article className="overflow-hidden mb-7 bg-white shadow-lg rounded relative">
      <div className="flex justify-between">
        <div className="w-52 sm:w-80">
          <Image
            alt={post.mainImage.caption}
            src={urlForImage(post.mainImage).url()!}
            width="360"
            height="275"
            layout="responsive"
          />
        </div>
        <div className="min-w-0 flex-1 mx-5 sm:mx-7">
          <Link href={`/${post.slug}`}>
            <a className="block focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <h2 className="text-lg sm:text-2xl font-semibold leading-7">
                {post.title}
              </h2>
              <div className="flex flex-row space-x-3">
                <div className="text-sm text-gray-500">{post.author.name}</div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon
                    className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <time dateTime={post.publishedAt}>
                    {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
                  </time>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm line-clamp-2 sm:line-clamp-3">
                  {post.excerpt}
                </p>
              </div>
            </a>
          </Link>
        </div>
      </div>
    </article>
  )
}

export default Snippet
