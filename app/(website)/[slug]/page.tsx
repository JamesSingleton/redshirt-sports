import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { LiveQuery } from 'next-sanity/preview/live-query'

import { urlForImage } from '@lib/sanity.image'

import { baseUrl } from '@lib/constants'
import { defineMetadata } from '@lib/utils.metadata'
import { getPostBySlug, getPostsPaths } from '@lib/sanity.fetch'
import { postsBySlugQuery } from '@lib/sanity.queries'
import ArticlePreview from '@components/Article/ArticlePreview'
import { Article } from '@components/Article/Article'

import type { Metadata } from 'next'

interface PageProps {
  params: {
    slug: string
  }
}

// export async function generateStaticParams() {
//   const slugs = await getPostsPaths()
//   return slugs.map((slug) => ({ slug }))
// }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {}
  }

  const keywords =
    post.division && post.conferences
      ? [
          post.division.name,
          ...post.conferences.map((conference) => conference.name),
          ...post.conferences.map((conference) => conference.shortName),
        ].filter((keyword) => keyword !== null)
      : undefined

  const defaultMetadata = defineMetadata({
    title: post.title,
    description: post.excerpt,
  })

  return {
    ...defaultMetadata,
    authors: [
      {
        name: post.author.name,
        url: `${baseUrl}/authors/${post.author.slug}`,
      },
    ],
    openGraph: {
      ...defaultMetadata.openGraph,
      type: 'article',
      authors: [post.author.name],
      section: post.division ? post.division.name : undefined,
      url: `${baseUrl}/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
      images: [
        {
          url: urlForImage(post.mainImage).width(1200).height(627).fit('crop').url(),
          width: 1200,
          height: 627,
        },
      ],
    },
    twitter: {
      ...defaultMetadata.twitter,
      images: [
        {
          url: urlForImage(post.mainImage).width(1200).height(627).fit('crop').url(),
          width: 1200,
          height: 627,
        },
      ],
    },
    alternates: {
      canonical: `${baseUrl}/${post.slug}`,
    },
    other: {
      'twitter:label1': 'Reading time',
      'twitter:data1': `${post.estimatedReadingTime} min read`,
    },
    keywords: keywords,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = params
  const post = await getPostBySlug(slug)

  if (!post) {
    return notFound()
  }

  return (
    <LiveQuery
      enabled={draftMode().isEnabled}
      query={postsBySlugQuery}
      params={params}
      initialData={post}
      as={ArticlePreview}
    >
      <Article post={post} />
    </LiveQuery>
  )
}
