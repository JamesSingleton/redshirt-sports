import { Suspense } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { notFound, redirect } from 'next/navigation'
import { Globe, Mail } from 'lucide-react'
import { Graph } from 'schema-dts'

import {
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
  Instagram,
  Twitter,
  Facebook,
} from '@/components/icons'
import {
  getConferencesAuthorHasWrittenFor,
  getAuthorBySlug,
  getAuthorsPosts,
} from '@/lib/sanity.fetch'
import ArticleCard from '@/components/article-card'
import PaginationControls from '@/components/pagination-controls'
import { urlForImage } from '@/lib/sanity.image'
import ConferencesWrittenFor from '@/components/conferences-written-for'
import { Image as SanityImage } from '@/components/image'
import { Org, Web } from '@/lib/ldJson'
import { perPage, HOME_DOMAIN } from '@/lib/constants'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { page, conference } = await searchParams
  const author = await getAuthorBySlug(slug)

  if (!author) {
    return {}
  }

  const roles = author.roles.join(', ')
  let canonical = `/authors/${slug}`

  if (page && !conference && parseInt(page) > 1) {
    canonical = `/authors/${slug}?page=${page}`
  }

  if (conference) {
    canonical = `/authors/${slug}?conference=${conference}`

    if (page && parseInt(page) > 1) {
      canonical = `/authors/${slug}?conference=${conference}&page=${page}`
    }
  }

  return constructMetadata({
    title: `${author.name} - ${roles} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: `Learn more about ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}. Read their latest articles and get insights into their expertise in college football.`,
    canonical,
    image: urlForImage(author.image).width(1200).height(630).url(),
    ogType: 'profile',
  })
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { slug } = await params
  const { page, conference: conferenceSearchParam } = await searchParams
  const pageIndex = page ? parseInt(page) : 1

  if (page && parseInt(page) === 1) {
    if (conferenceSearchParam) {
      return redirect(`/authors/${slug}?conference=${conferenceSearchParam}`)
    }
    return redirect(`/authors/${slug}`)
  }

  const conference = conferenceSearchParam ?? null
  const author = await getAuthorBySlug(slug)

  if (!author) {
    return notFound()
  }

  const authorId = author._id
  const conferencesWrittenFor = await getConferencesAuthorHasWrittenFor(authorId)

  const authorPosts = await getAuthorsPosts(authorId, pageIndex, conference)

  const totalPages = Math.ceil(authorPosts.totalPosts / perPage)

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        dateCreated: author._createdAt,
        dateModified: author._updatedAt,
        '@id': `${HOME_DOMAIN}/authors/${author.slug}#profilepage`,
        url: `${HOME_DOMAIN}/authors/${author.slug}`,
        name: `${author.roles.join(', ')} ${author.name}`,
        isPartOf: {
          '@id': `${HOME_DOMAIN}#website`,
        },
        breadcrumb: {
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#breadcrumb`,
        },
        mainEntity: {
          '@type': 'Person',
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#person`,
          name: author.name,
          image: urlForImage(author.image).width(1200).height(630).url(),
          url: `${HOME_DOMAIN}/authors/${author.slug}`,
          sameAs: author.socialMedia.map((social) => social.url),
          jobTitle: author.roles.join(', '),
        },
        image: {
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#primaryimage`,
        },
        primaryImageOfPage: {
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#primaryimage`,
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: [`${HOME_DOMAIN}/authors/${author.slug}`],
          },
        ],
      },
      {
        '@type': 'ImageObject',
        '@id': `${HOME_DOMAIN}/authors/${author.slug}#primaryimage`,
        inLanguage: 'en-US',
        url: urlForImage(author.image).width(1200).height(675).url(),
        width: '1200',
        height: '675',
        caption: `${author.roles.join(', ')} ${author.name}`,
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/authors/${author.slug}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: HOME_DOMAIN,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Authors',
            item: `${HOME_DOMAIN}/about`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: author.name,
            item: `${HOME_DOMAIN}/authors/${author.slug}`,
          },
        ],
      },
      Web,
      Org,
      {
        '@type': 'Person',
        '@id': `${HOME_DOMAIN}/authors/${author.slug}#person`,
        name: author.name,
        image: {
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#primaryimage`,
        },
        url: `${HOME_DOMAIN}/authors/${author.slug}`,
        sameAs: author.socialMedia.map((social) => social.url),
        jobTitle: author.roles.join(', '),
        description: author.biography,
        mainEntityOfPage: {
          '@id': `${HOME_DOMAIN}/authors/${author.slug}#profilepage`,
        },
      },
    ],
  }

  return (
    <>
      <Script
        id={`${author.name.toLowerCase().replace(/\s+/g, '-')}-ld-json`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-8">
        <div className="container mx-auto">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <SanityImage
                asset={author.image as any}
                alt={`${author.name} avatar`}
                className="h-20 w-20 shrink-0 rounded-full object-contain"
                width={80}
                height={80}
              />
              <div>
                <span className="text-brand-500 dark:text-brand-400 block text-base font-semibold">
                  {author.roles.join(', ')}
                </span>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                  {author.name}
                </h1>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 text-lg font-normal lg:text-xl">
              {author.biography}
            </p>
            {author.socialMedia && (
              <ul className="mt-6 flex flex-wrap items-center space-x-3">
                {author.socialMedia.map((social) => (
                  <li key={social._key}>
                    <Link
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground inline-flex h-10 w-10 items-center rounded-full transition-all duration-200"
                    >
                      <span className="sr-only">{social.name}</span>
                      {social.name === 'Email' ? <Mail className="h-6 w-6" /> : null}
                      {social.name === 'Twitter' ? <Twitter className="h-6 w-6" /> : null}
                      {social.name === 'Facebook' ? <Facebook className="h-6 w-6" /> : null}
                      {social.name === 'Instagram' ? <Instagram className="h-6 w-6" /> : null}
                      {social.name === 'Website' ? <Globe className="h-6 w-6" /> : null}
                      {social.name === 'Spotify Podcast' ? (
                        <SpotifyIcon className="h-6 w-6" />
                      ) : null}
                      {social.name === 'Apple Podcast' ? (
                        <ApplePodcastIcon className="h-6 w-6" />
                      ) : null}
                      {social.name === 'Overcast Podcast' ? (
                        <OvercastIcon className="h-6 w-6" />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
      <section className="container mx-auto">
        <div>
          <Suspense fallback={<div>Loading COnferences...</div>}>
            <ConferencesWrittenFor conferences={conferencesWrittenFor.conferences} />
          </Suspense>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {authorPosts.posts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                slug={post.slug}
                image={post.mainImage}
                date={post.publishedAt}
                division={post.division}
                conferences={post.conferences}
                author={post.author.name}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <Suspense fallback={<>Loading...</>}>
              <PaginationControls totalPosts={authorPosts.totalPosts} />
            </Suspense>
          ) : null}
        </div>
      </section>
    </>
  )
}
