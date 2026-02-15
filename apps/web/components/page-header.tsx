import React from 'react'
import { BreadcrumbProps } from '@/types'
import BreadCrumbs from './breadcrumbs'

type PageHeaderProps = {
  title: string
  subtitle?: string | React.ReactNode
  breadcrumbs?: BreadcrumbProps
}

export default function PageHeader({ title, subtitle, breadcrumbs }: PageHeaderProps) {
  return (
    <section className="border-b border-border bg-muted/50 py-8">
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          {breadcrumbs && <BreadCrumbs breadCrumbPages={breadcrumbs} />}
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {subtitle && <div className="mt-3 text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
    </section>
  )
}
