import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CameraIcon } from 'lucide-react'
import { Image as SanityImage } from 'next-sanity/image'
import { getYear, parseISO } from 'date-fns'
import { Graph } from 'schema-dts'

import { urlForImage } from '@/lib/sanity.image'
import { HOME_DOMAIN } from '@/lib/constants'
import { getPostBySlug, getPostsPaths } from '@/lib/sanity.fetch'
import { Org, Web } from '@/lib/ldJson'
import { AuthorSection, MobileAuthorSection } from './Author'
import { LargeArticleSocialShare, SmallArticleSocialShare } from './ArticleSocialShare'
import BreadCrumbs from '@/components/breadcrumbs'
import Date from '@/components/date'
import { CustomPortableText } from '@/components/custom-portable-text'
import ArticleCard from '@/components/article-card'
import { badgeVariants } from '@/components/ui/badge'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {}
  }
  const defaultMetadata = constructMetadata({
    title: `${post.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`,
    description: post.excerpt,
    canonical: `/${slug}`,
    image: urlForImage(post.mainImage).width(1200).height(630).url(),
  })

  const keywords =
    post.division && post.conferences
      ? [post.division.name, ...post.conferences.map((conference) => conference.name)].filter(
          (keyword) => keyword !== null,
        )
      : undefined

  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      type: 'article',
      authors: [post.author.name],
      publishedTime: post.publishedAt,
      modifiedTime: post._updatedAt,
    },
    other: {
      'twitter:label1': 'Reading time',
      'twitter:data1': `${post.estimatedReadingTime} min read`,
    },
    keywords,
  }
}

export async function generateStaticParams() {
  // if (process.env.VERCEL_ENV === 'preview') {
  //   return []
  // }
  const postPaths = await getPostsPaths()

  return postPaths.map((path) => ({
    slug: path,
  }))
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return notFound()
  }

  const breadcrumbs = [
    {
      title: 'News',
      href: '/news',
    },
    post.division && {
      title: post.division.name,
      href: `/news/${post.division.slug}`,
    },
    {
      title: post.title,
      href: `/${post.slug}`,
    },
  ]

  const keywords =
    post.division && post.conferences
      ? [post.division.name, ...post.conferences.map((conference) => conference.name)].filter(
          (keyword) => keyword !== null,
        )
      : undefined

  const articleSections =
    post.division && post.conferences
      ? [post.division.name, ...post.conferences.map((conference) => conference.name)]
      : undefined

  const authorField =
    post.authors !== null
      ? post.authors.map((author) => {
          return {
            '@type': 'Person',
            '@id': `${HOME_DOMAIN}/authors/${author.slug}#author`,
            name: author.name,
            image: {
              '@type': 'ImageObject',
              url: urlForImage(author.image).width(96).height(96).url(),
              inLanguage: 'en-US',
              contentUrl: urlForImage(author.image).width(96).height(96).url(),
              width: '96',
              height: '96',
              caption: author.name,
            },
            description: author.biography,
            sameAs: author.socialMedia
              .filter((social) => social.name !== 'Email')
              .map((social) => social.url),
            url: `${HOME_DOMAIN}/authors/${author.slug}`,
            ...(author.collegeOrUniversity && {
              alumniOf: {
                '@type': 'CollegeOrUniversity',
                name: author.collegeOrUniversity,
              },
            }),
          }
        })
      : {
          '@id': `${HOME_DOMAIN}/authors/${post.author.slug}#author`,
          name: post.author.name,
          image: {
            '@type': 'ImageObject',
            url: urlForImage(post.author.image).width(96).height(96).url(),
            inLanguage: 'en-US',
            contentUrl: urlForImage(post.author.image).width(96).height(96).url(),
            width: '96',
            height: '96',
            caption: post.author.name,
          },
          description: post.author.biography,
          sameAs: post.author.socialMedia
            .filter((social) => social.name !== 'Email')
            .map((social) => social.url),
          url: `${HOME_DOMAIN}/authors/${post.author.slug}`,
          ...(post.author.collegeOrUniversity && {
            alumniOf: {
              '@type': 'CollegeOrUniversity',
              name: post.author.collegeOrUniversity,
            },
          }),
        }

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'NewsArticle',
        '@id': `${HOME_DOMAIN}/${post.slug}#article`,
        mainEntityOfPage: {
          '@id': `${HOME_DOMAIN}/${post.slug}#webpage`,
        },
        headline: post.title,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#article-title', '#article-excerpt'],
        },
        image: {
          '@type': 'ImageObject',
          url: urlForImage(post.mainImage).width(1200).height(630).url(),
          inLanguage: 'en-US',
          contentUrl: urlForImage(post.mainImage).width(1200).height(630).url(),
          width: '1200',
          height: '630',
        },
        datePublished: post.publishedAt,
        dateModified: post._updatedAt,
        author: authorField,
        wordCount: post.wordCount,
        publisher: {
          '@id': `${HOME_DOMAIN}#organization`,
        },
        keywords: keywords,
        articleSection: articleSections,
        inLanguage: 'en-US',
        copyrightYear: getYear(parseISO(post.publishedAt)),
        copyrightHolder: {
          '@id': `${HOME_DOMAIN}#organization`,
        },
        description: post.excerpt,
        ...(post.teams !== null && {
          mentions: post.teams.map((team) => {
            return {
              '@type': 'SportsTeam',
              name:
                team.nickname && team.shortName ? `${team.shortName} ${team.nickname}` : team.name,
            }
          }),
        }),
      },
      {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/${post.slug}#webpage`,
        url: `${HOME_DOMAIN}/${post.slug}`,
        name: post.title,
        isPartOf: {
          '@id': `${HOME_DOMAIN}#website`,
        },
        datePublished: post.publishedAt,
        dateModified: post._updatedAt,
        inLanguage: 'en-US',
        description: post.excerpt,
        breadcrumb: {
          '@id': `${HOME_DOMAIN}/${post.slug}#breadcrumb`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/${post.slug}#breadcrumb`,
        name: 'Article Breadcrumbs',
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
            name: 'News',
            item: `${HOME_DOMAIN}/news`,
          },
          post.division && {
            '@type': 'ListItem',
            position: 3,
            name: post.division.name,
            item: `${HOME_DOMAIN}/news/${post.division.slug}`,
          },
          {
            '@type': 'ListItem',
            position: post.division ? 4 : 3,
            name: post.title,
            item: `${HOME_DOMAIN}/${post.slug}`,
          },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="container">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <BreadCrumbs breadCrumbPages={breadcrumbs} />
            <h1
              id="article-title"
              className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl"
            >
              {post.title}
            </h1>
            <p id="article-excerpt" className="mt-4 text-lg font-normal lg:text-xl">
              {post.excerpt}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 lg:mt-10">
              {(post.division || post.conferences) && (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    {post.division && (
                      <Link
                        href={`/news/${post.division.slug}`}
                        className={badgeVariants({ variant: 'default' })}
                        prefetch={false}
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
                          prefetch={false}
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
              <div className="hidden lg:sticky lg:left-0 lg:top-24 lg:flex lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:self-start">
                <AuthorSection author={post.author} authors={post.authors} />
                <LargeArticleSocialShare slug={post.slug} title={post.title} />
              </div>
              <MobileAuthorSection author={post.author} authors={post.authors} />
            </div>
            <div className="max-w-full space-y-8 lg:flex-1 lg:space-y-12">
              <article>
                <figure className="mb-12 space-y-1.5">
                  <SanityImage
                    src={urlForImage(post.mainImage).width(865).height(575).url()}
                    className="h-auto w-full rounded-lg shadow-md"
                    width={865}
                    height={575}
                    sizes="100vw"
                    alt={post.mainImage.asset.altText ?? post.mainImage.caption}
                    priority
                  />
                  <figcaption className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CameraIcon className="h-4 w-4" />
                    <span>
                      Source: {post.mainImage.asset.creditLine ?? post.mainImage.attribution}
                    </span>
                  </figcaption>
                </figure>
                <div className="prose prose-zinc mx-auto mt-8 dark:prose-invert sm:prose-lg lg:prose-xl">
                  <CustomPortableText value={post.body} />
                </div>
              </article>
              <SmallArticleSocialShare slug={post.slug} title={post.title} />
            </div>
          </div>
        </div>
      </section>
      {post.relatedArticles.length > 0 && (
        <section className="border-t border-border py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Related articles
              </h2>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-3 lg:mt-12 xl:gap-16">
              {post.relatedArticles.map((morePost) => (
                <ArticleCard
                  key={morePost._id}
                  title={morePost.title}
                  date={morePost.publishedAt}
                  image={morePost.mainImage}
                  slug={morePost.slug}
                  division={morePost.division}
                  conferences={morePost.conferences}
                  author={morePost.author.name}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
