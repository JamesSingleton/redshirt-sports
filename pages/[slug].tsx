import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { NextSeo, ArticleJsonLd } from 'next-seo'
import { CameraIcon } from '@heroicons/react/solid'
import { Layout } from '@components/common'
import { PostHeader, MorePosts } from '@components/post'
import { postQuery, postSlugsQuery } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'

interface PostProps {
  post: {
    _id: string
    _updatedAt: string
    author: {
      name: string
      image: string
      slug: string
    }
    mainImage: string
    publishedAt: string
    slug: string
    title: string
    category: {
      title: string
      description: string
    }
    excerpt: string
    body: string
  }
  morePosts: [
    {
      _id: string
      author: {
        name: string
        image: string
        slug: string
      }
      mainImage: string
      publishedAt: string
      slug: string
      title: string
      category: {
        title: string
        description: string
      }
    }
  ]
}

const Post = ({ post, morePosts }: PostProps) => {
  return (
    <>
      <NextSeo
        title={`${post?.title}`}
        canonical={`https://www.redshirtsports.xyz/${post?.slug}`}
        openGraph={{
          title: post?.title,
          url: `https://www.redshirtsports.xyz/${post?.slug}`,
          type: 'article',
          article: {
            publishedTime: post?.publishedAt,
            modifiedTime: post?._updatedAt,
            authors: [
              `https://www.redshirtsports.xyz/authors/${post?.author?.slug}`,
            ],
            tags: [`${post?.category?.title}`],
          },
          images: [
            {
              url: urlForImage(post?.mainImage).height(574).width(1020).url()!,
              width: 1020,
              height: 574,
              alt: 'JMU joins SunBelt Conference',
            },
          ],
        }}
      />
      <ArticleJsonLd
        url={`https://www.redshirtsports.xyz/${post?.slug}`}
        title={post?.title}
        datePublished={post?.publishedAt}
        dateModified={post?._updatedAt}
        authorName={[post?.author?.name]}
        publisherName="Redshirt Sports"
        publisherLogo="https://www.redshirtsports.xyz/images/james_singleton.png"
        images={[urlForImage(post?.mainImage).height(574).width(1020).url()!]}
        description="Post"
      />
      <div className="sm:my-8 max-w-3xl mx-auto grid grid-cols-1 gap-6 sm:px-6 lg:max-w-7xl lg:grid-col-dense lg:grid-cols-3">
        <section
          aria-labelledby="timeline-title"
          className="hidden lg:block lg:col-start-1 lg:col-span-1"
        >
          <div className="sticky top-24 space-y-4">
            <div className="bg-white px-4 pb-5 shadow sm:rounded-lg sm:px-6 h-80"></div>
            {morePosts.length > 0 && <MorePosts />}
          </div>
        </section>
        <div className="space-y-6 lg:col-start-2 lg:col-span-2">
          <article aria-labelledby="applicant-information-title">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="w-full relative">
                <figure>
                  <Image
                    src={
                      urlForImage(post?.mainImage)
                        .height(574)
                        .width(1020)
                        .url()!
                    }
                    width="1020"
                    height="574"
                    layout="responsive"
                    alt="Missouri State"
                    className="sm:rounded-t-lg"
                    priority
                  />
                  <figcaption className="mt-3 ml-3 flex text-sm text-gray-500">
                    <CameraIcon
                      className="flex-none w-5 h-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <span className="ml-2">Source: JMU Athletics</span>
                  </figcaption>
                </figure>
              </div>
              {/* Article */}
              <div className="my-0 mx-auto px-4 max-w-2xl py-10 xl:px-0">
                <PostHeader
                  author={post?.author}
                  title={post?.title}
                  category={post?.category?.title}
                  date={post?.publishedAt}
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

Post.Layout = Layout

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { post, morePosts } = await getClient(preview).fetch(postQuery, {
    slug: params?.slug,
  })

  return {
    props: {
      post,
      morePosts: overlayDrafts(morePosts),
    },
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(postSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export default Post
