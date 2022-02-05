import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseISO, format } from 'date-fns'
import { usePlausible } from 'next-plausible'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { Badge } from '@components/ui'

interface LargeCardProps {
  post: Post
}
const LargeCard: FC<LargeCardProps> = ({ post }) => {
  const date = parseISO(post.publishedAt)
  const plausible = usePlausible()
  return (
    <Link href={`/${post.slug}`} prefetch={false}>
      <a
        onClick={() =>
          plausible('clickOnArticleSnippet', {
            props: {
              title: post.title,
              location: 'Home Page Latest Articles (lg)',
            },
          })
        }
        className="group relative flex h-full flex-col overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
      >
        <span className="relative block h-0 w-full flex-shrink-0 flex-grow overflow-hidden pt-[75%] sm:rounded-b-none sm:pt-[55%]">
          <div className="absolute inset-0">
            <Image
              src={urlForImage(post.mainImage).fit('min').url()!}
              className="h-full w-full object-cover"
              alt={post.mainImage.caption}
              width={738}
              height={473}
              layout="responsive"
              sizes="50vw"
            />
          </div>
          <div className="absolute bottom-2 left-2" />
        </span>
        <div className="absolute right-4 top-4 z-[-1] hidden gap-[5px] opacity-0 group-hover:z-10 group-hover:opacity-100 md:grid"></div>
        <div className="flex flex-col p-4 sm:p-5">
          <div className="space-y-3">
            {post.categories.map((category) => {
              if (category === 'FCS' || category === 'FBS') {
                return (
                  <Badge key={`${category}_${post.title}`}>{category}</Badge>
                )
              }
            })}
            <h2 className="block text-lg font-semibold text-slate-900 transition-colors line-clamp-2 dark:text-slate-50 sm:text-2xl">
              {post.title}
            </h2>
            <span className="block text-sm line-clamp-2">{post.excerpt}</span>
          </div>
          <div className="relaative relative my-4 inline-flex items-center">
            <div className="relative mr-3 inline-flex overflow-hidden rounded-full shadow-inner">
              <Image
                src={
                  urlForImage(post.author.image)
                    .width(40)
                    .height(40)
                    .fit('min')
                    .url()!
                }
                className="absolute inset-0 h-full w-full object-cover"
                alt={`Profile image of author ${post.author.name}`}
                height={40}
                width={40}
              />
            </div>
            <div>
              <h2 className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {post.author.name}
              </h2>
              <span className="mt-1 flex items-center text-xs">
                <time dateTime={post.publishedAt}>
                  {format(date, 'LLLL	d, yyyy')}
                </time>
              </span>
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between"></div>
        </div>
      </a>
    </Link>
  )
}

export default LargeCard
