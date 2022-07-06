import { MailIcon, PhoneIcon } from '@heroicons/react/outline'

import { Layout } from '@components/common'

const ContactUs = () => {
  return (
    <Layout>
      <section className="bg-slate-50 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-5 sm:px-8 md:max-w-2xl lg:max-w-7xl">
          <div className="max-w-xl">
            <h1 className="text-4xl font-medium tracking-normal text-slate-900 md:tracking-tight lg:text-5xl lg:leading-tight">
              Contact Redshirt Sports
            </h1>
            <p className="my-3 text-lg text-slate-500">
              Lorem ipsum dolor sit amet adipiscing pulvinar nibh enim. Iaculis justo non nibh in
              lacus non nibh pellentesque libero aenean tincidunt dolore. Ornare etiam praesent
              mattis purus vitae dapibus at.
            </p>
          </div>
        </div>
      </section>
      <section className="relative mx-auto max-w-screen-xl py-12 md:py-16 lg:px-8 lg:py-24">
        <div className="w-full lg:flex lg:items-start">
          <div className="lg:w-2/3"></div>
          <div></div>
        </div>
      </section>
    </Layout>
  )
}

export default ContactUs
