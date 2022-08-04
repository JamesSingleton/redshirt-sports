import Link from 'next/link'
import { CalendarIcon, ClockIcon, CameraIcon } from '@heroicons/react/outline'
import { usePlausible } from 'next-plausible'

import { urlForImage } from '@lib/sanity'
import { BlurImage, Date } from '@components/ui'

import type { Post } from '@types'

interface PostHeaderProps {
  post: Post
}

const PostHeader = ({ post }: PostHeaderProps) => {
  const plausible = usePlausible()

  return (
    <header className="pt-10 sm:px-10 sm:pt-16">
      <div className="mx-auto max-w-screen-lg">
        <div className="relative h-80 w-full overflow-hidden md:h-150 md:rounded-2xl">
          <BlurImage
            alt={post.mainImage.caption}
            src={urlForImage(post.mainImage).width(1024).height(600).url()}
            layout="fill"
            objectFit="cover"
            placeholder="blur"
            priority={true}
            blurDataURL={post.mainImage.asset.metadata.lqip ?? undefined}
            quality={60}
          />
        </div>
        <div className="ml-3 mt-3 flex text-sm sm:ml-0">
          <CameraIcon className="h-5 w-5 flex-none" aria-hidden="true" />
          <span className="ml-2">{`Source: ${post.mainImage.attribution}`}</span>
        </div>
      </div>

      <div className="px-5 lg:px-0">
        <div className="mx-auto mb-8 max-w-prose border-b border-slate-300/70 pt-10 pb-8 text-lg sm:pt-16">
          <Link href={`/${post.category.toLowerCase()}`} prefetch={false}>
            <a
              onClick={() =>
                plausible('clickOnArticleCategory', {
                  props: {
                    item: post.category,
                  },
                })
              }
              className="relative text-sm font-medium uppercase tracking-widest text-brand-500 duration-300 ease-in-out"
            >
              {post.category}
            </a>
          </Link>
          <h1 className="mt-3 font-cal text-4xl font-medium text-slate-900 transition duration-300 ease-in-out sm:my-5 sm:text-4xl sm:leading-tight lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base leading-loose text-slate-600">{post.excerpt}</p>
          <div className="mt-6 flex items-center sm:mt-8">
            <Link href={`/authors/${post.author.slug}`} prefetch={false}>
              <a onClick={() => plausible('clickOnAuthor')} className="mr-3 shrink-0">
                <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-slate-100 sm:h-9 sm:w-9">
                  <BlurImage
                    alt={post.author.name}
                    src={urlForImage(post.author.image).width(72).height(72).url()}
                    blurDataURL={post.author.image.asset.metadata.lqip ?? undefined}
                    width={36}
                    height={36}
                    layout="responsive"
                    className="rounded-xl"
                  />
                </div>
              </a>
            </Link>
            <div className="flex items-center text-sm lg:text-base">
              <span className="hidden text-slate-500 sm:inline-block">By&nbsp;</span>
              <Link href={`/authors/${post.author.slug}`} prefetch={false}>
                <a
                  onClick={() => plausible('clickOnAuthor')}
                  className="font-medium text-slate-700 hover:underline"
                >
                  {post.author.name}
                </a>
              </Link>
              <CalendarIcon className="ml-4 h-5 w-5 text-slate-400" />
              <Date className="ml-1 text-slate-500" dateString={post.publishedAt} />
              <span className="hidden items-center sm:flex">
                <ClockIcon className="ml-3 h-5 w-5 text-slate-400" />
                <span className="ml-1 text-slate-500">{`${post.estimatedReadingTime} min read`}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default PostHeader
