import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import { Post } from '@lib/types/post'
import { Badge } from '@components/ui'

interface FeaturedHeroCardProps {
  featuredPost: Post
}

const FeaturedHeroCard: FC<FeaturedHeroCardProps> = ({ featuredPost }) => {
  const plausible = usePlausible()
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-md sm:col-span-2 sm:row-span-2">
      <Link href={`/${featuredPost.slug}`} prefetch={false}>
        <a onClick={() => plausible('clickOnFeaturedArticle')}>
          <div className="aspect-w-4 aspect-h-3 relative flex w-full items-start sm:aspect-h-1 sm:aspect-w-16" />
          <div className="rounded-md">
            <Image
              className="h-full w-full rounded-md object-cover"
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
          <div className="absolute inset-x-0 bottom-0 flex flex-grow flex-col bg-gradient-to-t from-black via-black/75 p-5 sm:p-10">
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
              <h2 className="block text-xl font-semibold text-slate-50 sm:text-2xl xl:text-2xl">
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
