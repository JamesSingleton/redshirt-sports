import Link from 'next/link'
import Image from 'next/image'
import { EnvelopeOpenIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { Instagram, Twitter, Facebook } from '@components/common/icons'
import { getAboutPageAuthors } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'
import { urlForImage } from '@lib/sanity.image'

export const metadata = {
  title: 'About Redshirt Sports: College Football Excellence & Passion',
  description:
    'Discover Redshirt Sports, a team passionate about college football. Join us for the latest news, insights, and analysis as we celebrate the spirit of the game and collegiate excellence.',
  openGraph: {
    title: 'About Redshirt Sports: College Football Excellence & Passion',
    description:
      'Discover Redshirt Sports, a team passionate about college football. Join us for the latest news, insights, and analysis as we celebrate the spirit of the game and collegiate excellence.',
    url: '/about',
    images: [
      {
        url: '/api/og?title=About Redshirt Sports: College Football Excellence & Passion',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title: 'About Redshirt Sports: College Football Excellence & Passion',
    description:
      'Discover Redshirt Sports, a team passionate about college football. Join us for the latest news, insights, and analysis as we celebrate the spirit of the game and collegiate excellence.',
  },
  alternates: {
    canonical: '/about',
  },
}

export default async function Page() {
  const token = getPreviewToken()
  const authors = await getAboutPageAuthors({ token })

  return (
    <>
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <h1 className="text-secondary-900 mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              Discover the Team Behind Redshirt Sports: Unveiling Our Passion for College Football
            </h1>
            <p className="text-secondary-600 mt-4 text-lg font-normal lg:text-xl">
              Meet the Dedicated Team Driving Redshirt Sports&apos; College Football Journey
            </p>
          </div>
        </div>
      </section>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="prose prose-xl mx-auto px-5 dark:prose-invert sm:px-6 lg:max-w-7xl lg:px-8">
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
      <section className="bg-zinc-100 py-12 dark:bg-zinc-800 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-7xl">
          <div className="mx-auto text-center md:max-w-3xl xl:max-w-5xl">
            <h2 className="font-cal text-base font-medium uppercase tracking-widest text-brand-500 dark:text-brand-300">
              Our Writers
            </h2>
            <p className="mt-2 text-3xl font-medium tracking-normal sm:text-4xl md:tracking-tight lg:text-5xl lg:leading-tight">
              Meet the Dedicated Team Driving Redshirt Sports&apos; College Football Journey
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-7xl sm:mt-16">
            <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
              {authors?.map((author) => (
                <li
                  key={author._id}
                  className="relative rounded-3xl border border-zinc-300/70 bg-white px-6 py-10 text-center transition duration-300 ease-in-out hover:border-zinc-300/30 hover:shadow-lg dark:bg-zinc-900 sm:px-10"
                >
                  <div>
                    <Image
                      src={urlForImage(author.image).width(176).height(176).url()}
                      alt={`${author.name}'s profile picture`}
                      width={176}
                      height={176}
                      className="mx-auto h-40 w-40 overflow-hidden rounded-full object-cover xl:h-44 xl:w-44"
                    />
                    <div className="mt-6 leading-6">
                      <h3 className="font-cal text-xl font-medium">
                        <Link href={`/authors/${author.slug}`}>
                          <span aria-hidden="true" className="absolute inset-0" />
                          {author.name}
                        </Link>
                      </h3>
                      <span className="mt-1 text-base text-brand-500 dark:text-brand-300">
                        {author.role}
                      </span>
                    </div>
                    <ul className="mt-6 flex items-center justify-center space-x-3">
                      {author.socialMedia?.map((social) => (
                        <li key={social._key}>
                          <a href={social.url} target="_blank" rel="noreferrer">
                            <span className="sr-only">{`${author.name}'s ${social.name}`}</span>
                            {social.name === 'Email' ? (
                              <EnvelopeOpenIcon className="h-5 w-5 text-zinc-400 transition duration-300 ease-in-out" />
                            ) : null}
                            {social.name === 'Twitter' ? (
                              <Twitter className="h-5 w-5 text-zinc-400 transition duration-300 ease-in-out" />
                            ) : null}
                            {social.name === 'Facebook' ? (
                              <Facebook className="h-5 w-5 text-zinc-400 transition duration-300 ease-in-out" />
                            ) : null}
                            {social.name === 'Instagram' ? (
                              <Instagram className="h-5 w-5 text-zinc-400 transition duration-300 ease-in-out" />
                            ) : null}
                            {social.name === 'Website' ? (
                              <GlobeAltIcon className="h-5 w-5 text-zinc-400 transition duration-300 ease-in-out" />
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
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center font-cal text-3xl font-extrabold sm:text-4xl">
            Join Our Community and Contribute
          </h2>
          <div className="prose prose-xl mx-auto mt-12 px-5 dark:prose-invert sm:px-6 lg:max-w-7xl lg:px-8">
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
