import { GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { usePlausible } from 'next-plausible'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { allAuthors } from '@lib/sanityGroqQueries'
import { urlForImage } from '@lib/sanity'
import type { AuthorTypes } from '@lib/types/author'

const Authors = ({ authors }: any) => {
  const plausible = usePlausible()
  return (
    <>
      <NextSeo
        title="Meet the Team"
        description="Meet the team that makes Redshirt Sports possible!"
        canonical="https://www.redshirtsports.xyz/authors"
        openGraph={{
          title: 'Meet the Team - Redshirt Sports',
          description: 'Meet the team that makes Redshirt Sports possible!',
        }}
      />
      <div className="relative overflow-hidden">
        <div className="container mx-auto space-y-16 px-4 py-16 lg:space-y-28 lg:py-28 xl:px-32">
          <div className="relative">
            <div className="relative flex flex-col items-center space-y-14 text-center lg:flex-row lg:space-y-0 lg:space-x-10 lg:text-left">
              <div className="w-screen max-w-full space-y-5 lg:space-y-7 xl:max-w-lg">
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl xl:text-5xl">
                  Our Team
                </h1>
                <p className="block text-base dark:text-slate-400 xl:text-lg">
                  Redshirt Sports is dedicated to college football with an
                  emphasis on the FCS. The only way to create such coverage is
                  with great people who truly enjoy their job.
                </p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {authors.map((author: AuthorTypes) => (
                <Link
                  key={author.name}
                  href={`authors/${author.slug}`}
                  prefetch={false}
                >
                  <a>
                    <div className="max-w-sm">
                      <div className="aspect-h-1 aspect-w-1 relative h-0 overflow-hidden rounded-md">
                        <Image
                          src={
                            urlForImage(author.image)
                              .width(296)
                              .height(296)
                              .url()!
                          }
                          className="absolute inset-0 object-cover"
                          alt={`Profile image of author ${author.name}`}
                          width={296}
                          height={296}
                          layout="responsive"
                          sizes="50vw"
                        />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-200 md:text-xl">
                        {author.name}
                      </h2>
                      <p className="block text-sm text-neutral-500 dark:text-neutral-400 sm:text-base">
                        {author.role}
                      </p>
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Authors.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const authors = await getClient().fetch(allAuthors)

  return {
    props: {
      authors,
    },
  }
}

export default Authors
