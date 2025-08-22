import { Suspense } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { Twitter, Facebook, YouTubeIcon } from '@/components/icons'
import ArticleCard from '@/components/article-card'
import PaginationControls from '@/components/pagination-controls'
import { perPage } from '@/lib/constants'
import { sanityFetch } from '@/lib/sanity/live'
import CustomImage from '@/components/sanity-image'
import { buildSafeImageUrl, organizationId, websiteId } from '@/components/json-ld'
import { getSEOMetadata } from '@/lib/seo'
import { getBaseUrl } from '@/lib/get-base-url'
import { JsonLdScript } from '@/components/json-ld'
import { authorBySlug, postsByAuthor, queryAuthorPaths } from '@/lib/sanity/query'

import type { Metadata } from 'next'
import type { Graph } from 'schema-dts'

// cache for 48 hours
export const revalidate = 172800
export const dynamicParams = true

async function fetchAuthorInfo(slug: string) {
  return await sanityFetch({
    query: authorBySlug,
    params: { slug },
  })
}

async function fetchAuthorPosts(slug: string, pageIndex: number) {
  return await sanityFetch({
    query: postsByAuthor,
    params: { slug, pageIndex },
  })
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  const { slug } = resolvedParams
  const page = resolvedSearchParams.page

  const { data: author } = await fetchAuthorInfo(slug)

  if (!author) {
    return {}
  }

  const roles = author.roles.join(', ')
  let canonical = `/authors/${slug}`

  let title = `${author.name} - ${roles}`
  let description = `Learn more about ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}. Read their latest articles and get insights into their expertise in college football.`

  if (page && typeof page === 'string') {
    const pageNum = parseInt(page)
    if (pageNum > 1) {
      canonical = `/authors/${slug}?page=${pageNum}`
      title = `${author.name} - ${roles} (Page ${pageNum})`
      description = `Page ${pageNum} of articles by ${author.name}, ${roles} at ${process.env.NEXT_PUBLIC_APP_NAME}. Discover their latest insights into college football.`
    }
  }

  return getSEOMetadata({
    title: title,
    description: description,
    slug: canonical,
    image: author.image,
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
  const { page } = await searchParams
  const pageIndex = page ? parseInt(page) : 1
  const baseUrl = getBaseUrl()

  if (page && parseInt(page) === 1) {
    return redirect(`/authors/${slug}`)
  }

  const { data: author } = await fetchAuthorInfo(slug)
  const { data: authorPosts } = await fetchAuthorPosts(slug, pageIndex)

  if (!author) {
    return notFound()
  }

  const totalPages = Math.ceil(authorPosts.totalPosts / perPage)

  const authorJsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${baseUrl}/authors/${slug}#profile`,
        url: `${baseUrl}/authors/${slug}`,
        name: author.name,
        description: author.biography,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          name: `${author.name} breadcrumbs`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${baseUrl}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: author.name,
              item: `${baseUrl}/authors/${slug}`,
            },
          ],
        },
        inLanguage: 'en-US',
        isPartOf: {
          '@type': 'WebSite',
          '@id': websiteId,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/authors/${slug}#image`,
          url: buildSafeImageUrl(author.image),
          width: '1200',
          height: '630',
          contentUrl: buildSafeImageUrl(author.image),
          caption: author.image.alt,
          inLanguage: 'en-US',
        },
        mainEntity: {
          '@id': `${baseUrl}/authors/${slug}#person`,
        },
      },
      {
        '@type': 'Person',
        '@id': `${baseUrl}/authors/${slug}#person`,
        name: author.name,
        url: `${baseUrl}/authors/${slug}`,
        image: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/authors/${slug}#image`,
          url: buildSafeImageUrl(author.image),
          width: '1200',
          height: '630',
          contentUrl: buildSafeImageUrl(author.image),
          caption: author.image.alt,
          inLanguage: 'en-US',
        },
        jobTitle: author.roles.join(', '),
        sameAs: [...Object.values(author?.socialLinks || {})],
        worksFor: {
          '@type': 'Organization',
          '@id': organizationId,
        },
      },
    ],
  }

  return (
    <>
      <JsonLdScript
        data={authorJsonLd}
        id={`${author.name.toLowerCase().replace(/\s+/g, '-')}-json-ld`}
      />
      <section className="py-8">
        <div className="container mx-auto">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <CustomImage
                image={author.image}
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
            {author.socialLinks && (
              <ul className="text-muted-foreground mt-6 flex items-center space-x-6">
                {author.socialLinks.twitter && (
                  <li>
                    <Link
                      href={author.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter
                        name="twitter"
                        className="fill-muted-foreground hover:fill-primary size-6"
                      />
                      <span className="sr-only">
                        {`Follow ${author.name} on X (Formerly Twitter)`}
                      </span>
                    </Link>
                  </li>
                )}
                {author.socialLinks.facebook && (
                  <li>
                    <Link
                      href={author.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook
                        name="facebook"
                        className="fill-muted-foreground hover:fill-primary size-6"
                      />
                      <span className="sr-only">{`Follow ${author.name} on Facebook`}</span>
                    </Link>
                  </li>
                )}
                {author.socialLinks.youtube && (
                  <li>
                    <Link
                      href={author.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <YouTubeIcon
                        name="youtube"
                        className="fill-muted-foreground hover:fill-primary size-6"
                      />
                      <span className="sr-only">{`Subscribe to ${author.name}'s YouTube channel`}</span>
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </section>
      {authorPosts && authorPosts.posts.length > 0 && (
        <section className="container mx-auto">
          <div>
            <h2 className="mb-6 text-2xl font-bold tracking-tight">Articles by {author.name}</h2>
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {authorPosts.posts.map((post: any) => (
                <ArticleCard
                  key={post._id}
                  title={post.title}
                  slug={post.slug}
                  image={post.mainImage}
                  date={post.publishedAt}
                  author={post.authors[0].name}
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
      )}
    </>
  )
}
