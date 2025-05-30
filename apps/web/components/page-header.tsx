import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { BreadcrumbProps } from '@/types'
import BreadCrumbs from './breadcrumbs'

type PageHeaderProps = {
  title: string
  subtitle?: string | React.ReactNode
  breadcrumbs?: BreadcrumbProps
}

export default function PageHeader({ title, subtitle, breadcrumbs }: PageHeaderProps) {
  return (
    <section className="py-12">
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          {breadcrumbs && <BreadCrumbs breadCrumbPages={breadcrumbs} />}
          <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          {subtitle && <>{subtitle}</>}
        </div>
      </div>
    </section>
  )
}
