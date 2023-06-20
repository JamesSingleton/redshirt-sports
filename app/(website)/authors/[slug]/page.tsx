import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EnvelopeOpenIcon, GlobeAltIcon, HomeIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

import {
  Instagram,
  Twitter,
  Facebook,
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
} from '@components/common/icons'
import {
  getConferencesAuthorHasWrittenFor,
  getAuthorsBySlug,
  getAuthorsPosts,
} from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { ArticleCard, Pagination, CustomPortableText } from '@components/ui'
import { urlForImage } from '@lib/sanity.image'
import ConferencesWrittenFor from './ConferencesWrittenFor'
import ImageComponent from '@components/ui/ImageComponent'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params
  const token = getPreviewToken()
  const author = await getAuthorsBySlug({ slug, token })

  if (!author) {
    return {}
  }

  return {
    title: `${author.role} ${author.name}`,
    description: `Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`,
    openGraph: {
      type: 'profile',
      title: `${author.role} ${author.name}`,
      description: `Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`,
      url: `https://www.redshirtsports.xyz/authors/${author?.slug}`,
      firstName: author?.name.split(' ')[0],
      lastName: author?.name.split(' ')[1],
      images: [
        {
          url: urlForImage(author?.image).width(1200).height(630).url(),
          width: 1200,
          height: 630,
          alt: author?.name,
        },
      ],
    },
    twitter: {
      title: `${author.role} ${author.name}`,
      description: `Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { [key: string]: string }
}) {
  const { slug } = params
  const pageIndex = searchParams.page ? parseInt(searchParams.page) : 1
  const conference = searchParams.conference ?? null
  const token = getPreviewToken()
  const author = await getAuthorsBySlug({ slug, token })
  if (!author) {
    return notFound()
  }

  const authorId = author._id
  const conferencesWrittenFor = await getConferencesAuthorHasWrittenFor({ authorId })

  const authorPosts = await getAuthorsPosts({ authorId, pageIndex, conference })
  const totalPages = Math.ceil(authorPosts.totalPosts / 10)
  const nextDisabled = pageIndex === totalPages
  const prevDisabled = pageIndex === 1

  return (
    <>
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
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
                      href="/about"
                      className="ml-2 text-sm font-medium text-zinc-400 hover:text-zinc-500"
                    >
                      Authors
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
                      href={`/authors/${author.slug}`}
                      className="ml-2 w-48 truncate text-sm font-medium text-brand-500 dark:text-brand-300 sm:w-64"
                    >
                      {author.name}
                    </Link>
                  </div>
                </li>
              </ol>
            </nav>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <ImageComponent
                image={author.image}
                alt={author.name}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
                width={80}
                height={80}
              />
              <div>
                <span className="block text-base font-semibold text-brand-500 dark:text-brand-300">
                  {author.role}
                </span>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                  {author.name}
                </h1>
              </div>
            </div>
            <CustomPortableText
              value={author.bio}
              paragraphClasses="mt-4 text-lg font-normal lg:text-xl"
            />
            {author.socialMedia && (
              <ul className="mt-6 flex flex-wrap items-center space-x-3">
                {author.socialMedia.map((social) => (
                  <li key={social._key}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center rounded-full text-zinc-400 transition-all duration-200"
                    >
                      <span className="sr-only">{social.name}</span>
                      {social.name === 'Email' ? <EnvelopeOpenIcon className="h-6 w-6" /> : null}
                      {social.name === 'Twitter' ? <Twitter className="h-6 w-6" /> : null}
                      {social.name === 'Facebook' ? <Facebook className="h-6 w-6" /> : null}
                      {social.name === 'Instagram' ? <Instagram className="h-6 w-6" /> : null}
                      {social.name === 'Website' ? <GlobeAltIcon className="h-6 w-6" /> : null}
                      {social.name === 'Spotify Podcast' ? (
                        <SpotifyIcon className="h-6 w-6" />
                      ) : null}
                      {social.name === 'Apple Podcast' ? (
                        <ApplePodcastIcon className="h-6 w-6" />
                      ) : null}
                      {social.name === 'Overcast Podcast' ? (
                        <OvercastIcon className="h-6 w-6" />
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div>Loading...</div>}>
            <ConferencesWrittenFor conferences={conferencesWrittenFor.subcategories} slug={slug} />
          </Suspense>
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {authorPosts.posts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                slug={post.slug}
                image={post.mainImage}
                excerpt={post.excerpt}
                parentCategory={post.parentCategory}
                subcategory={post.subcategory}
                date={post.publishedAt}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <Pagination
              currentPage={pageIndex}
              prevDisabled={prevDisabled}
              nextDisabled={nextDisabled}
              totalPosts={authorPosts.totalPosts}
              slug={`/authors/${author.slug}`}
            />
          ) : null}
        </div>
      </section>
    </>
  )
}
