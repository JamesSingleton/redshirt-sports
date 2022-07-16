import Link from 'next/link'
import { NextSeo, WebPageJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from 'next-seo'

import { Layout } from '@components/common'
import { sanityClient, getClient } from '@lib/sanity.server'
import { postSlugsQuery, postQuery } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { BlurImage, Date } from '@components/ui'
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
  return (
    <>
      <NextSeo
        title={currentPost.title}
        description={currentPost.excerpt}
        canonical={`https://www.redshirtsports.xyz/${currentPost.slug}`}
        openGraph={{
          title: currentPost.title,
          description: currentPost.excerpt,
        }}
        twitter={{
          handle: currentPost.author.twitterHandle,
        }}
      />
      <WebPageJsonLd
        id={`https://www.redshirtsports.xyz/${currentPost.slug}`}
        description={currentPost.title}
      />
      <ArticleJsonLd
        url={`https://www.redshirtsports.xyz/${currentPost.slug}`}
        title={currentPost.title}
        datePublished={currentPost.publishedAt}
        dateModified={currentPost._updatedAt}
        authorName={[currentPost.author.name]}
        publisherName="Redshirt Sports"
        publisherLogo="https://www.redshirtsports.xyz/images/icons/RS_512.png"
        images={[urlForImage(currentPost.mainImage).height(574).width(1020).url()!]}
        description={currentPost.excerpt}
      />
      <BreadcrumbJsonLd
        itemListElements={[
          {
            position: 1,
            name: 'Home',
            item: 'https://www.redshirtsports.xyz',
          },
          {
            position: 2,
            name: categoryName.toLowerCase(),
            item: `https://www.redshirtsports.xyz/${categoryName.toLowerCase()}`,
          },
          {
            position: 3,
            name: currentPost.title,
            item: `https://www.redshirtsports.xyz/${currentPost.slug}`,
          },
        ]}
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
