import { FC } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClockIcon } from '@heroicons/react/outline'
import { parseISO, format } from 'date-fns'
import { usePlausible } from 'next-plausible'
import { urlForImage } from '@lib/sanity'
import type { Post } from '@lib/types/post'

interface HeroProps {
  posts: Post[]
  featuredArticle: Post
}
const Hero: FC<HeroProps> = ({ posts, featuredArticle }) => {
  const plausible = usePlausible()
  const heroPost = posts[0]
  const morePosts = posts.slice(1)
  return (
    <div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-md relative flex flex-col group overflow-hidden">
          <div className="flex items-start relative w-full aspect-w-4 sm:aspect-w-3 aspect-h-3" />
          <Link href={`/${heroPost.slug}`} prefetch={false}>
            <a title={heroPost.title}>
              <div className="absolute inset-0 rounded-md">
                <Image
                  src={
                    urlForImage(heroPost.mainImage)
                      .width(742)
                      .height(742)
                      .url()!
                  }
                  layout="responsive"
                  height={742}
                  width={742}
                  sizes="50vw"
                  className="object-cover w-full h-full rounded-md"
                  alt={heroPost.mainImage.caption}
                />
              </div>
              <div className="absolute top-3 left-3 group-hover:hidden" />
              <span className="absolute inset-0 bg-slate-900 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </Link>
          <a
            className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black"
            href={`/${heroPost.slug}`}
          />
          <div className="absolute bottom-0 inset-x-0 p-5 sm:p-10 flex flex-col flex-grow">
            <a href={`/${heroPost.slug}`} className="absolute inset-0" />
            <div className="mb-3">
              <div className="flex flex-wrap space-x-2">
                {heroPost.categories.map((category) => {
                  if (category === 'FCS' || category === 'FBS') {
                    return (
                      <Link
                        href={`/${category.toLocaleLowerCase()}`}
                        prefetch={false}
                        key={`${category}_${heroPost.title}`}
                      >
                        <a className="transition-colors hover:text-white duration-300 nc-Badge relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600">
                          {category}
                        </a>
                      </Link>
                    )
                  }
                })}
              </div>
            </div>
            <div className="inline-flex items-center text-xs text-slate-50">
              <h2 className="block font-semibold text-xl sm:text-2xl xl:text-4xl">
                <Link href={`/${heroPost.slug}`}>{heroPost.title}</Link>
              </h2>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-5 gap-5">
          {morePosts.map((post) => (
            <div
              key={post.title}
              className="rounded-md relative flex flex-col group overflow-hidden sm:row-span-3 col-span-1"
            >
              <div className="flex items-start relative w-full aspect-w-4 sm:aspect-w-3 aspect-h-3" />
              <Link href={`/${heroPost.slug}`}>
                <a>
                  <div className="absolute inset-0 rounded-md">
                    <Image
                      src={
                        urlForImage(post.mainImage)
                          .width(361)
                          .height(437)
                          .url()!
                      }
                      className="object-cover w-full h-full rounded-md"
                      height={437}
                      width={361}
                      sizes="50vw"
                      layout="responsive"
                      alt={post.mainImage.caption}
                    />
                  </div>
                  <span className="absolute inset-0 bg-slate-900 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </Link>
              <a
                className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black"
                href={`/${post.slug}`}
              />
              <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col flex-grow">
                <a className="absolute inset-0" href={`/${post.slug}`} />
                <div className="mb-3">
                  <div className="flex flex-wrap space-x-2">
                    {post.categories.map((category) => {
                      if (category === 'FCS' || category === 'FBS') {
                        return (
                          <Link
                            href={`/${category.toLocaleLowerCase()}`}
                            prefetch={false}
                            key={`${category}_${post.title}`}
                          >
                            <a className="transition-colors hover:text-white duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600">
                              {category}
                            </a>
                          </Link>
                        )
                      }
                    })}
                  </div>
                </div>
                <div className="inline-flex items-center text-xs text-slate-50">
                  <h2 className="block font-semibold text-white text-lg">
                    {post.title}
                  </h2>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-md relative flex flex-col group overflow-hidden sm:col-span-2 sm:row-span-2">
            <div className="flex items-start relative w-full aspect-w-4 aspect-h-3 sm:aspect-h-1 sm:aspect-w-16" />
            <a href={`/${featuredArticle.slug}`}>
              <div className="absolute inset-0 rounded-md">
                <Image
                  className="object-cover w-full h-full rounded-md"
                  alt={featuredArticle.mainImage.caption}
                  src={
                    urlForImage(featuredArticle.mainImage)
                      .width(742)
                      .height(285)
                      .fit('min')
                      .url()!
                  }
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <span className="absolute inset-0 bg-slate-900 bg-opacity-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black"
              href={`/${featuredArticle.slug}`}
            />
            <div className="absolute bottom-0 inset-x-0 p-5 sm:p-10 flex flex-col flex-grow">
              <a className="absolute inset-0" href={featuredArticle.slug} />
              <div className="mb-3">
                <div className="flex flex-wrap space-x-2">
                  {featuredArticle.categories.map((category) => {
                    if (category === 'FCS' || category === 'FBS') {
                      return (
                        <Link
                          href={`/${category.toLocaleLowerCase()}`}
                          prefetch={false}
                          key={`${category}_${featuredArticle.title}`}
                        >
                          <a className="transition-colors hover:text-white duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-white bg-red-800 hover:bg-red-600">{`Featured ${category}`}</a>
                        </Link>
                      )
                    }
                  })}
                </div>
              </div>
              <div className="inline-flex items-center text-xs text-slate-50">
                <h2 className="block font-semibold text-white text-xl sm:text-2xl xl:text-2xl">
                  {featuredArticle.title}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
