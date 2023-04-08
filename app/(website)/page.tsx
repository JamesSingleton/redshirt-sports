import type { Metadata } from 'next'
import { SocialMediaFollow } from '@components/common'

export default function Page() {
  return (
    <>
      <section className="relative mx-auto max-w-7xl py-12 md:py-16 lg:px-8 lg:py-20">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2"></div>
          <div className="mx-auto mt-12 w-full max-w-xl space-y-8 px-4 sm:mt-16 sm:px-6 md:max-w-3xl md:px-8 lg:col-span-1 lg:mt-0 lg:max-w-none lg:px-0">
            <SocialMediaFollow />
          </div>
        </div>
      </section>
    </>
  )
}
