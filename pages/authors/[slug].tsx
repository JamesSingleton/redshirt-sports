import { GetStaticProps, GetStaticPaths } from 'next'
import { NextSeo, SocialProfileJsonLd, BreadcrumbJsonLd } from 'next-seo'

import { Layout } from '@components/common'
import { getClient, sanityClient } from '@lib/sanity.server'
import { authorSlugsQuery, authorAndTheirPostsBySlug } from '@lib/queries'
import { urlForImage, PortableText } from '@lib/sanity'
import { usePlausible } from 'next-plausible'
import { BlurImage, HorizontalCard } from '@components/ui'

import type { Author } from '@types'

interface AuthorProps {
  author: Author
}

const Author = ({ author }: AuthorProps) => {
  const plausible = usePlausible()
  const [firstName, lastName] = author.name.split(' ')
  return (
    <>
      <NextSeo
        title={`${author.role} ${author.name} Profile`}
        description={`Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`}
        canonical={`https://www.redshirtsports.xyz/authors/${author.slug}`}
        openGraph={{
          title: `${author.name} Profile - Redshirt Sports`,
          description: `Meet ${author.name}! Learn who they are and the articles that they have written here at Redshirt Sports!`,
          images: [
            {
              url: urlForImage(author.image).width(600).height(600).url()!,
              width: 600,
              height: 600,
              alt: author.name,
              type: 'image/jpeg',
            },
          ],
          type: 'profile',
          profile: {
            firstName,
            lastName,
          },
        }}
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
            name: 'Authors',
            item: 'https://www.redshirtsports.xyz/authors',
          },
          {
            position: 3,
            name: author.name,
            item: `https://www.redshirtsports.xyz/authors/${author.name}`,
          },
        ]}
      />
      <SocialProfileJsonLd
        type="Person"
        name={author.name}
        url={`https://www.redshirtsports.xyz/authors/${author.slug}`}
        sameAs={[author.twitterURL]}
      />
      <Layout>
        <section className="bg-slate-50 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="mx-auto max-w-xl px-6 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
            <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
              <div className="flex flex-col items-center md:flex-row">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <BlurImage
                    src={urlForImage(author.image).url()}
                    layout="responsive"
                    width={96}
                    height={96}
                    alt={author.name}
                    blurDataURL={author.image.asset.metadata.lqip}
                    className="overflow-hidden rounded-xl"
                    objectFit="cover"
                  />
                </div>
                <div className="mt-6 text-center md:mt-0 md:ml-5 md:text-left">
                  <span className="block text-xs uppercase tracking-widest text-brand-500">
                    {author.role}
                  </span>
                  <h1 className="mt-1 text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:leading-tight">
                    {author.name}
                  </h1>
                </div>
              </div>
              <div className="mt-6 md:mt-0">
                <ul className="flex items-center">
                  <li>
                    <a
                      href={author.twitterURL}
                      target="_blank"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-transparent transition duration-300 ease-in-out sm:h-12 sm:w-12"
                      rel="noreferrer noopener"
                    >
                      <span className="sr-only">{`${author.name}'s Twitter`}</span>
                      <svg
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-4 w-4 transform text-slate-700 transition ease-in-out"
                      >
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-xl py-12 px-4 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
          <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
            <div className="col-span-2">
              <h2 className="relative border-b border-slate-300 pb-3 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
                Recent Stories
              </h2>
              <div className="mt-6 pt-8 sm:mt-10 sm:pt-10">
                {author.posts!.map((post) => (
                  <HorizontalCard key={post._id} post={post} />
                ))}
              </div>
            </div>
            <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
              <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
                <h2 className="relative border-b border-slate-300 pb-3 text-2xl font-medium text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">{`About ${author.name}`}</h2>
                <div className="pt-6 text-base leading-loose text-slate-600">
                  <PortableText value={author.bio} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}

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
