import { GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { usePlausible } from 'next-plausible'

import { Layout, SEO } from '@components/common'
import { PageHeader } from '@components/ui'
import { sanityClient } from '@lib/sanity.server'
import { allAuthors } from '@lib/queries'
import { urlForImage } from '@lib/sanity'
import { Organization, WebSite } from '@lib/ldJson'
import { Instagram, Twitter, Facebook, Website } from '@components/common/icons'

import type { Author } from '@types'

interface AboutProps {
  authors: Author[]
}

const About = ({ authors }: AboutProps) => {
  const plausible = usePlausible()
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'AboutPage',
        '@id': 'https://www.redshirtsports.xyz/about/#aboutpage',
        url: 'https://www.redshirtsports.xyz/about',
        name: 'About Us - Redshirt Sports',
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        breadcrumb: {
          '@id': 'https://www.redshirtsports.xyz/about/#breadcrumb',
        },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: ['https://www.redshirtsports.xyz/about'],
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.redshirtsports.xyz/about/#breadcrumb',
        name: 'About Breadcrumbs',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@id': 'https://www.redshirtsports.xyz',
              name: 'Home',
            },
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              name: 'About Redshirt Sports',
            },
          },
        ],
      },
    ],
  }
  return (
    <>
      <Head>
        <script
          id="about-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
      </Head>
      <SEO
        title="About Us"
        description="Launched in 2021, Redshirt Sports aims to be your go to source for all things FCS football. Learn about who we are the team that makes it all possible!"
        openGraph={{
          url: 'https://www.redshirtsports.xyz/about',
          title: 'About Us | Redshirt Sports',
          description:
            'Launched in 2021, Redshirt Sports aims to be your go to source for all things FCS football. Learn about who we are the team that makes it all possible!',
        }}
      >
        <link rel="canonical" href="https://www.redshirtsports.xyz/about" />
      </SEO>
      <Layout>
        <PageHeader
          heading="About Redshirt Sports"
          subheading="The new kid on the block when it comes to reporting on the FCS"
        />
        <section className="py-12 sm:py-20 lg:pt-24">
          <div className="prose-xl prose mx-auto px-5 sm:px-6 lg:max-w-7xl lg:px-8">
            <p>
              Redshirt Sports launched at the end of the 2021 season in order to provide another
              platform for FCS content. We are dedicated to the FCS and the community, and we hope
              you enjoy the content that we provide. During the off season we try to keep track of
              the latest news when it comes to transfers to and from the FCS. With the help of the
              team and members of the FCS community, we have been able to keep on top of it thus
              far.
            </p>
            <p>
              We look forward to building relationships with coaches and players around the FCS in
              order to bring you the best content possible. The goal for Redshirt Sports is to
              become one of the go to sources for your FCS Top 25 rankings along with preseason and
              postseason All-American teams.
            </p>
          </div>
        </section>
        <section className="bg-slate-50 py-12 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-cal text-base font-medium uppercase tracking-widest text-brand-500">
                Our Writers
              </h2>
              <p className="mt-2 text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:text-5xl lg:leading-tight">
                Redshirt Sports is dedicated to college football with an emphasis on the FCS.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-500">
                The only way to create such coverage is with great people who truly enjoy their job.
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-7xl sm:mt-16">
              <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                {authors.map((author) => (
                  <li
                    key={author._id}
                    className="relative rounded-3xl border border-slate-300/70 bg-white py-10 px-6 text-center transition duration-300 ease-in-out hover:border-slate-300/30 hover:shadow-lg sm:px-10"
                  >
                    <div>
                      <Image
                        src={urlForImage(author.image).quality(50).url()}
                        alt={`${author.name}'s profile picture`}
                        width={176}
                        height={176}
                        placeholder="blur"
                        blurDataURL={author.image.asset.metadata.lqip ?? undefined}
                        quality={50}
                        sizes="50vw"
                        className="mx-auto h-40 w-40 overflow-hidden rounded-full object-cover xl:h-44 xl:w-44"
                      />
                      <div className="mt-6 leading-6">
                        <h3 className="font-cal text-xl font-medium text-slate-900">
                          <Link
                            href={`/authors/${author.slug}`}
                            prefetch={false}
                            onClick={() => plausible('clickOnAuthor')}
                          >
                            <span aria-hidden="true" className="absolute inset-0" />
                            {author.name}
                          </Link>
                        </h3>
                        <span className="mt-1 text-base text-brand-500">{author.role}</span>
                      </div>
                      <ul className="mt-6 flex items-center justify-center space-x-3">
                        {author.socialMedia?.map((social) => (
                          <li key={social._key}>
                            <a
                              onClick={() =>
                                plausible('clickOnAuthorSocialMedia', {
                                  props: {
                                    item: social.name,
                                    url: social.url,
                                  },
                                })
                              }
                              href={social.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span className="sr-only">{`${author.name}'s ${social.name}`}</span>
                              {social.name === 'Twitter' ? (
                                <Twitter className="h-5 w-5 text-slate-400 transition duration-300 ease-in-out" />
                              ) : null}
                              {social.name === 'Facebook' ? (
                                <Facebook className="h-5 w-5 text-slate-400 transition duration-300 ease-in-out" />
                              ) : null}
                              {social.name === 'Instagram' ? (
                                <Instagram className="h-5 w-5 text-slate-400 transition duration-300 ease-in-out" />
                              ) : null}
                              {social.name === 'Website' ? (
                                <Website className="h-5 w-5 text-slate-400 transition duration-300 ease-in-out" />
                              ) : null}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <section className="bg-brand-700">
          <div className="mx-auto max-w-2xl py-16 px-4 text-center sm:py-20 sm:px-6 lg:px-8">
            <h2 className="font-cal text-3xl font-extrabold text-white sm:text-4xl">
              Help make Redshirt Sports better!
            </h2>
            <p className="mt-4 text-lg leading-6 text-brand-200">
              Whether you are looking to submit a guest post, write a feature article, or trying to
              get started writing content for the FCS, we are always looking for new writers to join
              our team.
            </p>
            <Link
              href="/contact"
              prefetch={false}
              onClick={() => plausible('Join Our Team')}
              className="mt-8 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-base font-medium text-brand-600 hover:bg-brand-50 sm:w-auto"
            >
              Join our team
            </Link>
          </div>
        </section>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const authors = await sanityClient.fetch(allAuthors)

  return {
    props: {
      authors,
    },
  }
}

export default About
