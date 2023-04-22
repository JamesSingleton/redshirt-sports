import Link from 'next/link'
import Image from 'next/image'

import { urlForImage } from '@lib/sanity.image'

import type { Post } from '@types'

const MinimalHorizontalCard = ({
  article,
  analyticsGoal,
}: {
  article: Post
  analyticsGoal: string
}) => {
  return (
    <article>
      <Link
        href={`/${article.slug}`}
        prefetch={false}
        className="flex space-x-4 sm:space-x-6 lg:space-x-4"
      >
        <div className="h-24 w-24 sm:h-28 sm:w-28 lg:h-20 lg:w-20 xl:h-24 xl:w-24">
          <div className="aspect-h-1 aspect-w-1">
            <Image
              alt={article.mainImage.caption}
              src={urlForImage(article.mainImage).quality(50).url()}
              width={96}
              height={96}
              // placeholder="blur"
              // blurDataURL={article.mainImage.asset.metadata.lqip ?? undefined}
              quality={50}
              className="overflow-hidden rounded-2xl object-cover"
            />
          </div>
        </div>
        <div className="w-2/3">
          <div className="flex h-full w-full flex-1 flex-col justify-center">
            <h3 className="line-clamp-2 font-cal text-lg font-medium leading-snug tracking-normal transition duration-300 ease-in-out">
              {article.title}
            </h3>
            <div className="mt-2 flex items-center text-sm">
              <span className="dark:text-zinc0499 text-zinc-500">By&nbsp;</span>
              <span className="font-medium">{article.author.name}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default MinimalHorizontalCard
