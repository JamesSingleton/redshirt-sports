import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CameraIcon } from 'lucide-react'
import { badgeVariants } from '@workspace/ui/components/badge'

import { sanityFetch } from '@/lib/sanity/live'
import { queryPostSlugData } from '@/lib/sanity/query'
import { AuthorSection, MobileAuthorSection } from '@/components/posts/author'
import { RichText } from '@/components/rich-text'
import { LargeArticleSocialShare } from '@/components/posts/article-share'
import CustomImage from '@/components/sanity-image'
import { urlForImage } from '@/lib/sanity.image'
import ArticleCard from '@/components/article-card'
import { buildSafeImageUrl, JsonLdScript } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'
import type { Graph, ListItem } from 'schema-dts'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

async function fetchPostSlugData(slug: string) {
  return await sanityFetch({
    query: queryPostSlugData,
    params: { slug },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { data: pageData } = await fetchPostSlugData(slug)

  if (!pageData) {
    return {}
  }

  return {
    title: `${pageData.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: pageData.excerpt,
    openGraph: {
      title: `${pageData.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      description: pageData.excerpt,
      url: `/${slug}`,
      images: [
        {
          url: urlForImage(pageData.mainImage).width(1200).height(630).url(),
          width: 1200,
          height: 630,
          alt: pageData.mainImage.caption,
        },
      ],
      type: 'article',
      publishedTime: pageData.publishedAt,
      modifiedTime: pageData._updatedAt,
      authors: pageData.authors.map((author: any) => {
        return {
          name: author.name,
        }
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pageData.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
      description: pageData.excerpt,
      images: [
        {
          url: urlForImage(pageData.mainImage).width(1200).height(630).url(),
          width: 1200,
          height: 630,
          alt: pageData.mainImage.caption,
        },
      ],
      site: '@_redshirtsports',
    },
    other: {
      'twitter:label1': 'Reading time',
      'twitter:data1': pageData.estimatedReadingTime,
    },
    alternates: {
      canonical: `/${pageData.slug}`,
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const { data } = await fetchPostSlugData(slug)
  const baseUrl = getBaseUrl()
  const organizationId = `${baseUrl}/#organization`
  const websiteId = `${baseUrl}/#website`

  if (!data) {
    notFound()
  }

  const articleUrl = `${baseUrl}/${data.slug}`
  const articleId = `${articleUrl}#article`
  const imageId = `${articleUrl}#primaryImage`
  const articleImageUrl = buildSafeImageUrl(data.mainImage)

  const breadcrumbItems: ListItem[] = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: data.title,
      item: articleUrl,
    },
  ]

  const graph: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsArticle',
        '@id': articleId,
        isPartOf: { '@id': articleUrl },
        author: data.authors.map((author: any) => ({
          '@type': 'Person',
          name: author.name,
          url: author.slug ? `${baseUrl}/${author.slug}` : undefined,
        })),
        headline: data.title,
        dateCreated: new Date(data.publishedAt).toISOString(),
        datePublished: new Date(data.publishedAt).toISOString(),
        dateModified: new Date(data._updatedAt).toISOString(),
        description: data.excerpt,
        mainEntityOfPage: { '@id': articleUrl },
        wordCount: data.wordCount,
        publisher: { '@id': organizationId },
        image: { '@id': imageId },
        thumbnailUrl: articleImageUrl,
        inLanguage: 'en-US',
        copyrightYear: new Date().getFullYear(),
        copyrightHolder: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': articleUrl,
        url: articleUrl,
        name: `${data.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
        isPartOf: { '@id': websiteId },
        primaryImageOfPage: { '@id': imageId },
        thumbnailUrl: articleImageUrl,
        datePublished: new Date(data.publishedAt).toISOString(),
        dateModified: new Date(data._updatedAt).toISOString(),
        description: data.excerpt,
        breadcrumb: {
          '@type': 'BreadcrumbList',
          '@id': `${articleUrl}#breadcrumb`,
          itemListElement: breadcrumbItems,
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: [articleUrl],
          },
        ],
      },
      {
        '@type': 'ImageObject',
        inLanguage: 'en-US',
        '@id': imageId,
        url: articleImageUrl,
        contentUrl: articleImageUrl,
        caption: data.mainImage.alt,
        width: '1920',
        height: '1080',
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: baseUrl,
        name: process.env.NEXT_PUBLIC_APP_NAME,
        publisher: { '@id': organizationId },
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${baseUrl}/search?q={search_term_string}`,
            },
            'query-input': {
              '@type': 'PropertyValueSpecification',
              valueRequired: true,
              valueName: 'search_term_string',
            },
          },
        ],
      },
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: process.env.NEXT_PUBLIC_APP_NAME,
        url: baseUrl,
      },
      data.authors.map((author: any) => ({
        '@type': 'Person',
        '@id': `${baseUrl}/authors/${author.slug}`,
        name: author.name,
        image: buildSafeImageUrl(author.image),
        sameAs: author.socialMedia?.map((link: any) => link.url) || [],
        url: `${baseUrl}/authors/${author.slug}`,
        description: author.biography,
      })),
    ],
  }

  return (
    <>
      <JsonLdScript data={graph} id={`article-json-ld-${data.slug}`} />
      <section className="mt-8 pb-8">
        <div className="container">
          <h1
            id="article-title"
            className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            {data.title}
          </h1>
          <p id="article-excerpt" className="mt-4 text-lg font-normal lg:text-xl">
            {data.excerpt}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {(data.division || data.conferences) && (
              <div className="flex flex-wrap items-center gap-3">
                {data.conferences &&
                  data.conferences.map((conference: any) => {
                    // Get the _id of the sport for the current article
                    const articleSportId = data.sport._id

                    // Find the sportSubdivisionAffiliation that matches the article's sport
                    const matchingAffiliation = conference.sportSubdivisionAffiliations?.find(
                      (affiliation: any) => affiliation.sport._id === articleSportId,
                    )

                    // Determine the division path segment:
                    // Use the subgrouping slug if a matching affiliation is found,
                    // otherwise fall back to the conference's direct division slug.
                    const divisionPathSegment =
                      matchingAffiliation?.subgrouping.slug || conference.division.slug

                    // Construct the full conference URL
                    const conferenceHref = `/college/${data.sport.slug}/news/${divisionPathSegment}/${conference.slug}`

                    return (
                      <Link
                        key={conference.slug}
                        href={conferenceHref}
                        className={badgeVariants({ variant: 'default' })}
                        prefetch={false}
                      >
                        {conference.shortName ?? conference.name}
                      </Link>
                    )
                  })}
              </div>
            )}

            {(data.division || data.conferences) && <span className="text-sm">•</span>}
            <time className="text-sm">
              {new Date(data.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
      </section>
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            <div className="lg:w-64 lg:shrink-0">
              <div className="hidden lg:sticky lg:top-24 lg:left-0 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
                <AuthorSection author={data.author} authors={data.authors} />
                <LargeArticleSocialShare slug={data.slug} title={data.title} />
              </div>
              <MobileAuthorSection author={data.author} authors={data.authors} />
            </div>
            <article className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <figure className="mb-8 space-y-1.5">
                <CustomImage
                  image={data.mainImage}
                  width={1600}
                  height={900}
                  className="h-auto w-full rounded-lg"
                  loading="eager"
                />
                <figcaption className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CameraIcon className="h-4 w-4" />
                  <span>Source: {data.mainImage.credit}</span>
                </figcaption>
              </figure>
              <RichText richText={data.body} />
            </article>
          </div>
        </div>
      </section>
      {data.relatedPosts.length > 0 && (
        <section className="border-border border-t py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                You Might Also Like
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
              {data.relatedPosts.map((morePost: any) => (
                <ArticleCard
                  key={morePost._id}
                  title={morePost.title}
                  date={morePost.publishedAt}
                  image={morePost.mainImage}
                  slug={morePost.slug}
                  division={morePost.division}
                  conferences={morePost.conferences}
                  author={morePost.authors[0].name}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
