import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import { NextSeo, ArticleJsonLd } from 'next-seo'
import { CameraIcon } from '@heroicons/react/solid'
import { Layout } from '@components/common'
import { PostHeader, MorePosts } from '@components/post'
import { postQuery, postSlugsQuery } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'

interface PostProps {
  post: Post
  morePosts: Post[]
}

const Article = ({ post, morePosts }: PostProps) => {
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
      />
      <ArticleJsonLd
        url={`https://www.redshirtsports.xyz/${post.slug}`}
        title={post.title}
        datePublished={post.publishedAt}
        dateModified={post._updatedAt}
        authorName={[post.author.name]}
        publisherName="Redshirt Sports"
        publisherLogo={urlForImage(post.author.image).url()!}
        images={[urlForImage(post.mainImage).height(574).width(1020).url()!]}
        description={post.excerpt}
      />
      <div className="sm:my-8 max-w-3xl mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-col-dense lg:grid-cols-3">
        <section className="hidden lg:block lg:col-start-1 lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {morePosts.length > 0 && <MorePosts morePosts={morePosts} />}
          </div>
        </section>
        <div className="space-y-6 lg:col-start-2 lg:col-span-2">
          <article>
            <div className="bg-white shadow sm:rounded-lg">
              <div className="w-full relative">
                <figure>
                  <Image
                    src={
                      urlForImage(post.mainImage).height(574).width(1020).url()!
                    }
                    width="1020"
                    height="574"
                    layout="responsive"
                    alt={post.mainImage.caption}
                    className="sm:rounded-t-lg"
                    priority
                  />
                  <figcaption className="mt-3 ml-3 flex text-sm text-gray-500">
                    <CameraIcon
                      className="flex-none w-5 h-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="ml-2">{`Source: ${post.mainImage.attribution}`}</span>
                  </figcaption>
                </figure>
              </div>
              {/* Article */}
              <div className="my-0 mx-auto px-4 max-w-2xl py-10 xl:px-0">
                <PostHeader
                  author={post.author}
                  title={post.title}
                  category={post.categories[0]}
                  date={post.publishedAt}
                  snippet={post.excerpt}
                />
                <div className="my-6 prose prose-indigo prose-lg text-gray-500 mx-auto">
                  <PortableText blocks={post.body} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}

Article.Layout = Layout

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { post, morePosts } = await getClient(preview).fetch(postQuery, {
    slug: params?.slug,
  })

  if (!post) {
    return { notFound: true }
  }

  return {
    props: {
      post,
      morePosts: overlayDrafts(morePosts),
    },
    revalidate: 7200, // Revalidate every 2 hours
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
