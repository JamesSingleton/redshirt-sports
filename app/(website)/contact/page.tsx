import { PageHeader } from '@components/common'

import { Org, Web } from '@lib/ldJson'
import { baseUrl } from '@lib/constants'

import type { Metadata } from 'next'
import type { Graph } from 'schema-dts'
import { defineMetadata } from '@lib/utils.metadata'

export const metadata: Metadata = defineMetadata({
  title: 'Contact Us',
  baseTitle: 'Redshirt Sports',
  description:
    'Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz.',
  canonical: '/contact',
  url: '/contact',
})

const contactDetails = [
  { name: 'Collaborate', email: 'editors@redshirtsports.xyz' },
  { name: 'Advertising', email: 'advertising@redshirtsports.xyz' },
  { name: 'General', email: 'contact@redshirtsports.xyz' },
]

const breadcrumbs = [
  {
    title: 'Contact',
    href: '/contact',
  },
]

const jsonLd: Graph = {
  '@context': 'https://schema.org',
  '@graph': [
    Org,
    Web,
    {
      '@type': 'ContactPage',
      '@id': `${baseUrl}/contact`,
      url: `${baseUrl}/contact`,
      description: 'Contact us for collaboration, advertising, or general inquiries.',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/contact`,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        '@id': `${baseUrl}/contact#breadcrumb`,
      },
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${baseUrl}#website`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${baseUrl}/contact#breadcrumb`,
      name: 'Contact Breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: `${baseUrl}/contact`,
        },
      ],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Contact Us"
        subtitle={
          <p className="mt-4 text-lg font-normal lg:text-xl">
            Interested in collaborating or advertising with us? We&apos;re all ears! Fill out the
            contact form or use the provided contact details below to get in touch. Let&apos;s
            explore exciting possibilities together!
          </p>
        }
      />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="md:max-w-3xl xl:max-w-5xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {contactDetails.map(({ name, email }) => (
              <div key={name} className="overflow-hidden rounded-lg bg-secondary shadow">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-secondary-900 text-lg font-medium leading-6">{name}</h3>
                  <div className="text-secondary-600 mt-2 max-w-xl text-sm">
                    <p>
                      <a href={`mailto:${email}`}>{email}</a>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
