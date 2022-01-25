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
      <div>
        <div className="w-screen px-2 xl:max-w-screen-2xl mx-auto">
          <div className="rounded-md relative aspect-w-16 aspect-h-16 sm:aspect-h-9 lg:aspect-h-6 overflow-hidden">
            <Image
              className="object-cover w-full h-full"
              alt={`${author.name} banner image`}
              src={urlForImage(author.backgroundImage).fit('min').url()!}
              layout="fill"
              priority
              objectFit="cover"
            />
          </div>
          <div className="relative container mx-auto px-4 xl:px-32 -mt-20 lg:-mt-48">
            <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-700 p-5 lg:p-16 rounded-md shadow-2xl flex flex-col sm:flex-row sm:items-center">
              <div className="relative shrink-0 overflow-hidden rounded-full w-20 h-20 lg:w-36 lg:h-36 shadow-2xl">
                <Image
                  src={urlForImage(author.image).fit('min').url()!}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={`Profile image for Author ${author.name}`}
                  width={80}
                  height={80}
                  layout="responsive"
                  sizes="50vw"
                />
              </div>
              <div className="mt-5 sm:mt-0 sm:ml-8 space-y-4">
                <h1 className="inline-block text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50">
                  {author.name}
                </h1>
                <PortableText blocks={author.bio} />
                <div className="flex space-x-2.5 text-2xl text-slate-600 dark:text-slate-300">
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
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 xl:px-32">
          {author.posts && author.posts?.length > 0 && (
            <RecentArticles authorName={author.name} posts={author.posts} />
          )}
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
