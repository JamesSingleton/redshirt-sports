import Script from 'next/script'
import { NextSeo } from 'next-seo'
import { toPlainText } from '@portabletext/react'

import { Layout } from '@components/common'
import { sanityClient, getClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { PostHeader, PostFooter } from '@components/post'

import type { GetStaticPaths, GetStaticProps } from 'next'
import type { Post } from '@types'

interface PostProps {
  currentPost: Post
  nextPost: Post
  previousPost: Post
}

export default function Post({ currentPost, nextPost, previousPost }: PostProps) {
  let categoryName = 'FCS'

  currentPost.categories.map((category) => {
    if (category === 'FBS') {
      categoryName = category
    }
  })
  const content = {
    '@context': 'http://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.redshirtsports.xyz/#organization',
        name: 'Redshirt Sports',
        url: 'https://www.redshirtsports.xyz',
        sameAs: [
          'https://www.facebook.com/RedshirtSportsNews',
          'https://twitter.com/_redshirtsports',
        ],
        logo: {
          '@type': 'ImageObject',
          '@id': 'https://www.redshirtsports.xyz/#logo',
          inLanguage: 'en-US',
          url: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
          contentUrl: 'https://www.redshirtsports.xyz/images/icons/RS_512.png',
          width: 512,
          height: 512,
          caption: 'Redshirt Sports',
        },
        image: {
          '@id': 'https://www.redshirtsports.xyz/#logo',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.redshirtsports.xyz/#website',
        name: 'Redshirt Sports',
        url: 'https://www.redshirtsports.xyz/',
        description:
          'Redshirt Sports brings you the College Football Championship Subdivision (FCS) news, standings, rumors, and more.',
        publisher: {
          '@id': 'https://www.redshirtsports.xyz/#organization',
        },
        inLanguage: 'en-US',
      },
      {
        '@type': 'ImageObject',
        '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#primaryimage`,
        inLanguage: 'en-US',
        url: urlForImage(currentPost.mainImage).width(1200).height(676).fit('scale').url(),
        width: 1200,
        height: 676,
        caption: currentPost.mainImage.caption,
      },
      {
        '@type': 'WebPage',
        '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#webpage`,
        url: `https://www.redshirtsports.xyz/${currentPost.slug}`,
        name: currentPost.title,
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        primaryImageOfPage: {
          '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#primaryimage`,
        },
        datePublished: currentPost.publishedAt,
        dateModified: currentPost._updatedAt,
        description: currentPost.excerpt,
        breadcrumb: {
          '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#breadcrumb`,
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: `https://www.redshirtsports.xyz/${currentPost.slug}`,
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#breadcrumb`,
        name: 'Article Breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://www.redshirtsports.xyz',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: `https://www.redshirtsports.xyz/${categoryName.toLowerCase()}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: currentPost.title,
            item: `https://www.redshirtsports.xyz/${currentPost.slug}`,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#article`,
        isPartOf: {
          '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#webpage`,
        },
        author: {
          '@id': `https://www.redshirtsports.xyz/authors/${currentPost.author.slug}`,
        },
        headline: currentPost.title,
        datePublished: currentPost.publishedAt,
        dateModified: currentPost._updatedAt,
        mainEntityOfPage: {
          '@id': `https://www.redshirtsports.xyz/${currentPost.slug}/#webpage`,
        },
        wordCount: currentPost.wordCount,
        publisher: {
          '@id': 'https://www.redshirtsports.xyz/#organization',
        },
        image: [
          urlForImage(currentPost.mainImage).width(1920).height(1080).fit('scale').url(),
          urlForImage(currentPost.mainImage).width(640).height(480).url(),
          urlForImage(currentPost.mainImage).width(1200).height(1200).fit('scale').url(),
        ],
        thumbnailUrl: urlForImage(currentPost.mainImage).url(),
        articleSection: [categoryName],
        inLanguage: 'en-US',
      },
      {
        '@type': 'Person',
        '@id': `https://www.redshirtsports.xyz/authors/${currentPost.author.slug}`,
        name: currentPost.author.name,
        url: `https://www.redshirtsports.xyz/authors/${currentPost.author.slug}`,
        description: toPlainText(currentPost.author.bio),
        image: {
          '@type': 'ImageObject',
          inLanguage: 'en-US',
          url: urlForImage(currentPost.author.image).url(),
          contentUrl: urlForImage(currentPost.author.image).url(),
          caption: currentPost.author.name,
        },
        sameAs: ['https://www.redshirtsports.xyz', currentPost.author.twitterURL],
      },
    ],
  }
  return (
    <>
      <Script
        id="app-ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(content, null, '\t'),
        }}
      />
      <NextSeo
        title={currentPost.title}
        description={currentPost.excerpt}
        canonical={`https://www.redshirtsports.xyz/${currentPost.slug}`}
        openGraph={{
          title: currentPost.title,
          description: currentPost.excerpt,
          type: 'article',
          article: {
            publishedTime: currentPost.publishedAt,
            modifiedTime: currentPost._updatedAt,
            section: categoryName,
            authors: [`https://www.redshirtsports.xyz/authors/${currentPost.author.slug}`],
          },
          images: [
            {
              url: urlForImage(currentPost.mainImage).width(1200).height(630).url(),
              width: 1200,
              height: 630,
              alt: currentPost.mainImage.caption,
            },
          ],
        }}
        twitter={{
          handle: currentPost.author.twitterHandle,
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <Layout>
        <article className="bg-slate-50 pb-12 sm:pb-16 lg:pb-24">
          <PostHeader post={currentPost} />
          <div className="px-5 lg:px-0">
            <div className="prose mx-auto sm:prose-lg">
              <PortableText value={currentPost?.body} />
            </div>
            <PostFooter
              author={currentPost.author}
              title={currentPost.title}
              slug={currentPost.slug}
            />
          </div>
        </article>
        {/* <section className="mx-auto flex flex-col justify-center bg-slate-50 px-5 sm:flex-row sm:px-0">
        {nextPost && (
          <div className="flex flex-col">
            <span>Next post</span>
            <Link href={`/${nextPost.slug}`}>
              <a>{nextPost.title}</a>
            </Link>
          </div>
        )}
        {previousPost && (
          <div className="flex flex-col">
            <span>Previous post</span>
            <Link href={`/${previousPost.slug}`}>
              <a>{previousPost.title}</a>
            </Link>
          </div>
        )}
      </section> */}
      </Layout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  if (!params) throw new Error('No path parameters found')

  const { currentPost, nextPost, previousPost } =
    (await getClient().fetch(postQuery, {
      slug: params?.slug,
    })) || {}

  if (!currentPost || currentPost === null) {
    return {
      notFound: true,
      revalidate: 10,
    }
  }

  return {
    props: {
      currentPost,
      nextPost,
      previousPost,
    },
    revalidate: 3600,
  }
}
