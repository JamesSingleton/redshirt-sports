import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getPostBySlug, getMorePostsBySlug, getPostSlugs } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { Date, ArticleCard, ReadingProgress, Breadcrumbs, ImageComponent } from '@components/ui'
import { urlForImage } from '@lib/sanity.image'
import { CustomPortableText } from '@components/ui/CustomPortableText'
import Author from './Author'
import ArticleSocialShare from './ArticleSocialShare'
import { badgeVariants } from '@components/ui/Badge'

import type { Metadata } from 'next'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
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
      section: post.division ? post.division.name : undefined,
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
    keywords:
      post.division && post.conferences
        ? [post.division.name, ...post.conferences.map((conference) => conference.name)]
        : undefined,
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

  const breadcrumbs = [
    {
      title: 'News',
      href: '/news',
    },
    // only include division if it exists
    post.division && {
      title: post.division.name,
      href: `/news/${post.division.slug}`,
    },
    {
      title: post.title,
      href: `/${post.slug}`,
    },
  ]

  return (
    <>
      <ReadingProgress />
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />
            <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg font-normal lg:text-xl">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-10">
              {(post.division || post.conferences) && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.division && (
                      <Link
                        href={`/news/${post.division.slug}`}
                        className={badgeVariants({ variant: 'default' })}
                      >
                        {post.division.name}
                      </Link>
                    )}
                    {post.conferences &&
                      post.conferences.map((conference) => (
                        <Link
                          key={conference.slug}
                          href={`/news/${post.division.slug}/${conference.slug}`}
                          className={badgeVariants({ variant: 'default' })}
                        >
                          {conference.shortName ?? conference.name}
                        </Link>
                      ))}
                  </div>
                  <span className="text-sm">•</span>
                </>
              )}
              <Date dateString={post.publishedAt} className="text-sm" />
            </div>
          </div>
        </div>
      </section>
      <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-20 xl:gap-24">
            <div className="lg:w-64 lg:shrink-0">
              <Author {...post.author} />
            </div>
            <div className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <article className="lg:max-w-none">
                <ImageComponent
                  image={post.mainImage}
                  className="mb-12 h-auto w-full rounded-2xl shadow-md"
                  width={864}
                  height={576}
                />
                <div className="prose prose-lg prose-zinc mx-auto mt-8 max-w-none dark:prose-invert lg:prose-xl">
                  <CustomPortableText value={post.body} />
                </div>
              </article>
              <ArticleSocialShare slug={post.slug} title={post.title} />
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
                division={morePost.division}
                conferences={morePost.conferences}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
