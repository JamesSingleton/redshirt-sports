import Link from 'next/link'
import { usePlausible } from 'next-plausible'
import { Layout } from '@components/common'

const Custom404 = () => {
  const plausible = usePlausible()
  return (
    <div className="min-h-screen bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <div className="sm:flex">
          <p className="text-4xl font-extrabold text-indigo-600 sm:text-5xl">
            404
          </p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Page not found
              </h1>
              <p className="mt-1 text-base text-slate-500">
                Please check the URL in the address bar and try again.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link href="/" prefetch={false}>
                <a
                  onClick={() => plausible('clickOn404BackHome')}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-slate-50 shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Go back home
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Custom404.Layout = Layout

export default Custom404
