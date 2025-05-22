import PageHeader from '@/components/page-header'
import Date from '@/components/date'
import { RichText } from '@/components/rich-text'
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
      description: `Review ${process.env.NEXT_PUBLIC_APP_NAME}' Privacy Policy to see how we handle your data, ensure security, and maintain your privacy.`,
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
        title="Privacy Policy"
        subtitle={
          <p className="mt-4 text-lg font-normal lg:text-xl">
            Last updated on <Date dateString={privacyPolicy._updatedAt} />
          </p>
        }
      />
      <section className="container pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
        <RichText richText={privacyPolicy.body} />
      </section>
    </>
  )
}
