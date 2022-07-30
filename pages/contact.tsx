import Head from 'next/head'
import { NextSeo } from 'next-seo'

import { Layout, SocialMediaFollow } from '@components/common'
import { PageHeader } from '@components/ui'
import { Organization, WebSite } from '@lib/ldJson'

const contactDetails = [
  { name: 'Collaborate', email: 'editors@redshirtsports.xyz' },
  { name: 'Advertising', email: 'advertising@redshirtsports.xyz' },
]

const ContactUs = () => {
  const ldJsonContent = {
    '@context': 'http://schema.org',
    '@graph': [
      Organization,
      WebSite,
      {
        '@type': 'ContactPage',
        '@id': 'https://www.redshirtsports.xyz/contact/#contactpage',
        url: 'https://www.redshirtsports.xyz/contact',
        name: 'Contact Us - Redshirt Sports',
        isPartOf: {
          '@id': 'https://www.redshirtsports.xyz/#website',
        },
        breadcrumb: { '@id': 'https://www.redshirtsports.xyz/contact/#breadcrumb' },
        inLanguage: 'en-US',
        potentialAction: [
          {
            '@type': 'ReadAction',
            target: ['https://www.redshirtsports.xyz/contact'],
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://www.redshirtsports.xyz/contact/#breadcrumb',
        name: 'Contact Us Breadcrumbs',
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
              name: 'Contact Us',
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
          id="contact-ld-json"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJsonContent),
          }}
        />
      </Head>
      <NextSeo
        title="Contact Us"
        canonical="https://www.redshirtsports.xyz/contact"
        description="Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz."
        openGraph={{
          url: 'https://www.redshirtsports.xyz/contact',
          title: 'Contact Us - Redshirt Sports',
          description:
            'Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz.',
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <Layout>
        <PageHeader
          heading="Contact Redshirt Sports"
          subheading="Want to get in touch? We'd love to hear from you. Here is how you can reach us."
        />
        <section className="relative mx-auto max-w-screen-xl py-12 md:py-16 lg:px-8 lg:py-24">
          <div className="w-full lg:flex lg:items-start">
            <div className="lg:w-2/3">
              <div className="mx-auto max-w-xl px-5 sm:px-8 md:max-w-2xl lg:max-w-none lg:px-0 lg:pr-24 xl:pr-48">
                <h2 className="relative border-b border-b-slate-300/70 pb-2 font-cal text-2xl font-medium text-slate-900  before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
                  Get in touch
                </h2>
                <div className="mt-8 grid grid-cols-1 gap-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:col-span-2">
                  {contactDetails.map((item) => (
                    <div key={item.name}>
                      <h3 className="font-cal text-lg font-medium text-slate-900">{item.name}</h3>
                      <dl className="mt-2 text-base text-slate-500">
                        <div>
                          <dt className="sr-only">Email</dt>
                          <dd className="prose hover:prose-a:text-brand-500">
                            <a href={`mailto:${item.email}`}>{item.email}</a>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
                <p className="prose mt-10 text-lg text-slate-500 hover:prose-a:text-brand-500 sm:mt-12">
                  If your reason for contacting us does not fall in any of the categories above,
                  please email us at{' '}
                  <a href="mailto:contact@redshirtsports.xyz">contact@redshirtsports.xyz</a>
                </p>
              </div>
            </div>
            <div className="mx-auto mt-12 w-full max-w-xl px-4 sm:mt-16 sm:px-6 md:max-w-2xl md:px-8 lg:sticky lg:top-8 lg:mt-0 lg:w-1/3 lg:max-w-none lg:px-0">
              <SocialMediaFollow />
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}

export default ContactUs
