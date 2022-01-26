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
      <div className="relative py-16 overflow-hidden">
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="text-lg max-w-prose mx-auto">
            <h1 className="mt-2 block text-3xl text-center leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              {privacyPolicy.title}
            </h1>
          </div>
          <div className="mt-6 prose prose-indigo prose-lg dark:prose-invert mx-auto">
            <PortableText blocks={privacyPolicy.body} />
          </div>
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
