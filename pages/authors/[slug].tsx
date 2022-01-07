import { GetStaticProps, GetStaticPaths } from 'next'
import Image from 'next/image'
import { NextSeo, SocialProfileJsonLd } from 'next-seo'
import { Layout } from '@components/common'
import { getClient, sanityClient } from '@lib/sanity.server'
import {
  authorSlugsQuery,
  authorAndTheirPostsBySlug,
} from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { RecentArticles } from '@components/author'
import type { AuthorTypes } from '@lib/types/author'
import styles from './Authors.module.css'
import { usePlausible } from 'next-plausible'

interface AuthorProps {
  author: AuthorTypes
}

const Author = ({ author }: AuthorProps) => {
  const plausible = usePlausible()
  return (
    <>
      <NextSeo
        title={`${author.name} Profile`}
        description={`Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`}
        canonical={`https://www.redshirtsports.xyz/authors/${author.slug}`}
        openGraph={{
          title: `${author.name} Profile - Redshirt Sports`,
          images: [
            {
              url: urlForImage(author.image).width(600).height(600).url()!,
              width: 600,
              height: 600,
              alt: author.name,
              type: 'image/jpeg',
            },
          ],
        }}
      />
      <SocialProfileJsonLd
        type="Person"
        name={author.name}
        url={`https://www.redshirtsports.xyz/authors/${author.slug}`}
        sameAs={[author.twitterURL]}
      />
      <div className="max-w-7xl mx-auto">
        <div>
          <div className="relative h-32 w-full lg:h-48">
            <Image
              src={
                urlForImage(author.backgroundImage)
                  .height(196)
                  .width(1020)
                  .url()!
              }
              alt={`${author.name} banner image`}
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
              <div className="flex">
                <div className={styles.imageWrapper}>
                  <Image
                    className="rounded-full ring-4 ring-white"
                    src={
                      urlForImage(author.image).height(128).width(128).url()!
                    }
                    alt={author.name}
                    height="128"
                    width="128"
                  />
                </div>
              </div>
              <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
                <div className="sm:hidden 2xl:block mt-6 min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">
                    {author.name}
                  </h1>
                </div>
                <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                  {author.twitterURL && (
                    <a
                      href={author.twitterURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        plausible('clickOnAuthorsTwitter', {
                          props: {
                            author: author.name,
                          },
                        })
                      }
                    >
                      <span className="sr-only">
                        Twitter link for {author.name}
                      </span>
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="w-6 h-6"
                      >
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden sm:block 2xl:hidden mt-6 min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {author.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-2 2xl:mt-5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gray-200">
              <span className="border-transparent text-gray-500 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
                About
              </span>
            </div>
            <div className="mt-6">
              <div className="mt-1 text-sm text-gray-900 space-y-5">
                <PortableText blocks={author.bio} />
              </div>
            </div>
            {/* Article List */}
            <div className="mt-10">
              {author.posts && author.posts?.length > 0 && (
                <RecentArticles authorName={author.name} posts={author.posts} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Author.Layout = Layout

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const author = await getClient().fetch(authorAndTheirPostsBySlug, {
    slug: params?.slug,
  })

  if (!author) {
    return { notFound: true }
  }

  return {
    props: {
      author,
    },
    revalidate: 86400, // Revalidate every 24 hours
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await sanityClient.fetch(authorSlugsQuery)

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })),
    fallback: 'blocking',
  }
}

export default Author
