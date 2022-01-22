import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { parseISO, format } from 'date-fns'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'

interface MorePostsCardProps {
  post: Post
}

const MorePostsCard: FC<MorePostsCardProps> = ({ post }) => {
  return (
    <Link href={`/${post.slug}`} prefetch={false}>
      <a>
        <div className="relative flex flex-col group h-full rounded-md bg-white">
          <div className="block shrink-0 relative w-full rounded-t-md overflow-hidden aspect-w-4 aspect-h-3">
            <div className="relative w-full h-full">
              <div className="absolute inset-0">
                <Image
                  src={
                    urlForImage(post.mainImage)
                      .width(294)
                      .height(221)
                      .fit('min')
                      .url()!
                  }
                  alt={post.mainImage.caption}
                  className="object-cover w-full h-full"
                  width={294}
                  height={221}
                  layout="responsive"
                  sizes="50vw"
                />
              </div>
            </div>
          </div>
          <div className="absolute top-3 inset-x-3">
            <span className="transition-colors hover:text-white duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600">
              FCS
            </span>
          </div>
          <div className="p-4 flex flex-col grow space-y-3">
            <div className="inline-flex items-center flex-wrap text-slate-800 dark:text-slate-100 text-xs leading-none">
              <div className="relative flex items-center space-x-2">
                <div className="relative shrink-0 inline-flex items-center justify-center overflow-hidden text-slate-100 uppercase font-semibold shadow-inner rounded-full h-7 w-7 text-sm ring-1 ring-white dark:ring-slate-900">
                  <Image
                    src={
                      urlForImage(post.author.image)
                        .width(28)
                        .height(28)
                        .fit('min')
                        .url()!
                    }
                    className="absolute inset-0 w-full h-full object-cover"
                    width={28}
                    height={28}
                    alt={`Profile image for author ${post.author.name}`}
                  />
                </div>
                <span className="block font-medium">{post.author.name}</span>
              </div>
              <span className="font-medium mx-2">·</span>
              <span className="font-normal">
                <time dateTime={post.publishedAt}>
                  {format(parseISO(post.publishedAt), 'LLLL	d, yyyy')}
                </time>
              </span>
            </div>
            <h3 className="block text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
              {post.title}
            </h3>
          </div>
        </div>
      </a>
    </Link>
  )
}

export default MorePostsCard
