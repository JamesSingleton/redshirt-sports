import { FC } from 'react'
import Link from 'next/link'
import { usePlausible } from 'next-plausible'

import BlurImage from '@components/ui/BlurImage'
import Date from '@components/ui/Date'
import { urlForImage } from '@lib/sanity'

import type { Post } from '@types'

interface LatestStoryProps {
  post: Post
}

const LatestStory: FC<LatestStoryProps> = ({ post }) => {
  const plausible = usePlausible()
  return (
    <article className="relative lg:sticky lg:top-8 lg:w-1/2">
      <Link href={`/${post.slug}`} prefetch={false}>
        <a onClick={() => plausible('clickOnHeroArticle')}>
          <div className="group block overflow-hidden rounded-2xl">
            <BlurImage
              src={urlForImage(post.mainImage).width(736).height(414).url()}
              layout="responsive"
              width={736}
              height={414}
              sizes="50vw"
              alt={post.mainImage.caption}
              placeholder="blur"
              objectFit="cover"
              blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
              className="group-hover:scale-105 group-hover:duration-300"
              priority={true}
              quality={60}
            />
          </div>
          <div className="mt-6 md:align-middle">
            <span className="text-sm font-medium uppercase tracking-widest duration-300 ease-in-out">
              {post.category}
            </span>
            <div className="mt-3 block">
              <h1 className="font-cal text-3xl font-medium tracking-normal text-slate-900 transition duration-300 ease-in-out md:tracking-tight lg:text-4xl lg:leading-tight">
                {post.title}
              </h1>
              <div>
                <p className="mt-4 text-base leading-8">{post.excerpt}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center sm:mt-8">
              <div className="h-10 w-10 overflow-hidden rounded-full">
                <BlurImage
                  src={urlForImage(post.author.image).width(80).height(80).url()}
                  width={80}
                  height={80}
                  alt={post.author.name}
                  className="rounded-xl"
                  layout="responsive"
                  blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                />
              </div>
              <div className="ml-3">
                <span className="text-sm font-medium">{post.author.name}</span>
                <p className="text-xs">
                  <Date dateString={post.publishedAt} />
                  <span aria-hidden="true"> &middot; </span>
                  <span>{`${post.estimatedReadingTime} min read`}</span>
                </p>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </article>
  )
}

export default LatestStory
