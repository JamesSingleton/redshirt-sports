import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@lib/types/post'
import { urlForImage } from '@lib/sanity'
import { Badge } from '@components/ui'

interface SmallHeroCardProps {
  post: Post
}

const SmallHeroCard: FC<SmallHeroCardProps> = ({ post }) => {
  return (
    <div className="rounded-md relative flex flex-col group overflow-hidden sm:row-span-3 col-span-1">
      <Link href={`/${post.slug}`} prefetch={false}>
        <a>
          <div className="flex items-start relative w-full aspect-w-4 sm:aspect-w-3 aspect-h-3">
            <div className="absolute inset-0 rounded-md">
              <Image
                src={urlForImage(post.mainImage).width(361).height(437).url()!}
                className="object-cover w-full h-full rounded-md"
                height={437}
                width={361}
                sizes="50vw"
                layout="responsive"
                alt={post.mainImage.caption}
              />
            </div>
            <span className="absolute inset-0 bg-slate-900 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black" />
          <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col flex-grow">
            <div className="mb-3">
              {post.categories.map((category) => {
                if (category === 'FCS' || category === 'FBS') {
                  return (
                    <Badge key={`${category}_${post.title}`}>{category}</Badge>
                  )
                }
              })}
            </div>
            <div className="inline-flex items-center text-xs text-slate-50">
              <h2 className="block font-semibold text-slate-50 text-lg">
                {post.title}
              </h2>
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default SmallHeroCard
