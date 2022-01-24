import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'
import { Badge } from '@components/ui'

interface FeaturedHeroCardProps {
  featuredPost: Post
}

const FeaturedHeroCard: FC<FeaturedHeroCardProps> = ({ featuredPost }) => {
  return (
    <div className="rounded-md relative flex flex-col group overflow-hidden sm:col-span-2 sm:row-span-2">
      <Link href={`/${featuredPost.slug}`} prefetch={false}>
        <a>
          <div className="flex items-start relative w-full aspect-w-4 aspect-h-3 sm:aspect-h-1 sm:aspect-w-16" />
          <div className="rounded-md">
            <Image
              className="object-cover w-full h-full rounded-md"
              alt={featuredPost.mainImage.caption}
              src={
                urlForImage(featuredPost.mainImage)
                  .width(742)
                  .height(285)
                  .fit('min')
                  .url()!
              }
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-10 flex flex-col flex-grow bg-gradient-to-t from-black via-black/75">
            <div className="mb-3">
              {featuredPost.categories.map((category) => {
                if (category === 'FCS' || category === 'FBS') {
                  return (
                    <Badge key={`${category}_${featuredPost.title}`}>
                      {`Featured ${category}`}
                    </Badge>
                  )
                }
              })}
            </div>
            <div className="inline-flex items-center text-xs text-slate-50">
              <h2 className="block font-semibold text-slate-50 text-xl sm:text-2xl xl:text-2xl">
                {featuredPost.title}
              </h2>
            </div>
          </div>
        </a>
      </Link>
    </div>
  )
}

export default FeaturedHeroCard
