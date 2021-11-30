import { GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { allAuthors } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'

const Authors = ({ authors }: any) => {
  return (
    <>
      <NextSeo
        title="Meet the Team"
        description="Meet the team that makes Redshirt Sports possible!"
      />
      <div>
        <div className="mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24">
          <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            <div className="space-y-5 sm:space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Our Team
              </h2>
              <p className="text-xl text-gray-500">
                Redshirt Sports is dedicated to college football with an
                emphasis on the FCS. The only way to create such coverage is
                with great people who truly enjoy their job.
              </p>
            </div>
            <div className="lg:col-span-2">
              <ul
                role="list"
                className="space-y-12 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:gap-x-8"
              >
                {authors.map((author: any) => (
                  <Link key={author._id} href={`authors/${author.slug}`}>
                    <a>
                      <li>
                        <div className="space-y-4">
                          <div>
                            <Image
                              className="object-cover shadow-lg rounded-lg"
                              src={
                                urlForImage(author.image)
                                  .width(384)
                                  .height(256)
                                  .url()!
                              }
                              alt=""
                              width="384"
                              height="256"
                              layout="responsive"
                            />
                          </div>
                          <div className="text-lg leading-6 font-medium space-y-1">
                            <h3>{author.name}</h3>
                            <p className="text-indigo-600">{author.role}</p>
                          </div>
                          <div className="text-lg">
                            <p className="text-gray-500">
                              <PortableText blocks={author.bio} />
                            </p>
                          </div>

                          <ul role="list" className="flex space-x-5">
                            <li>
                              <a
                                href={author.twitterURL}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <span className="sr-only">Twitter</span>
                                <svg
                                  className="w-5 h-5"
                                  aria-hidden="true"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                                </svg>
                              </a>
                            </li>
                          </ul>
                        </div>
                      </li>
                    </a>
                  </Link>
                ))}
              </ul>
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
