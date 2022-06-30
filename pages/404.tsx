import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import { Layout } from '@components/common'

const Custom404 = () => {
  const plausible = usePlausible()
  return (
    <section className="bg-slate-50">
      <div className="mx-auto min-h-screen max-w-2xl py-12 px-4 sm:px-6 sm:pt-16 lg:flex lg:max-w-screen-2xl lg:items-center lg:px-12 xl:py-20">
        <div className="flex flex-col justify-center lg:w-1/2 2xl:w-2/5">
          <div className="max-w-lg"></div>
        </div>
        <div className="mt-12 sm:mt-16 lg:ml-12 lg:mt-0 lg:w-1/2 2xl:ml-16 2xl:w-3/5"></div>
      </div>
    </section>
  )
}

Custom404.Layout = Layout

export default Custom404
