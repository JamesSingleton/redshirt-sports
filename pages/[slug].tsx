import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo, ArticleJsonLd, BreadcrumbJsonLd } from 'next-seo'
import { CameraIcon, HomeIcon, ChevronRightIcon } from '@heroicons/react/solid'
import { usePlausible } from 'next-plausible'
import { Layout } from '@components/common'
import { PostHeader, RelatedArticles } from '@components/post'
import { postSlugsQuery, postQuery } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { sanityClient, getClient, overlayDrafts } from '@lib/sanity.server'
import type { Post } from '@lib/types/post'

interface PostProps {
  post: Post
  morePosts: Post[]
}

const Article = ({ post, morePosts }: PostProps) => {
  const plausible = usePlausible()
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
        publisherLogo="/images/icons/RS_512.png"
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
      <div className="max-w-3xl mx-auto sm:px-6 lg:max-w-7xl">
        <nav className="flex my-4" aria-label="Breadcrumb">
          <ol role="list" className="px-4 flex space-x-4 sm:px-6 lg:px-0">
            <li className="flex">
              <div className="flex items-center">
                <Link href="/" prefetch={false}>
                  <a
                    onClick={() =>
                      plausible('clickOnBreadCrumb', {
                        props: {
                          location: 'Home',
                        },
                      })
                    }
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <HomeIcon
                      className="flex-shrink-0 h-5 w-5"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Home</span>
                  </a>
                </Link>
              </div>
            </li>
            <li key={`${categoryName.toLowerCase()}_breadcrumb`}>
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <Link href={`/${categoryName.toLowerCase()}`} prefetch={false}>
                  <a
                    onClick={() =>
                      plausible('clickOnBreadCrumb', {
                        props: {
                          location: categoryName,
                        },
                      })
                    }
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    {categoryName}
                  </a>
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon
                  className="flex-shrink-0 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <Link href={`/${post.slug}`} prefetch={false}>
                  <a
                    onClick={() =>
                      plausible('clickOnBreadCrumb', {
                        props: {
                          location: post.title,
                        },
                      })
                    }
                    className="truncate w-44 ml-4 text-sm font-medium text-gray-500 hover:text-gray-700 sm:w-80 md:w-full"
                    aria-current="page"
                  >
                    {post.title}
                  </a>
                </Link>
              </div>
            </li>
          </ol>
        </nav>
        <article>
          <div className="bg-white shadow sm:rounded-lg">
            <div className="w-full relative">
              <figure>
                <Image
                  src={
                    urlForImage(post.mainImage)
                      .height(738)
                      .width(1280)
                      .fit('min')
                      .quality(75)
                      .url()!
                  }
                  width="1280"
                  height="738"
                  sizes="50vw"
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
            <div className="my-0 mx-auto px-4 max-w-3xl py-10 lg:max-w-5xl xl:px-0">
              <PostHeader
                author={post.author}
                title={post.title}
                categories={post.categories}
                date={post.publishedAt}
                snippet={post.excerpt}
                slug={post.slug}
              />
              <div className="my-6 prose prose-slate prose-lg mx-auto max-w-3xl prose-a:text-indigo-600 hover:prose-a:text-indigo-500 lg:max-w-5xl">
                <PortableText blocks={post.body} />
              </div>
            </div>
          </div>
        </article>
        <RelatedArticles posts={morePosts} />
      </div>
    </>
  )
}

Article.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { post, morePosts } = await getClient().fetch(postQuery, {
    slug: params?.slug,
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

export default Article
