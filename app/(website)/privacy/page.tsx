import { Date, CustomPortableText } from '@components/ui'
import { PageHeader } from '@components/common'
import { getPrivacyPolicy } from '@lib/sanity.fetch'
import { baseUrl } from '@lib/constants'
import { Org, Web } from '@lib/ldJson'

import type { Graph } from 'schema-dts'

export const metadata = {
  title: 'Privacy Policy',
  description:
    "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
  openGraph: {
    title: 'Privacy Policy',
    description:
      "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
    url: '/privacy',
    images: [
      {
        url: '/api/og?title=Privacy Policy',
        width: '1200',
        height: '630',
      },
    ],
  },
  alternates: {
    canonical: '/privacy',
  },
}

const breadcrumbs = [
  {
    title: 'Privacy Policy',
    href: '/privacy',
  },
]

const jsonLd: Graph = {
  '@context': 'https://schema.org',
  '@graph': [
    Org,
    Web,
    {
      '@type': 'WebPage',
      '@id': `${baseUrl}/privacy`,
      url: `${baseUrl}/privacy`,
      name: 'Privacy Policy',
      description:
        "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${baseUrl}#website`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      name: 'Privacy Policy Breadcrumbs',
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
          name: 'Privacy Policy',
          item: `${baseUrl}/privacy`,
        },
      ],
    },
  ],
}

export default async function PrivacyPolicyPage() {
  const privacyPolicy = await getPrivacyPolicy()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Privacy Policy"
        subtitle={
          <p className="mt-4 text-lg font-normal lg:text-xl">
            Last updated on <Date dateString={privacyPolicy?._updatedAt!} />
          </p>
        }
      />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <div className="prose prose-lg prose-indigo mx-auto max-w-none px-5 dark:prose-invert sm:px-6 md:px-8 lg:mx-0 lg:px-0">
          <CustomPortableText value={privacyPolicy?.body!} />
        </div>
      </section>
    </>
  )
}
