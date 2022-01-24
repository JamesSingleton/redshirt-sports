import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseISO, format } from 'date-fns'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'
import { Badge } from '@components/ui'

interface SmallCardProps {
  post: Post
}

const SmallCard: FC<SmallCardProps> = ({ post }) => {
  const date = parseISO(post.publishedAt)
  return (
    <Link href={`/${post.slug}`} prefetch={false}>
      <a className="relative flex flex-col group h-full border rounded-md border-slate-200 dark:border-slate-700">
        <div className="block flex-shrink-0 relative w-full rounded-t-md overflow-hidden aspect-w-5 aspect-h-3">
          <div>
            <div
              className="nc-PostFeaturedMedia relative w-full h-full "
              data-nc-id="PostFeaturedMedia"
            >
              <div className="nc-NcImage absolute inset-0" data-nc-id="NcImage">
                <Image
                  src={urlForImage(post.mainImage).width(356).fit('min').url()!}
                  className="object-cover w-full h-full"
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
        <span className="absolute top-3 inset-x-3">
          {post.categories.map((category) => {
            if (category === 'FCS' || category === 'FBS') {
              return <Badge key={`${category}_${post.title}`}>{category}</Badge>
            }
          })}
        </span>
        <div className="p-4 flex flex-col flex-grow space-y-3">
          <div className="inline-flex items-center flex-wrap text-xs leading-none">
            <div className="relative flex items-center space-x-2">
              <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden uppercase font-semibold shadow-inner rounded-full h-7 w-7 text-sm ring-1 ring-white dark:ring-neutral-900">
                <Image
                  className="absolute inset-0 w-full h-full object-cover"
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
                />
              </div>
              <span className="block text-slate-900 dark:text-slate-50 font-medium">
                {post.author.name}
              </span>
            </div>
            <span className="mx-[6px] font-medium">·</span>
            <span className="font-normal">
              <time dateTime={post.publishedAt}>
                {format(date, 'LLLL	d, yyyy')}
              </time>
            </span>
          </div>
          <h2 className="block text-base font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">
            {post.title}
          </h2>
        </div>
      </a>
    </Link>
  )
}

export default SmallCard
