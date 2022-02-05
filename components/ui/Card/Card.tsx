import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseISO, format } from 'date-fns'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'
import Badge from '../Badge'

interface CardProps {
  post: Post
  location: string
  showExcerpt?: boolean
}

const Card: FC<CardProps> = ({ post, location, showExcerpt }) => {
  const plausible = usePlausible()
  return (
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
        className="group relative flex h-full flex-col rounded-md border border-slate-200 dark:border-slate-700"
      >
        <div className="aspect-w-5 aspect-h-3 relative block w-full flex-shrink-0 overflow-hidden rounded-t-md">
          <div>
            <div
              className="nc-PostFeaturedMedia relative h-full w-full "
              data-nc-id="PostFeaturedMedia"
            >
              <div className="nc-NcImage absolute inset-0" data-nc-id="NcImage">
                <Image
                  src={urlForImage(post.mainImage).width(356).fit('min').url()!}
                  className="h-full w-full object-cover"
                  alt={post.mainImage.caption}
                  width={356}
                  height={214}
                  layout="responsive"
                  sizes="50vw"
                />
              </div>
              <div className="absolute inset-0"></div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-3 top-3">
          {post.categories.map((category) => {
            if (category === 'FCS' || category === 'FBS') {
              return <Badge key={`${category}_${post.title}`}>{category}</Badge>
            }
          })}
        </div>
        <div className="flex flex-grow flex-col space-y-3 p-4">
          <div className="inline-flex flex-wrap items-center text-xs leading-none">
            <div className="relative flex items-center space-x-2">
              <div className="relative inline-flex overflow-hidden rounded-full shadow-inner ring-1 ring-white dark:ring-neutral-900">
                <Image
                  src={
                    urlForImage(post.author.image)
                      .width(28)
                      .height(28)
                      .fit('min')
                      .url()!
                  }
                  alt={`Profile image of author ${post.author.name}`}
                  height={28}
                  width={28}
                  objectFit="cover"
                />
              </div>
              <span className="block font-medium text-slate-900 dark:text-slate-50">
                {post.author.name}
              </span>
            </div>
            <span className="mx-[6px] font-medium">·</span>
            <span className="font-normal">
              <time dateTime={post.publishedAt}>
                {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
              </time>
            </span>
          </div>
          <h2 className="block text-lg font-semibold text-slate-900 line-clamp-2 dark:text-slate-50">
            {post.title}
          </h2>
          {showExcerpt && (
            <div className="text-sm text-slate-700 line-clamp-2 dark:text-slate-400">
              {post.excerpt}
            </div>
          )}
        </div>
      </a>
    </Link>
  )
}

export default Card
