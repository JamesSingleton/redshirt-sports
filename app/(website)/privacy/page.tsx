import PageHeader from '@components/ui/PageHeader'
import Date from '@components/ui/Date'
import SocialMediaFollow from '@components/common/SocialMediaFollow'
import { CustomPortableText } from '@components/ui/CustomPortableText'
import { getPrivacyPolicyPage } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'

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

export default async function Page() {
  const token = getPreviewToken()
  const privacyPolicy = await getPrivacyPolicyPage({ token })

  return (
    <>
      <PageHeader
        heading="Privacy Policy"
        subheading={
          <>
            Last updated on <Date dateString={privacyPolicy?._updatedAt!} />
          </>
        }
      />
      <section className="mx-auto max-w-7xl py-12 md:py-16 lg:px-8 lg:py-20">
        <div className="w-full lg:flex">
          <div className="lg:w-2/3">
            <div className="prose prose-lg prose-indigo mx-auto px-5 sm:px-6 md:px-8 lg:mx-0 lg:px-0">
              <CustomPortableText value={privacyPolicy?.body!} />
            </div>
          </div>
          <div className="mx-auto mt-12 w-full max-w-xl space-x-8 space-x-reverse px-4 sm:mt-16 sm:px-6 md:max-w-2xl md:px-8 lg:mt-0 lg:w-1/3 lg:max-w-none lg:px-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
