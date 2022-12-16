import { SocialMediaFollow } from '@components/common'
import { PageHeader, Date } from '@components/ui'
import { getPrivacyPolicy } from '@lib/sanity.client'
import { PortableTextComponent } from '@lib/sanity.text'

export default async function PrivacyPage() {
  const privacyPolicy = await getPrivacyPolicy()
  return (
    <>
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
              <PortableTextComponent value={privacyPolicy.body} />
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
