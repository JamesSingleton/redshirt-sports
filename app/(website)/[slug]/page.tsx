import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { HomeIcon, LinkIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

import { getPostBySlug, getMorePostsBySlug, getPostSlugs } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { Date, ArticleCard, ReadingProgress } from '@components/ui'
import { urlForImage } from '@lib/sanity.image'
import { CustomPortableText } from '@components/ui/CustomPortableText'

import type { Metadata } from 'next'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params
  const token = getPreviewToken()
  const post = await getPostBySlug({ token, slug })

  if (!post) {
    return {}
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: 'article',
      title: post.title,
      authors: [post.author.name],
      section: post.parentCategory.title,
      url: `https://www.redshirtsports.xyz/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      images: [
        {
          url: urlForImage(post.mainImage).url(),
          width: 864,
          height: 576,
        },
      ],
    },
    twitter: {
      title: post.title,
      description: post.excerpt,
      site: '@_redshirtsports',
      images: [
        {
          url: urlForImage(post.mainImage).url(),
          width: 864,
          height: 576,
        },
      ],
    },
    alternates: {
      canonical: `https://www.redshirtsports.xyz/${post.slug}`,
    },
    other: {
      'twitter:label1': 'Reading time',
      'twitter:data1': `${post.estimatedReadingTime} min read`,
    },
    keywords: [post.parentCategory.title, post.subcategory.title],
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = params
  const token = getPreviewToken()
  const post = await getPostBySlug({ token, slug })

  if (!post) {
    return notFound()
  }

  const morePosts = await getMorePostsBySlug({ token, slug })

  return (
    <>
      <ReadingProgress />
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <nav className="flex" aria-label="Breadcrumbs">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <div>
                    <Link href="/" className="text-zinc-400 hover:text-zinc-500">
                      <span className="sr-only">Home</span>
                      <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                    <Link
                      href={`/news/${post.parentCategory.slug}`}
                      className="ml-2 text-sm font-medium text-zinc-400 hover:text-zinc-500"
                    >
                      {post.parentCategory.title}
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon
                      className="h-5 w-5 flex-shrink-0 text-zinc-400"
                      aria-hidden="true"
                    />
                    <Link
                      href={`/${post.slug}`}
                      className="ml-2 w-48 truncate text-sm font-medium text-brand-400 sm:w-64"
                    >
                      {post.title}
                    </Link>
                  </div>
                </li>
              </ol>
            </nav>
            <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg font-normal lg:text-xl">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-10">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/news/${post.subcategory.parentSlug}`} className="inline-block">
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-800">
                    {post.subcategory.parentTitle}
                  </span>
                </Link>
                <Link
                  href={`/news/${post.subcategory.parentSlug}/${post.subcategory.slug}`}
                  className="inline-block"
                >
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-800">
                    {post.subcategory.title}
                  </span>
                </Link>
              </div>
              <span className="text-sm">•</span>
              <Date dateString={post.publishedAt} className="text-sm" />
            </div>
          </div>
        </div>
      </section>
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            <div className="lg:w-64 lg:shrink-0">
              <div className="lg:sticky lg:left-0 lg:top-24 lg:mt-12 lg:self-start">
                <div className="flex flex-row lg:flex-col">
                  <Link
                    href={`/authors/${post.author.name}`}
                    className="mb-4 block h-24 w-24 overflow-hidden rounded-full"
                  >
                    <Image
                      src={urlForImage(post.author.image).url()}
                      alt={post.author.name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      title={post.author.name}
                    />
                  </Link>
                  <div className="ml-4 lg:ml-0">
                    <Link href={`/authors/${post.author.name}`} className="mt-5 text-xl font-bold">
                      {post.author.name}
                    </Link>
                    <p className="mt-4 text-base font-normal">{post.author.role}</p>
                  </div>
                </div>
                <ul className="hidden lg:mt-8 lg:flex lg:items-center lg:gap-3">
                  <li>
                    <button
                      aria-label="Copy the Canonical link"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <LinkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      href={`https://twitter.com/share?url=https://www.redshirtsports.xyz/${
                        post.slug
                      }&text=${encodeURIComponent(post.title)}`}
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <span className="sr-only">Twitter</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="h-5 w-5"
                      >
                        <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      href={`https://www.facebook.com/sharer/sharer.php?u=https://www.redshirtsports.xyz/${post.slug}`}
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <span className="sr-only">Facebook</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="h-5 w-5"
                      >
                        <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z"></path>
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <article className="lg:max-w-none">
                <Image
                  src={urlForImage(post.mainImage).url()}
                  alt={post.mainImage.caption}
                  className="mb-12 rounded-2xl shadow-md"
                  width={864}
                  height={576}
                  title={post.mainImage.caption}
                />
                <div className="prose prose-zinc mx-auto mt-8 dark:prose-invert lg:prose-lg">
                  <CustomPortableText value={post.body} />
                </div>
              </article>

              <div className="flex flex-col gap-4 border-t border-zinc-200 pt-12 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <p className="text-xl font-bold">Share this post</p>
                <ul className="flex items-center justify-center gap-3 sm:justify-end">
                  <li>
                    <button
                      aria-label="Copy the Canonical link"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <LinkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      href={`https://twitter.com/share?url=https://www.redshirtsports.xyz/${
                        post.slug
                      }&text=${encodeURIComponent(post.title)}`}
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <span className="sr-only">Twitter</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="h-5 w-5"
                      >
                        <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z"></path>
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a
                      target="_blank"
                      href={`https://www.facebook.com/sharer/sharer.php?u=https://www.redshirtsports.xyz/${post.slug}`}
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 transition-all duration-200"
                    >
                      <span className="sr-only">Facebook</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                        className="h-5 w-5"
                      >
                        <path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999 0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891 1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z"></path>
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-t border-zinc-700/100 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Related articles
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
            {morePosts?.map((morePost) => (
              <ArticleCard
                key={morePost._id}
                title={morePost.title}
                excerpt={morePost.excerpt}
                date={morePost.publishedAt}
                image={morePost.mainImage}
                slug={morePost.slug}
                parentCategory={morePost.parentCategory}
                subcategory={morePost.subcategory}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
