import Link from 'next/link'
import { Graph } from 'schema-dts'
import { toPlainText } from '@portabletext/react'
import { getYear, parseISO } from 'date-fns'
import { CameraIcon } from 'lucide-react'

import { Date, ArticleCard, ReadingProgress, Breadcrumbs, ImageComponent } from '@components/ui'
import { Org, Web } from '@lib/ldJson'
import { CustomPortableText } from '@components/ui/CustomPortableText'
import Author from './Author'
import ArticleSocialShare from './ArticleSocialShare'
import { badgeVariants } from '@components/ui/Badge'
import { urlForImage } from '@lib/sanity.image'
import { baseUrl } from '@lib/constants'

import { PostPayload } from '@types'

export interface ArticleProps {
  post: PostPayload
}

export function Article({ post }: ArticleProps) {
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
      ? [
          post.division.name,
          ...post.conferences.map((conference) => conference.name),
          ...post.conferences.map((conference) => conference.shortName),
        ].filter((keyword) => keyword !== null)
      : undefined

  const articleSections =
    post.division && post.conferences
      ? [post.division.name, ...post.conferences.map((conference) => conference.name)]
      : undefined

  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [
      Org,
      Web,
      {
        '@type': 'NewsArticle',
        '@id': `${baseUrl}/${post.slug}#article`,
        isPartOf: {
          '@id': `${baseUrl}/${post.slug}`,
        },
        image: {
          '@type': 'ImageObject',
          url: urlForImage(post.mainImage).width(1200).height(630).url(),
          inLanguage: 'en-US',
          contentUrl: urlForImage(post.mainImage).width(1200).height(630).url(),
          width: '1200',
          height: '630',
        },
        author: {
          name: post.author.name,
          '@id': `${baseUrl}/authors/${post.author.slug}#author`,
        },
        headline: post.title,
        datePublished: post.publishedAt,
        dateModified: post._updatedAt,
        mainEntityOfPage: {
          '@id': `${baseUrl}/${post.slug}`,
        },
        wordCount: post.wordCount,
        publisher: {
          '@id': `${baseUrl}#organization`,
        },
        keywords: keywords,
        articleSection: articleSections,
        inLanguage: 'en-US',
        copyrightYear: getYear(parseISO(post.publishedAt)),
        copyrightHolder: {
          '@id': `${baseUrl}#organization`,
        },
      },
      {
        '@type': 'WebPage',
        '@id': `${baseUrl}/${post.slug}`,
        url: `${baseUrl}/${post.slug}`,
        name: post.title,
        isPartOf: {
          '@id': `${baseUrl}#website`,
        },
        datePublished: post.publishedAt,
        dateModified: post._updatedAt,
        inLanguage: 'en-US',
        description: post.excerpt,
        breadcrumb: {
          '@id': `${baseUrl}/${post.slug}#breadcrumb`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/${post.slug}#breadcrumb`,
        name: 'Article Breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'News',
            item: `${baseUrl}/news`,
          },
          post.division && {
            '@type': 'ListItem',
            position: 3,
            name: post.division.name,
            item: `${baseUrl}/news/${post.division.slug}`,
          },
          {
            '@type': 'ListItem',
            position: post.division ? 4 : 3,
            name: post.title,
            item: `${baseUrl}/${post.slug}`,
          },
        ],
      },
      {
        '@type': 'Person',
        '@id': `${baseUrl}/authors/${post.author.slug}#author`,
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
        description: toPlainText(post.author.bio),
        sameAs: post.author.socialMedia.map((social) => social.url),
        url: `${baseUrl}/authors/${post.author.slug}`,
      },
    ],
  }
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
                  <div className="flex flex-wrap items-center gap-3">
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
              <article>
                <figure className="mb-12 space-y-1.5">
                  <ImageComponent
                    image={post.mainImage}
                    className="h-auto w-full rounded-2xl shadow-md"
                    width={864}
                    height={576}
                    mode={post.mainImage.crop ? 'cover' : 'contain'}
                    loading="eager"
                  />
                  <figcaption className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CameraIcon className="h-4 w-4" />
                    <span>Source: {post.mainImage.attribution}</span>
                  </figcaption>
                </figure>
                <div className="prose prose-zinc mx-auto mt-8 font-serif dark:prose-invert sm:prose-lg lg:prose-xl">
                  <CustomPortableText value={post.body} />
                </div>
              </article>
              <ArticleSocialShare slug={post.slug} title={post.title} />
            </div>
          </div>
        </div>
      </section>
      {post.relatedArticles.length > 0 && (
        <section className="border-t border-zinc-700/100 py-12 sm:py-16 lg:py-20 xl:py-24">
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
                  author={morePost.author}
                  estimatedReadingTime={morePost.estimatedReadingTime}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}

export default Article
