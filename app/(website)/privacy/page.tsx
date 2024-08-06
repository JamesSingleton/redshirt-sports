import { PageHeader, Date, CustomPortableText } from '@/components/common'
import { getPrivacyPolicy } from '@/lib/sanity.fetch'
import { HOME_DOMAIN } from '@/lib/constants'
import { Org, Web } from '@/lib/ldJson'
import { constructMetadata } from '@/utils/construct-metadata'

import type { Graph } from 'schema-dts'
import type { Metadata } from 'next'

export const metadata: Metadata = constructMetadata({
  title: `Privacy Policy | ${process.env.NEXT_PUBLIC_APP_NAME}`,
  description: `Review ${process.env.NEXT_PUBLIC_APP_NAME}' Privacy Policy to see how we handle your data, ensure security, and maintain your privacy.`,
  canonical: '/privacy',
})

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
      '@id': `${HOME_DOMAIN}/privacy`,
      url: `${HOME_DOMAIN}/privacy`,
      name: 'Privacy Policy',
      description:
        "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
      inLanguage: 'en-US',
      isPartOf: {
        '@id': `${HOME_DOMAIN}#website`,
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
          item: HOME_DOMAIN,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Privacy Policy',
          item: `${HOME_DOMAIN}/privacy`,
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
