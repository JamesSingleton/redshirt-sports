import Link from 'next/link'

import { PageHeader } from '@/components/common'
import { Org, Web } from '@/lib/ldJson'
import { HOME_DOMAIN } from '@/lib/constants'
import { constructMetadata } from '@/utils/construct-metadata'
import { Card, CardTitle, CardDescription, CardContent, CardHeader } from '@/components/ui/card'

import type { Metadata, ResolvingMetadata } from 'next'
import type { Graph } from 'schema-dts'

export async function generateMetadata({}, parent: ResolvingMetadata): Promise<Metadata> {
  const defaultMetadata = constructMetadata({
    title: 'Contact Redshirt Sports - Get in Touch with Our Team',
    description:
      "Contact Redshirt Sports for collaboration, advertising, or general inquiries. We're here to assist with any questions about our football coverage.",
    canonical: '/contact',
  })

  const previousImages = (await parent).openGraph?.images || []
  return {
    ...defaultMetadata,
    openGraph: {
      ...defaultMetadata.openGraph,
      images: [...previousImages],
      url: '/contact',
    },
    twitter: {
      ...defaultMetadata.twitter,
      card: 'summary_large_image',
      images: [...previousImages],
    },
  }
}

const contactDetails = [
  {
    title: 'Collaborate',
    description: 'For partnership and collaboration inquiries',
    email: 'editors@redshirtsports.xyz',
  },
  {
    title: 'Advertising',
    description: 'For advertising and sponsorship opportunities',
    email: 'advertising@redshirtsports.xyz',
  },
  {
    title: 'General Inquiries',
    description: 'For all other questions and information',
    email: 'contact@redshirtsports.xyz',
  },
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
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contactDetails.map(({ title, description, email }) => (
            <Card key={title} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-grow items-end">
                <Link
                  href={`mailto:${email}`}
                  className="break-all text-sm text-primary hover:underline sm:text-base"
                >
                  {email}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </>
  )
}
