import React from 'react'
import Breadcrumbs from '@/components/breadcrumbs'

import type { BreadcrumbProps } from '@/types'

type PageHeaderProps = {
  breadcrumbs: BreadcrumbProps
  title: string
  subtitle?: string | React.ReactNode
}

export default function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24">
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          <Breadcrumbs breadCrumbPages={breadcrumbs} />
          <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          {subtitle && <>{subtitle}</>}
        </div>
      </div>
    </section>
  )
}
