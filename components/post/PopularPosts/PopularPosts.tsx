import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'

interface PopularPostsProps {
  topPosts: Post[]
}
const PopularPosts: FC<PopularPostsProps> = ({ topPosts }) => {
  const plausible = usePlausible()
  return (
    <div className="overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
      <div className="border-b border-slate-200 p-4 dark:border-slate-700 xl:p-5">
        <h2 className="grow text-lg font-semibold text-slate-900 dark:text-slate-50">
          Popular Posts
        </h2>
      </div>
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
        {topPosts.map((post) => (
          <article key={`popular_${post.title}`}>
            <Link href={`/${post.slug}`} prefetch={false}>
              <a
                onClick={() =>
                  plausible('clickOnPopularPost', {
                    props: {
                      title: post.title,
                    },
                  })
                }
                className="relative flex flex-col-reverse p-4 hover:bg-slate-200 dark:hover:bg-slate-700 sm:flex-row sm:items-center sm:justify-between xl:px-5 xl:py-6"
              >
                <div className="relative space-y-2">
                  <div className="inline-flex flex-wrap items-center text-xs leading-none text-slate-800 dark:text-slate-100">
                    <div className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold uppercase text-slate-100 shadow-inner ring-1 ring-white dark:ring-slate-900">
                      <Image
                        className="absolute inset-0 h-full w-full object-cover"
                        src={
                          urlForImage(post.author.image)
                            .width(28)
                            .height(28)
                            .url()!
                        }
                        alt={`Profile image of author ${post.author.name}`}
                        width={28}
                        height={28}
                      />
                    </div>
                    <span className="ml-2 block font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50">
                      {post.author.name}
                    </span>
                    <span className="mx-2 font-medium">·</span>
                    <span className="font-normal">
                      <time dateTime={post.publishedAt}>
                        {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
                      </time>
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {post.title}
                  </h3>
                </div>
                <div className="group relative mb-5 shrink-0 overflow-hidden rounded-md sm:ml-4 sm:mb-0 sm:w-20">
                  <div className="aspect-w-16 aspect-h-9 h-0 w-full sm:aspect-h-16">
                    <Image
                      src={urlForImage(post.mainImage).fit('min').url()!}
                      alt={post.mainImage.caption}
                      className="h-full w-full object-cover"
                      layout="fill"
                      objectFit="cover"
                    />
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

export default PopularPosts
