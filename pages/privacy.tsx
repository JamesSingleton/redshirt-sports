import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'

import { Layout, SocialMediaFollow } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { getPrivacyPolicyPage } from '@lib/queries'
import { PortableText } from '@lib/sanity'
import { Date, PageHeader } from '@components/ui'

interface privacyPolicyProps {
  privacyPolicy: {
    _id: string
    _updatedAt: string
    title: string
    slug: string
    body: string
  }
}

const Privacy = ({ privacyPolicy }: privacyPolicyProps) => {
  return (
    <>
      <NextSeo
        title="Privacy"
        description="Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period."
        canonical="https://www.redshirtsports.xyz/privacy"
        openGraph={{
          title: 'Privacy - Redshirt Sports',
          description:
            "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
        }}
        robotsProps={{
          maxSnippet: -1,
          maxImagePreview: 'large',
          maxVideoPreview: -1,
        }}
      />
      <Layout>
        <PageHeader
          heading="Privacy Policy"
          subheading={
            <>
              Last updated on <Date dateString={privacyPolicy._updatedAt} />
            </>
          }
        />
        <section className="mx-auto max-w-7xl py-12 md:py-16 lg:py-20 lg:px-8">
          <div className="w-full lg:flex">
            <div className="lg:w-2/3">
              <div className="prose prose-lg prose-indigo mx-auto px-5 sm:px-6 md:px-8 lg:mx-0 lg:px-0">
                <PortableText value={privacyPolicy.body} />
              </div>
            </div>
            <div className="mx-auto mt-12 w-full max-w-xl space-x-8 space-x-reverse px-4 sm:mt-16 sm:px-6 md:max-w-2xl md:px-8 lg:mt-0 lg:w-1/3 lg:max-w-none lg:px-0">
              <SocialMediaFollow />
            </div>
          </div>
        </section>
      </Layout>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const privacyPolicy = await getClient().fetch(getPrivacyPolicyPage)

  if (!privacyPolicy) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      privacyPolicy,
    },
  }
}

export default Privacy
