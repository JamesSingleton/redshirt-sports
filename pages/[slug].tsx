import { GetStaticProps, GetStaticPaths } from 'next'
import Link from 'next/link'
import {
  NextSeo,
  ArticleJsonLd,
  BreadcrumbJsonLd,
  WebPageJsonLd,
} from 'next-seo'
import { usePlausible } from 'next-plausible'
import { Layout } from '@components/common'
import {
  MorePosts,
  OtherAuthors,
  PostHeader,
  PostImage,
  WrittenBy,
  PopularPosts,
} from '@components/post'
import { postSlugsQuery, postQuery } from '@lib/sanityGroqQueries'
import { PortableText, urlForImage } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'

interface PostProps {
  post: Post
  morePosts: Post[]
  topPosts: Post[]
}

const Article = ({ post, morePosts, topPosts }: PostProps) => {
  let categoryName = 'FCS'

  post.categories.map((category) => {
    if (category === 'FBS') {
      categoryName = category
    }
  })

  return (
    <>
      <NextSeo
        title={post.title}
        description={post.excerpt}
        canonical={`https://www.redshirtsports.xyz/${post.slug}`}
        openGraph={{
          title: `${post.title} - Redshirt Sports`,
          url: `https://www.redshirtsports.xyz/${post.slug}`,
          type: 'article',
          article: {
            publishedTime: post.publishedAt,
            modifiedTime: post._updatedAt,
            section: `${categoryName} College Football`,
            authors: [
              `https://www.redshirtsports.xyz/authors/${post.author.slug}`,
            ],
            tags: post.categories,
          },
          images: [
            {
              url: urlForImage(post.mainImage).height(574).width(1020).url()!,
              width: 1020,
              height: 574,
              alt: post.mainImage.caption,
            },
          ],
        }}
        twitter={{
          handle: post.author.twitterHandle,
        }}
      />
      <WebPageJsonLd
        id={`https://www.redshirtsports.xyz/${post.slug}`}
        description={post.title}
      />
      <ArticleJsonLd
        url={`https://www.redshirtsports.xyz/${post.slug}`}
        title={post.title}
        datePublished={post.publishedAt}
        dateModified={post._updatedAt}
        authorName={[post.author.name]}
        publisherName="Redshirt Sports"
        publisherLogo="https://www.redshirtsports.xyz/images/icons/RS_512.png"
        images={[urlForImage(post.mainImage).height(574).width(1020).url()!]}
        description={post.excerpt}
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
            name: post.title,
            item: `https://www.redshirtsports.xyz/${post.slug}`,
          },
        ]}
      />

      <article>
        <div className="pt-10 lg:pt-16">
          <PostHeader
            title={post.title}
            publishedAt={post.publishedAt}
            category={categoryName}
            author={post.author}
            excerpt={post.excerpt}
            estimatedReadingTime={post.estimatedReadingTime}
            slug={post.slug}
          />
          <PostImage image={post.mainImage} />
          <div className="container mx-auto my-10 flex flex-col px-4 lg:flex-row lg:px-32">
            <div className="w-full lg:w-3/5 xl:w-2/3 xl:pr-20">
              <div className="space-y-10">
                <PortableText
                  blocks={post.body}
                  className="prose prose-lg prose-slate mx-auto !max-w-screen-md prose-a:text-indigo-600 hover:prose-a:text-indigo-500  dark:prose-invert dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-600"
                />
                <div className="mx-autor flex max-w-screen-md flex-wrap">
                  <Link href={`/${categoryName.toLowerCase()}`}>
                    <a className="nc-Tag dark:hover:border-slate-6000 mr-2 mb-2 inline-block rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm hover:border-slate-200 dark:border-slate-700 dark:bg-slate-700 md:py-2.5 md:px-4">
                      {categoryName}
                    </a>
                  </Link>
                </div>
                <div className="mx-auto max-w-screen-md border-b border-t border-slate-200 dark:border-slate-700" />
                <WrittenBy author={post.author} />
              </div>
            </div>
            <div className="mt-12 w-full lg:mt-0 lg:w-2/5 lg:pl-10 xl:w-1/3 xl:pl-0">
              <div className="space-y-6">
                <OtherAuthors otherAuthors={post.otherAuthors!} />
                <PopularPosts topPosts={topPosts} />
              </div>
            </div>
          </div>
          <MorePosts morePosts={morePosts} />
        </div>
      </article>
    </>
  )
}

Article.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const topPages = await fetch(
    'https://plausible.io/api/v1/stats/breakdown?site_id=redshirtsports.xyz&period=6mo&property=event:page&limit=5',
    {
      headers: {
        Authorization: `Bearer ${process.env.PLAUSIBLE_API_TOKEN}`,
      },
    }
  )
    .then(async (res) => res.json())
    .then((res) =>
      res.results
        .filter((result: { page: string }) => result.page !== '/')
        .map((result: { page: string }) => result.page.replace('/', ''))
    )
  const { post, morePosts, topPosts } = await getClient().fetch(postQuery, {
    slug: params?.slug,
    topPages: topPages,
  })

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
      morePosts: overlayDrafts(morePosts),
      topPosts,
    },
    revalidate: 10, // In seconds
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export default Article
