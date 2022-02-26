import { GetStaticProps } from 'next'
import { NextSeo } from 'next-seo'
import { Layout } from '@components/common'
import { getClient } from '@lib/sanity.server'
import { getPrivacyPolicyPage } from '@lib/sanityGroqQueries'
import { PortableText } from '@lib/sanity'

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
        title="Redshirt Sports Privacy Policy"
        description="Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period."
        canonical="https://www.redshirtsports.xyz/privacy"
        openGraph={{
          title: 'Redshirt Sports Privacy Policy - Redshirt Sports',
          description:
            "Redshirt Sports doesn't use cookies and doesn't collect personal data. Your data is your data, period.",
        }}
      />
      <div className="relative overflow-hidden py-16">
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-prose text-lg">
            <h1 className="mt-2 block text-center text-3xl font-extrabold leading-8 tracking-tight text-slate-900 sm:text-4xl">
              {privacyPolicy.title}
            </h1>
          </div>
          <PortableText
            value={privacyPolicy.body}
            className="prose prose-lg prose-indigo mx-auto mt-6 dark:prose-invert"
          />
        </div>
      </div>
    </>
  )
}

Privacy.Layout = Layout

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
