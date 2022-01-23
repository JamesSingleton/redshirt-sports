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
    <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
      <div className="p-4 xl:p-5 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg text-slate-900 dark:text-slate-50 font-semibold grow">
          Popular Posts
        </h2>
      </div>
      <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
        {topPosts.map((post) => (
          <Link
            href={`/${post.slug}`}
            key={`popular_${post.title}`}
            prefetch={false}
          >
            <a
              onClick={() =>
                plausible('clickOnPopularPost', {
                  props: {
                    title: post.title,
                  },
                })
              }
              className="relative flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center p-4 xl:px-5 xl:py-6 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <div className="relative space-y-2">
                <div className="inline-flex items-center flex-wrap text-slate-800 dark:text-slate-100 text-xs leading-none">
                  <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-full h-7 w-7 text-sm ring-1 ring-white dark:ring-slate-900">
                    <Image
                      className="absolute inset-0 w-full h-full object-cover"
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
                  <span className="ml-2 block text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50 font-medium">
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
              <div className="sm:w-20 shrink-0 relative rounded-md overflow-hidden mb-5 sm:ml-4 sm:mb-0 group">
                <div className="w-full h-0 aspect-w-16 aspect-h-9 sm:aspect-h-16">
                  <Image
                    src={urlForImage(post.mainImage).fit('min').url()!}
                    alt={post.mainImage.caption}
                    className="object-cover w-full h-full"
                    layout="fill"
                    width={80}
                    height={80}
                    sizes="50vw"
                    objectFit="cover"
                  />
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default PopularPosts
