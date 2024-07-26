import { PageHeader } from '@/components/common'

import { Org, Web } from '@/lib/ldJson'
import { HOME_DOMAIN } from '@/lib/constants'
import { defineMetadata } from '@/lib/utils.metadata'

import type { Metadata, ResolvingMetadata } from 'next'
import type { Graph } from 'schema-dts'

const defaultMetadata = defineMetadata({
  title: 'Contact Us',
  description:
    'Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz.',
})

export async function generateMetadata({}, parent: ResolvingMetadata): Promise<Metadata> {
  const previousImages = (await parent).openGraph?.images || []
  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [...previousImages],
      url: '/contact',
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: '/contact',
    },
  }
}

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
      '@id': `${HOME_DOMAIN}/contact`,
      url: `${HOME_DOMAIN}/contact`,
      description: 'Contact us for collaboration, advertising, or general inquiries.',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${HOME_DOMAIN}/contact`,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        '@id': `${HOME_DOMAIN}/contact#breadcrumb`,
      },
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${HOME_DOMAIN}#website`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${HOME_DOMAIN}/contact#breadcrumb`,
      name: 'Contact Breadcrumbs',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: HOME_DOMAIN,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Contact',
          item: `${HOME_DOMAIN}/contact`,
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
            Interested in collaborating or advertising with us? We&apos;re all ears! Let&apos;s
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
