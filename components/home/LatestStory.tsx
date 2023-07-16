import { FC } from 'react'
import Link from 'next/link'

import { Date, ImageComponent } from '@components/ui'

import type { Post } from '@types'

interface LatestStoryProps {
  post: Post
}

const LatestStory: FC<LatestStoryProps> = ({ post }) => {
  return (
    <article className="relative lg:sticky lg:top-8 lg:w-1/2">
      <div>
        <Link href={`/${post.slug}`} className="aspect-h-9 aspect-w-16 block ">
          <ImageComponent
            image={post.mainImage}
            alt={post.mainImage.caption}
            className="overflow-hidden rounded-2xl object-cover"
            width={704}
            height={396}
          />
        </Link>
        <div className="mt-6 md:align-middle">
          <div className="mt-3 block">
            <h1 className="font-cal text-3xl font-medium tracking-normal transition duration-300 ease-in-out md:tracking-tight lg:text-4xl lg:leading-tight">
              <Link href={`/${post.slug}`}>{post.title}</Link>
            </h1>
            <div>
              <p className="mt-4 text-base leading-8">{post.excerpt}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center sm:mt-8">
            <ImageComponent
              image={post.author.image}
              alt={`${post.author.name}'s avatar`}
              className="h-10 w-10 overflow-hidden rounded-full"
              width={80}
              height={80}
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
