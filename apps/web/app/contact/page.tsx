import Link from 'next/link'
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardHeader,
} from '@workspace/ui/components/card'

import PageHeader from '@/components/page-header'
import { getSEOMetadata } from '@/lib/seo'
import { JsonLdScript, websiteId } from '@/components/json-ld'
import { getBaseUrl } from '@/lib/get-base-url'

import type { Metadata } from 'next'
import type { WithContext, ContactPage } from 'schema-dts'

export async function generateMetadata(): Promise<Metadata> {
  return getSEOMetadata({
    title: 'Contact Us',
    description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME} for collaboration, advertising, or general inquiries. We're here to assist with any questions about our college sports coverage.`,
    slug: '/contact',
  })
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

const baseUrl = getBaseUrl()

const contactPageJsonLd: WithContext<ContactPage> = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': `${baseUrl}/contact`,
  name: 'Contact Us',
  description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME} for collaboration, advertising, or general inquiries. We're here to assist with any questions about our college sports coverage.`,
  url: `${baseUrl}/contact`,
  isPartOf: {
    '@type': 'WebSite',
    '@id': websiteId,
  },
  inLanguage: 'en-us',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}/contact#breadcrumb`,
    name: 'Contact Breadcrumbs',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contact Us',
        item: `${baseUrl}/contact`,
      },
    ],
  },
}

export default function Page() {
  return (
    <>
      <JsonLdScript data={contactPageJsonLd} id="contact-page-json-ld" />
      <PageHeader
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
                  className="text-primary text-sm break-all hover:underline sm:text-base"
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
