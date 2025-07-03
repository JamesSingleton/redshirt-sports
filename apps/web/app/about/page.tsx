import Link from 'next/link'

import { Twitter, Facebook, YouTubeIcon } from '@/components/icons'
import PageHeader from '@/components/page-header'
import CustomImage from '@/components/sanity-image'
import { sanityFetch } from '@/lib/sanity/live'
import { getSEOMetadata } from '@/lib/seo'
import { authorsListNotArchived } from '@/lib/sanity/query'
import { JsonLdScript, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'
import type { WithContext, AboutPage } from 'schema-dts'

async function fetchAuthors() {
  return await sanityFetch({
    query: authorsListNotArchived,
  })
}

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: 'About Us',
    description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}! We're dedicated to bringing you comprehensive coverage of college sports at every level, sharing our mission and expertise.`,
    slug: '/about',
  })
}

const aboutPageJsonLd: WithContext<AboutPage> = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${getBaseUrl()}/about`,
  url: `${getBaseUrl()}/about`,
  description: `Meet the team at ${process.env.NEXT_PUBLIC_APP_NAME}! We're dedicated to bringing you comprehensive coverage of college sports at every level, sharing our mission and expertise.`,
  isPartOf: {
    '@type': 'WebSite',
    '@id': websiteId,
  },
  inLanguage: 'en-US',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${getBaseUrl()}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'About',
        item: `${getBaseUrl()}/about`,
      },
    ],
  },
}

export default async function AboutPage() {
  const { data: authors } = await fetchAuthors()

  return (
    <>
      <JsonLdScript data={aboutPageJsonLd} id="about-page-json-ld" />
      <PageHeader title={`About ${process.env.NEXT_PUBLIC_APP_NAME}`} />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="prose prose-xl dark:prose-invert mx-auto max-w-none">
          <p>
            At Redshirt Sports, our passion for college football extends beyond the FCS. We are
            thrilled to announce that we will also be providing comprehensive coverage of FBS, D2,
            and D3 football. Our commitment to delivering high-quality content and staying at the
            forefront of the latest developments in the college football landscape drives us to
            expand our scope and bring you the most engaging stories from across all divisions.
          </p>
          <p>
            Whether you&apos;re a fan of the thrilling FBS action, the fierce competition of D2, or
            the dedication and talent on display in D3, Redshirt Sports is your go-to source for
            in-depth analysis, breaking news, and captivating stories. We believe that every level
            of college football deserves recognition and attention, and we are excited to share the
            excitement and passion that permeates the FBS, D2, and D3 football communities.
          </p>
          <p>
            In addition to our comprehensive coverage of the games, we will also keep you up to date
            on the latest happenings in the transfer portal and provide valuable insights into the
            recruiting process. Our team of will analyze transfers, evaluate the impact of new
            recruits, and offer predictions and rankings to enhance your understanding of the
            college football landscape.
          </p>
          <p>
            From the top-tier programs in FBS to the talent emerging in D2 and D3, Redshirt Sports
            aims to be your ultimate companion for all things college football. We will bring you
            highlights, player spotlights, and captivating stories from across all divisions,
            ensuring that you stay connected to the passion and dedication displayed at every level.
          </p>
          <p>
            Stay tuned for our extensive coverage of FBS, FCS, D2, and D3 football, where we will
            bring you the most compelling content, captivating stories, and expert analysis to
            satisfy your college football cravings. Redshirt Sports is committed to providing you
            with an unforgettable experience across all divisions, ensuring that no matter which
            level you&apos;re most passionate about, you&apos;ll find a home with us. Join us as we
            embark on an incredible journey through the diverse and captivating world of college
            football.
          </p>
        </div>
      </section>
      <section className="bg-secondary py-12 sm:py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto text-center md:max-w-3xl xl:max-w-5xl">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl md:tracking-tight lg:text-5xl lg:leading-tight">
              Meet the Dedicated Team Driving Redshirt Sports&apos; College Football Journey
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-7xl sm:mt-16">
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {authors?.map((author: any) => (
                <li
                  key={author._id}
                  className="bg-card text-card-foreground relative rounded-3xl border px-6 py-10 text-center transition duration-300 ease-in-out hover:border-zinc-300/30 hover:shadow-lg sm:px-10"
                >
                  <div>
                    <CustomImage
                      image={author.image}
                      className="mx-auto h-40 w-40 overflow-hidden rounded-full object-cover object-top xl:h-44 xl:w-44"
                      width={176}
                      height={176}
                    />
                    <div className="mt-6 leading-6">
                      <h3 className="text-xl font-semibold">
                        <Link href={`/authors/${author.slug}`} prefetch={false}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {author.name}
                        </Link>
                      </h3>
                      {author.roles && (
                        <span className="text-muted-foreground mt-1 text-base">
                          {author.roles.join(', ')}
                        </span>
                      )}
                    </div>
                    {author.socialLinks && (
                      <ul className="mt-6 flex items-center justify-center space-x-3">
                        {author.socialLinks.twitter && (
                          <li>
                            <Link
                              href={author.socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Twitter
                                name="twitter"
                                className="fill-muted-foreground hover:fill-primary size-6"
                              />
                              <span className="sr-only">
                                {`Follow ${author.name} on X (Formerly Twitter)`}
                              </span>
                            </Link>
                          </li>
                        )}
                        {author.socialLinks.facebook && (
                          <li>
                            <Link
                              href={author.socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Facebook
                                name="facebook"
                                className="fill-muted-foreground hover:fill-primary size-6"
                              />
                              <span className="sr-only">{`Follow ${author.name} on Facebook`}</span>
                            </Link>
                          </li>
                        )}
                        {author.socialLinks.youtube && (
                          <li>
                            <Link
                              href={author.socialLinks.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <YouTubeIcon
                                name="youtube"
                                className="fill-muted-foreground hover:fill-primary size-6"
                              />
                              <span className="sr-only">{`Subscribe to ${author.name}'s YouTube channel`}</span>
                            </Link>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">
            Join Our Community and Contribute
          </h2>
          <div className="prose prose-xl dark:prose-invert mx-auto mt-12 px-5 sm:px-6 lg:max-w-7xl lg:px-8">
            <p>
              We believe in the power of a strong community. Redshirt Sports is not just a website
              but a platform that brings college football enthusiasts together. We invite you to
              become a part of our community and contribute to the growth of our website.
            </p>
            <p>
              Are you passionate about college football? Do you have a unique perspective, insider
              knowledge, or a knack for storytelling? We welcome your contributions, whether
              it&apos;s through articles, opinion pieces, game recaps, player profiles, or any other
              creative content.
            </p>
            <p>
              By contributing to Redshirt Sports, you can showcase your expertise, share your love
              for the game, and make a meaningful impact on the college football community.
            </p>
            <p>
              To get started, please visit our <Link href="/contact">contact page</Link> and email
              us with your name, and a brief description of your interests or areas of expertise.
              Our team will review your submission and get in touch with you shortly.
            </p>
            <p>
              Join us today and become a valued contributor to Redshirt Sports. Together, let&apos;s
              celebrate the love and excitement of college football!
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
