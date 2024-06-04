import Link from 'next/link'
import { ChevronRight, HomeIcon } from 'lucide-react'
import clsx from 'clsx'

import type { BreadcrumbProps } from '@/types'

type BreadCrumbPages = {
  breadCrumbPages: BreadcrumbProps
}

const BreadCrumbs = ({ breadCrumbPages }: BreadCrumbPages) => {
  const filteredBreadcrumbPages = breadCrumbPages.filter((page) => page !== null)
  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex">
      <ol className="flex shrink-0 flex-wrap items-center gap-2">
        <li title="Home">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <span className="sr-only">Home</span>
            <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          </Link>
        </li>
        {filteredBreadcrumbPages.map((page, index: number) => (
          <li key={page.title} title={page.title}>
            <div className="flex items-center">
              <ChevronRight
                className="h-5 w-5 flex-shrink-0"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <Link
                aria-current={index === filteredBreadcrumbPages.length - 1 ? 'page' : undefined}
                href={page.href}
                className={clsx(
                  'ml-2 text-base font-semibold',
                  index === filteredBreadcrumbPages.length - 1
                    ? 'w-32 truncate text-brand-500 dark:text-brand-400 sm:w-64 lg:w-full'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {page.title}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default BreadCrumbs
