import { GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { Container } from '@components/ui'
import { getClient } from '@lib/sanity.server'
import { allAuthors } from '@lib/sanityGroqQueries'
import { urlForImage, PortableText } from '@lib/sanity'
import { usePlausible } from 'next-plausible'

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
      <div>
        <Container>
          <div className="space-y-12 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
            <div className="space-y-5 sm:space-y-4">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                Our Team
              </h1>
              <p className="text-xl">
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
                  <li key={author._id} role="listitem">
                    <Link href={`authors/${author.slug}`} prefetch={false}>
                      <a
                        onClick={() =>
                          plausible('clickOnAuthor', {
                            props: {
                              name: author.name,
                              location: 'Authors Page',
                            },
                          })
                        }
                      >
                        <div className="space-y-4">
                          <div>
                            <Image
                              className="rounded-lg object-cover shadow-lg"
                              src={
                                urlForImage(author.image)
                                  .width(384)
                                  .height(256)
                                  .url()!
                              }
                              alt={author.name}
                              width="384"
                              height="256"
                              layout="responsive"
                            />
                          </div>
                          <div className="space-y-1 text-lg font-medium leading-6">
                            <h2>{author.name}</h2>
                            <p className="text-indigo-600">{author.role}</p>
                          </div>
                          <div className="text-lg line-clamp-3">
                            <PortableText blocks={author.bio} />
                          </div>

                          <ul role="list" className="flex space-x-5">
                            <li>
                              <a
                                href={author.twitterURL}
                                className="hover:text-slate-400"
                                onClick={() =>
                                  plausible(
                                    `clickOn-${author.name}TwitterFromAuthorsPage`
                                  )
                                }
                              >
                                <span className="sr-only">
                                  Twitter Link for ${author.name}
                                </span>
                                <svg
                                  className="h-5 w-5"
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
                      </a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
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
