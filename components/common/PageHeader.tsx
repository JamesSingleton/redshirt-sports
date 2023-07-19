import { Breadcrumbs } from '@components/ui'

import type { BreadcrumbProps } from '@types'

type PageHeaderProps = {
  breadcrumbs: BreadcrumbProps
  title: string
  subtitle?: string | JSX.Element | JSX.Element[] | null
}

export default function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  return (
    <section className="pt-12 sm:pt-16 lg:pt-20 xl:pt-24">
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          <Breadcrumbs breadCrumbPages={breadcrumbs} />
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-secondary-600 mt-4 text-lg font-normal lg:text-xl">{subtitle}</p>
          )}
        </div>
      </div>
    </section>
  )
}
