import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseISO, format } from 'date-fns'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { Badge } from '@components/ui'

interface LargeCardProps {
  post: Post
}
const LargeCard: FC<LargeCardProps> = ({ post }) => {
  const date = parseISO(post.publishedAt)
  return (
    <Link href={`/${post.slug}`} prefetch={false}>
      <a className="border border-slate-200 dark:border-slate-700 group relative flex flex-col overflow-hidden h-full rounded-md">
        <span className="block flex-shrink-0 flex-grow relative w-full h-0 pt-[75%] sm:pt-[55%] sm:rounded-b-none overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src={urlForImage(post.mainImage).fit('min').url()!}
              className="object-cover w-full h-full"
              alt={post.mainImage.caption}
              width={738}
              height={473}
              layout="responsive"
              sizes="50vw"
            />
          </div>
          <div className="absolute bottom-2 left-2" />
        </span>
        <div className="absolute hidden md:grid gap-[5px] right-4 top-4 opacity-0 z-[-1] group-hover:z-10 group-hover:opacity-100"></div>
        <div className="p-4 sm:p-5 flex flex-col">
          <div className="space-y-3">
            {post.categories.map((category) => {
              if (category === 'FCS' || category === 'FBS') {
                return (
                  <Badge key={`${category}_${post.title}`}>{category}</Badge>
                )
              }
            })}
            <h2 className="block font-semibold text-slate-900 dark:text-slate-50 transition-colors text-lg sm:text-2xl line-clamp-2">
              {post.title}
            </h2>
            <span className="block text-sm line-clamp-2">{post.excerpt}</span>
          </div>
          <div className="relaative inline-flex items-center relative my-4">
            <div className="relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden uppercase font-semibold shadow-inner rounded-full h-10 w-10 text-base mr-3">
              <Image
                src={
                  urlForImage(post.author.image)
                    .width(40)
                    .height(40)
                    .fit('min')
                    .url()!
                }
                className="absolute inset-0 w-full h-full object-cover"
                alt={`Profile image of author ${post.author.name}`}
                height={40}
                width={40}
              />
            </div>
            <div>
              <h2 className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                {post.author.name}
              </h2>
              <span className="flex items-center mt-1 text-xs">
                <time dateTime={post.publishedAt}>
                  {format(date, 'LLLL	d, yyyy')}
                </time>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto"></div>
        </div>
      </a>
    </Link>
  )
}

export default LargeCard
