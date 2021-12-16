import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { ClockIcon } from '@heroicons/react/outline'
import type { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { usePlausible } from 'next-plausible'

interface MorePostsProps {
  morePosts: Post[]
}

const MorePosts: FC<MorePostsProps> = ({ morePosts }) => {
  const plausible = usePlausible()
  return (
    <div className="bg-white px-4 pb-5 shadow sm:rounded-lg sm:px-6">
      <ul role="list" className="divide-y space-y-5 divide-gray-200">
        {morePosts.map((post) => (
          <li
            key={post.title}
            className="relative bg-white pt-5 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600"
          >
            <div className="flex justify-between space-x-3">
              <div>
                <Image
                  alt={post.mainImage.caption}
                  src={urlForImage(post?.mainImage).height(75).width(75).url()!}
                  width="75"
                  height="75"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/${post.slug}`} prefetch={false}>
                  <a
                    className="block focus:outline-none"
                    onClick={() =>
                      plausible('clickOnPostMoreArticles', {
                        props: {
                          title: post.title,
                        },
                      })
                    }
                  >
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">
                      {post.title}
                    </p>
                    <span className="shrink-0 whitespace-nowrap text-sm text-gray-500">
                      <ClockIcon className="w-3 h-3 mr-1 inline-block" />
                      <time dateTime={post.publishedAt}>
                        {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
                      </time>
                    </span>
                  </a>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MorePosts
