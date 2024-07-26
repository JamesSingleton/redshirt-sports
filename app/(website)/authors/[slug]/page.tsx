import { Suspense } from 'react'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { Globe, Mail } from 'lucide-react'
import { Graph } from 'schema-dts'
import { toPlainText } from '@portabletext/react'

import {
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
  Instagram,
  Twitter,
  Facebook,
} from '@/components/common/icons'
import {
  getConferencesAuthorHasWrittenFor,
  getAuthorBySlug,
  getAuthorsPosts,
} from '@/lib/sanity.fetch'
import {
  ArticleCard,
  PaginationControls,
  CustomPortableText,
  Breadcrumbs,
} from '@/components/common'
import { urlForImage } from '@/lib/sanity.image'
import ConferencesWrittenFor from './ConferencesWrittenFor'
import ImageComponent from '@/components/common/ImageComponent'
import { Org, Web } from '@/lib/ldJson'
import { perPage, HOME_DOMAIN } from '@/lib/constants'
import { defineMetadata } from '@/lib/utils.metadata'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const { slug } = params
  const author = await getAuthorBySlug(slug)

  if (!author) {
    return {}
  }

  const defaultMetadata = defineMetadata({
    title: `${author.role} ${author.name}`,
    description: `Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`,
  })

  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      type: 'profile',
      images: [
        {
          url: urlForImage(author.image).width(1200).height(630).url(),
          width: 1200,
          height: 630,
          alt: `${author.role} ${author.name}`,
        },
      ],
      url: `${HOME_DOMAIN}/authors/${author.slug}`,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: `${HOME_DOMAIN}/authors/${author.slug}`,
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
  const author = await getAuthorBySlug(slug)
  if (!author) {
    return notFound()
  }

  const authorId = author._id
  const conferencesWrittenFor = await getConferencesAuthorHasWrittenFor(authorId)

  const breadcrumbs = [
    {
      title: 'Authors',
      href: '/about',
    },
    {
      title: author.name,
      href: `/authors/${author.slug}`,
    },
  ]

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
        name: `${author.role} ${author.name}`,
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
          jobTitle: author.role,
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
        caption: `${author.role} ${author.name}`,
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
        jobTitle: author.role,
        description: toPlainText(author.bio),
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
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <ImageComponent
                image={author.image}
                alt={author.name}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
                width={80}
                height={80}
              />
              <div>
                <span className="block text-base font-semibold text-brand-500 dark:text-brand-400">
                  {author.role}
                </span>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
                  {author.name}
                </h1>
              </div>
            </div>
            <CustomPortableText
              value={author.bio}
              paragraphClasses="mt-4 text-lg font-normal lg:text-xl text-muted-foreground"
            />
            {author.socialMedia && (
              <ul className="mt-6 flex flex-wrap items-center space-x-3">
                {author.socialMedia.map((social) => (
                  <li key={social._key}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex h-10 w-10 items-center rounded-full text-muted-foreground transition-all duration-200"
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
          <Suspense fallback={<div>Loading COnferences...</div>}>
            <ConferencesWrittenFor conferences={conferencesWrittenFor.conferences} />
          </Suspense>
          <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 xl:gap-16">
            {authorPosts.posts.map((post) => (
              <ArticleCard
                key={post._id}
                title={post.title}
                slug={post.slug}
                image={post.mainImage}
                date={post.publishedAt}
                division={post.division}
                conferences={post.conferences}
                author={post.author}
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
