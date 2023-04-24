import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'

import Date from '@components/ui/Date'
import { urlForImage } from '@lib/sanity.image'

import type { Post } from '@types'

interface LatestStoryProps {
  post: Post
}

const LatestStory: FC<LatestStoryProps> = ({ post }) => {
  return (
    <article className="relative lg:sticky lg:top-8 lg:w-1/2">
      <div>
        <Link href={`/${post.slug}`} className="aspect-h-9 aspect-w-16 block ">
          <Image
            src={urlForImage(post.mainImage).width(704).height(396).url()}
            alt={post.mainImage.caption}
            className="overflow-hidden rounded-2xl object-cover"
            width={704}
            height={396}
            priority={true}
            // placeholder="blur"
            // blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
          />
        </Link>
        <div className="mt-6 md:align-middle">
          <Link
            href={
              post.subcategory !== null
                ? `/news/${post.subcategory.parentSlug}/${post.subcategory.slug}`
                : `/news/${post.category.toLowerCase()}`
            }
            className="rounded-sm bg-brand-500 p-1 text-xs font-medium uppercase tracking-widest text-white duration-300 ease-in-out hover:bg-brand-300"
          >
            {post.subcategory !== null ? post.subcategory.title : post.category}
          </Link>
          <div className="mt-3 block">
            <h1 className="font-cal text-3xl font-medium tracking-normal transition duration-300 ease-in-out md:tracking-tight lg:text-4xl lg:leading-tight">
              <Link href={`/${post.slug}`}>{post.title}</Link>
            </h1>
            <div>
              <p className="mt-4 text-base leading-8">{post.excerpt}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center sm:mt-8">
            <Image
              src={urlForImage(post.author.image).width(80).height(80).quality(50).url()}
              alt={`${post.author.name}'s avatar`}
              width={80}
              height={80}
              quality={50}
              sizes="50vw"
              className="h-10 w-10 overflow-hidden rounded-full"
            />
            <div className="ml-3">
              <Link href={`/authors/${post.author.slug}`} className="text-sm font-medium">
                {post.author.name}
              </Link>
              <p className="text-xs">
                <Date dateString={post.publishedAt} />
                <span aria-hidden="true"> &middot; </span>
                <span>{`${post.estimatedReadingTime} min read`}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default LatestStory
