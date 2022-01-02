import { GetStaticProps } from 'next'
import Image from 'next/image'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { getAdvertisingPage } from '@lib/sanityGroqQueries'
import { PortableText } from '@lib/sanity'

interface AdvertisingProps {
  advertising: {
    _id: string
    _updatedAt: string
    title: string
    slug: string
    body: string
  }
}

const stats = [
  { label: 'Founded', value: '2021' },
  { label: 'Contributors', value: '3' },
  { label: 'Unique visitors', value: '700+/month' },
  { label: 'Social Media Impressions', value: '40k/month' },
]

const Advertising = ({ advertising }: AdvertisingProps) => {
  return (
    <>
      <NextSeo
        title="Advertising"
        description="If you'd like to discuss advertising on redshirtsports.xyz, please reach out at editors@redshirtsports.xyz."
        canonical="https://www.redshirtsports.xyz/advertising"
        openGraph={{
          title: 'Advertising - Redshirt Sports',
          description:
            "If you'd like to discuss advertising on redshirtsports.xyz, please reach out at editors@redshirtsports.xyz.",
        }}
      />
      <div className="relative bg-white flex h-screen items-center justify-center">
        <div className="lg:mx-auto lg:max-w-7xl lg:px-8 lg:grid lg:grid-cols-2 lg:gap-24 lg:items-start">
          <div className="relative sm:py-16 lg:py-0">
            <div
              aria-hidden="true"
              className="hidden sm:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-screen"
            >
              <div className="absolute inset-y-0 right-1/2 w-full bg-[#DC2727] rounded-r-3xl lg:right-72" />
              <svg
                className="absolute top-8 left-1/2 -ml-3 lg:-right-8 lg:left-auto lg:top-12"
                width={404}
                height={392}
                fill="none"
                viewBox="0 0 404 392"
              >
                <defs>
                  <pattern
                    id="02f20b47-fd69-4224-a62a-4c9de5c763f7"
                    x={0}
                    y={0}
                    width={20}
                    height={20}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={4}
                      className="text-gray-200"
                      fill="currentColor"
                    />
                  </pattern>
                </defs>
                <rect
                  width={404}
                  height={392}
                  fill="url(#02f20b47-fd69-4224-a62a-4c9de5c763f7)"
                />
              </svg>
            </div>
            <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0 lg:max-w-none lg:py-20">
              {/* Testimonial card*/}
              <div className="relative pt-64 pb-10 rounded-2xl shadow-xl overflow-hidden">
                <Image
                  className="absolute inset-0 h-full w-full object-cover"
                  src="https://images.unsplash.com/photo-1513757378314-e46255f6ed16?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80"
                  alt="Blank billboard"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            </div>
          </div>

          <div className="relative mx-auto max-w-md px-4 sm:max-w-3xl sm:px-6 lg:px-0">
            {/* Content area */}
            <div className="pt-12 sm:pt-16 lg:pt-20">
              <h1 className="text-3xl text-gray-900 font-extrabold tracking-tight sm:text-4xl">
                {advertising.title}
              </h1>
              <div className="mt-6 prose">
                <PortableText blocks={advertising.body} />
              </div>
            </div>

            {/* Stats section */}
            <div className="mt-10">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-8">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border-t-2 border-gray-100 pt-6"
                  >
                    <dt className="text-base font-medium text-gray-500">
                      {stat.label}
                    </dt>
                    <dd className="text-3xl font-extrabold tracking-tight text-gray-900">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Advertising.Layout = Layout

export const getStaticProps: GetStaticProps = async () => {
  const advertising = await getClient().fetch(getAdvertisingPage)

  if (!advertising) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      advertising,
    },
  }
}

export default Advertising
