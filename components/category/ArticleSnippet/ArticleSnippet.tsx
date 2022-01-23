import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { ClockIcon } from '@heroicons/react/outline'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'
import { usePlausible } from 'next-plausible'

interface SnippetProps {
  post: Post
  location: string
}

const Snippet: FC<SnippetProps> = ({ post, location }) => {
  const plausible = usePlausible()
  return (
    <article>
      <Link href={`/${post.slug}`} prefetch={false}>
        <a
          onClick={() =>
            plausible('clickOnArticleSnippet', {
              props: {
                title: post.title,
                location: location,
              },
            })
          }
        >
          <div className="bg-white shadow-lg rounded-lg">
            <div className="py-6 px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
              <div className="sm:flex lg:col-span-7">
                <div className="flex-shrink-0 w-full aspect-w-1 rounded-lg overflow-hidden sm:aspect-none sm:w-40 sm:h-40">
                  <Image
                    src={
                      urlForImage(post.mainImage)
                        .height(320)
                        .fit('min')
                        .quality(75)
                        .url()!
                    }
                    sizes="50vw"
                    alt={post.mainImage.caption}
                    className="w-full h-full object-center object-cover sm:w-full sm:h-full"
                    layout="responsive"
                    objectFit="cover"
                    width={160}
                    height={160}
                  />
                </div>

                <div className="mt-6 sm:mt-0 sm:ml-6">
                  <h2 className="text-base font-medium text-slate-900">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {post.author.name}
                    <time dateTime={post.publishedAt} className="ml-4">
                      <ClockIcon className="w-3 h-3 inline-block text-slate-400" />
                      {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
                    </time>
                  </p>
                  <p className="mt-3 text-sm text-slate-500">{post.excerpt}</p>
                </div>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </article>
  )
}

export default Snippet
