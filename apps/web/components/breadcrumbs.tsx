import Link from 'next/link'
import { ChevronRight, HomeIcon } from 'lucide-react'
import { cn } from '@redshirt-sports/ui/lib/utils'

import type { BreadcrumbProps } from '@/types'

type BreadCrumbPages = {
  breadCrumbPages: BreadcrumbProps
}

const BreadCrumbs = ({ breadCrumbPages }: BreadCrumbPages) => {
  const filteredBreadcrumbPages = breadCrumbPages.filter((page) => page !== null)
  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex">
      <ol className="flex shrink-0 flex-wrap items-center gap-1.5">
        <li title="Home">
          <Link href="/" prefetch={false} className="text-muted-foreground transition-colors hover:text-foreground">
            <span className="sr-only">Home</span>
            <HomeIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </li>
        {filteredBreadcrumbPages.map((page, index: number) => (
          <li key={page.title} title={page.title}>
            <div className="flex items-center">
              <ChevronRight
                className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <Link
                aria-current={index === filteredBreadcrumbPages.length - 1 ? 'page' : undefined}
                href={page.href}
                prefetch={false}
                className={cn(
                  'ml-1.5 text-sm font-medium',
                  index === filteredBreadcrumbPages.length - 1
                    ? 'w-32 truncate text-primary sm:w-64 lg:w-full'
                    : 'text-muted-foreground transition-colors hover:text-foreground',
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
