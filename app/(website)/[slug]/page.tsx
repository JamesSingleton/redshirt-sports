import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import CalendarIcon from '@heroicons/react/24/outline/CalendarIcon'
import ClockIcon from '@heroicons/react/24/outline/ClockIcon'
import CameraIcon from '@heroicons/react/24/outline/CameraIcon'

import { getPostBySlug, getMorePostsBySlug, getPostSlugs } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { CustomPortableText } from '@components/ui/CustomPortableText'
import VerticalArticleCard from '@components/ui/VerticalArticleCard'
import { urlForImage } from '@lib/sanity.image'
import Date from '@components/ui/Date'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: URLSearchParams
}): Promise<Metadata> {
  const { slug } = params
  const token = getPreviewToken()
  const post = await getPostBySlug({ token, slug })
  if (!post) {
    return {}
  }
  return {
    title: post?.title,
    description: post?.excerpt,
    openGraph: {
      type: 'article',
      title: post?.title,
      description: post?.excerpt,
      url: `https://www.redshirtsports.xyz/${post?.slug}`,
      publishedTime: post?.publishedAt,
      modifiedTime: post?._updatedAt,
      authors: [post?.author.name],
      section: post?.category,
    },
    twitter: {
      title: post?.title,
      description: post?.excerpt,
    },
  }
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug: string) => ({ slug }))
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const token = getPreviewToken()
  const post = await getPostBySlug({ token, slug })

  if (!post) {
    return notFound()
  }

  const morePosts = await getMorePostsBySlug({ token, slug })

  return (
    <>
      <article className="lg:pb-25 pb-12 sm:pb-16">
        <header className="sm:px-10 sm:pt-10">
          <div className="mx-auto max-w-screen-lg">
            <Image
              src={urlForImage(post?.mainImage)?.url()}
              alt={post?.mainImage.caption}
              width={1024}
              height={600}
              sizes="50vw"
              priority
              className="h-auto w-full overflow-hidden object-cover md:h-150 md:rounded-2xl"
            />
            <div className="flex pl-5 pt-3 text-sm lg:pl-0">
              <CameraIcon className="h-5 w-5 flex-none" aria-hidden="true" />
              <span className="ml-2">{`Source: ${post?.mainImage.attribution}`}</span>
            </div>
          </div>
          <div className="px-5 lg:px-0">
            <div className="mx-auto mb-8 max-w-prose border-b border-zinc-300/70 pb-8 pt-10 text-lg sm:pt-16">
              <Link
                href={
                  post?.subcategory !== null
                    ? `/${post?.subcategory.parentSlug}/${post?.subcategory.slug}`
                    : `/${post.category.toLowerCase()}`
                }
                className="rounded-sm bg-brand-500 p-1 text-xs font-medium uppercase tracking-widest text-white duration-300 ease-in-out hover:bg-brand-300"
              >
                {post?.subcategory !== null ? post?.subcategory.title : post.category}
              </Link>
              <h1 className="mt-3 font-cal text-4xl font-medium transition duration-300 ease-in-out sm:my-5 sm:text-4xl sm:leading-tight lg:text-5xl">
                {post?.title}
              </h1>
              <p className="mt-4 text-base leading-loose text-zinc-500 dark:text-zinc-400">
                {post?.excerpt}
              </p>
              <div className="mt-6 flex items-center sm:mt-8">
                <Link href={`/authors/${post.author.slug}`} className="mr-3 shrink-0">
                  <Image
                    alt={post.author.name}
                    src={urlForImage(post.author.image).width(72).height(72).quality(60).url()}
                    width={36}
                    height={36}
                    sizes="50vw"
                    quality={60}
                    priority
                    className="h-8 w-8 overflow-hidden rounded-full sm:h-9 sm:w-9"
                  />
                </Link>
                <div className="flex items-center text-sm lg:text-base">
                  <span className="hidden text-zinc-500 dark:text-zinc-400 sm:inline-block">
                    By&nbsp;
                  </span>
                  <Link
                    href={`/authors/${post.author.slug}`}
                    className="font-medium text-zinc-700 hover:underline dark:text-zinc-200"
                  >
                    {post.author.name}
                  </Link>
                  <CalendarIcon className="ml-4 h-5 w-5 text-zinc-400" />
                  <Date
                    className="ml-1 text-zinc-500 dark:text-zinc-400"
                    dateString={post.publishedAt}
                  />
                  <span className="hidden items-center sm:flex">
                    <ClockIcon className="ml-3 h-5 w-5 text-zinc-400" />
                    <span className="ml-1 text-zinc-500 dark:text-zinc-400">{`${post.estimatedReadingTime} min read`}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="px-5 lg:px-0">
          <div className="prose m-auto w-11/12 dark:prose-invert sm:prose-lg sm:w-3/4">
            <CustomPortableText value={post?.body!} />
          </div>
        </div>
      </article>
      <section className="mx-auto w-full max-w-7xl pb-14 pt-12 sm:py-20 lg:pt-24">
        <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
          <h2 className="relative border-b border-zinc-300 pb-2 font-cal text-2xl font-medium before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">
            Related Articles
          </h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3">
          {morePosts?.map((post) => (
            <VerticalArticleCard key={post.slug} article={post!} />
          ))}
        </div>
      </section>
    </>
  )
}
