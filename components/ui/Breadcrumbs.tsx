import Link from 'next/link'
import { ChevronRight, HomeIcon } from 'lucide-react'
import clsx from 'clsx'

type BreadCrumbPages = {
  breadCrumbPages: {
    title: string
    href: string
  }[]
}

const BreadCrumbs = ({ breadCrumbPages }: BreadCrumbPages) => {
  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex">
      <ol className="flex flex-wrap items-center gap-2">
        <li title="Home">
          <div>
            <Link href="/" className="text-zinc-400 hover:text-zinc-500">
              <span className="sr-only">Home</span>
              <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </li>
        {breadCrumbPages.map((page: any, index: any) => (
          <li key={page.title} title={page.title}>
            <div className="flex items-center">
              <ChevronRight
                className="h-5 w-5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
                strokeWidth={1.5}
              />
              <Link
                aria-current={index === breadCrumbPages.length - 1 ? 'page' : undefined}
                href={page.href}
                className={clsx(
                  'ml-2 text-base font-medium',
                  index === breadCrumbPages.length - 1
                    ? 'w-48 truncate text-brand-400 sm:w-64'
                    : 'text-zinc-400 hover:text-zinc-500'
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
