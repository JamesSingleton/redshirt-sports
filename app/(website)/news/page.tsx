import { Breadcrumbs } from '@components/ui'

const breadcrumbs = [
  {
    title: 'News',
    href: '/news',
  },
]

export default function Page() {
  return (
    <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:max-w-3xl xl:max-w-5xl">
          <Breadcrumbs breadCrumbPages={breadcrumbs} />

          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            Latest College Football News
          </h1>
        </div>
      </div>
    </section>
  )
}
