import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { parseISO, format } from 'date-fns'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'

interface SmallCardProps {
  post: Post
}

const SmallCard: FC<SmallCardProps> = ({ post }) => {
  const date = parseISO(post.publishedAt)
  return (
    <div className="relative flex flex-col group h-full border rounded-md border-slate-200 dark:border-slate-700">
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
      <a href="#" className="absolute inset-0" />
      <span className="absolute top-3 inset-x-3">
        <div className="flex flex-wrap space-x-2">
          {post.categories.map((category) => {
            if (category === 'FCS' || category === 'FBS') {
              return (
                <Link
                  href={`/${category.toLocaleLowerCase()}`}
                  prefetch={false}
                  key={`${category}_${post.title}`}
                >
                  <a className="transition-colors hover:text-white duration-300 nc-Badge relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600">
                    {category}
                  </a>
                </Link>
              )
            }
          })}
        </div>
      </span>
      <div className="p-4 flex flex-col flex-grow space-y-3">
        <div className="inline-flex items-center flex-wrap text-xs leading-none">
          <a className="relative flex items-center space-x-2" href="#">
            <div className="wil-avatar relative flex-shrink-0 inline-flex items-center justify-center overflow-hidden uppercase font-semibold shadow-inner rounded-full h-7 w-7 text-sm ring-1 ring-white dark:ring-neutral-900">
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
          </a>
          <span className="mx-[6px] font-medium">·</span>
          <span className="font-normal">
            <time dateTime={post.publishedAt}>
              {format(date, 'LLLL	d, yyyy')}
            </time>
          </span>
        </div>
        <h2 className="block text-base font-semibold text-slate-900 dark:text-slate-50">
          <Link href={`/${post.slug}`}>
            <a className="line-clamp2">{post.title}</a>
          </Link>
        </h2>
      </div>
    </div>
  )
}

export default SmallCard
