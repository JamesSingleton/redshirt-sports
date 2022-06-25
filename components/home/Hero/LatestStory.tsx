import { FC } from 'react'
import Link from 'next/link'

import BlurImage from '@components/ui/BlurImage'
import Date from '@components/ui/Date'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface LatestStoryProps {
  post: Post
}

const LatestStory: FC<LatestStoryProps> = ({ post }) => {
  return (
    <article className="relative lg:sticky lg:top-8 lg:w-1/2">
      <Link href={`/${post.slug}`}>
        <a className="group aspect-h-9 aspect-w-16 relative z-10 block overflow-hidden rounded-2xl">
          <BlurImage
            src={urlForImage(post.mainImage).width(736).height(414).url()}
            layout="fill"
            alt={post.mainImage.caption}
            placeholder="blur"
            objectFit="cover"
            blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
            className="group-hover:scale-105 group-hover:duration-300"
            priority={true}
          />
        </a>
      </Link>
      <div className="mt-6 md:align-middle">
        <Link href={`/${post.categories[0].toLowerCase()}`}>
          <a className="text-sm font-medium uppercase tracking-widest duration-300 ease-in-out">
            {post.categories[0]}
          </a>
        </Link>
        <Link href={`/${post.slug}`}>
          <a className="mt-3 block">
            <h1 className="text-3xl font-medium tracking-normal decoration-slate-800 decoration-3 transition duration-300 ease-in-out hover:underline md:tracking-tight lg:text-4xl lg:leading-tight">
              {post.title}
            </h1>
            <div>
              <p className="mt-4 text-base leading-8">{post.excerpt}</p>
            </div>
          </a>
        </Link>
        <div className="mt-4 flex items-center sm:mt-8">
          <Link href={`/authors/${post.author.slug}`}>
            <a className="h-10 w-10">
              <BlurImage
                src={urlForImage(post.author.image).width(80).height(80).url()}
                width={80}
                height={80}
                alt={post.author.name}
                className="rounded-xl"
                layout="responsive"
              />
            </a>
          </Link>
          <div className="ml-3">
            <Link href={`/authors/${post.author.slug}`}>
              <a className="text-sm font-medium">{post.author.name}</a>
            </Link>
            <p className="text-xs">
              <Date dateString={post.publishedAt} />
              <span aria-hidden="true"> &middot; </span>
              <span>{`${post.estimatedReadingTime} min read`}</span>
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default LatestStory
