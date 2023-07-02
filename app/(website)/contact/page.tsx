import { Breadcrumbs } from '@components/ui'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz.',
  openGraph: {
    title: 'Contact Us',
    description:
      'Want to collaborate on a story or advertise with Redshirt Sports? Contact us via editors@redshirtsports.xyz or advertising@redshirtsports.xyz.',
    url: '/contact',
    images: [
      {
        url: '/api/og?title=Contact Us',
        width: 1200,
        height: 630,
      },
    ],
  },
  alternates: {
    canonical: '/contact',
  },
}

const contactDetails = [
  { name: 'Collaborate', email: 'editors@redshirtsports.xyz' },
  { name: 'Advertising', email: 'advertising@redshirtsports.xyz' },
  { name: 'General', email: 'contact@redshirtsports.xyz' },
]

const breadcrumbs = [
  {
    title: 'Contact',
    href: '/contact',
  },
]

const socialMedia = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/_redshirtsports',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/RedshirtSportsNews',
  },
]

export default function Page() {
  return (
    <>
      <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <Breadcrumbs breadCrumbPages={breadcrumbs} />
            <h1 className="text-secondary-900 mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              Contact Us
            </h1>
            <p className="text-secondary-600 mt-4 text-lg font-normal lg:text-xl">
              Interested in collaborating or advertising with us? We&apos;re all ears! Fill out the
              contact form or use the provided contact details below to get in touch. Let&apos;s
              explore exciting possibilities together!
            </p>
          </div>
        </div>
      </section>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="md:max-w-3xl xl:max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {contactDetails.map(({ name, email }) => (
                <div key={name} className="overflow-hidden rounded-lg bg-secondary shadow">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-secondary-900 text-lg font-medium leading-6">{name}</h3>
                    <div className="text-secondary-600 mt-2 max-w-xl text-sm">
                      <p>
                        <a href={`mailto:${email}`}>{email}</a>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
