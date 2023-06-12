import Link from 'next/link'
import { HomeIcon } from '@heroicons/react/24/solid'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
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
        <li>
          <div>
            <Link href="/" className="text-zinc-400 hover:text-zinc-500">
              <span className="sr-only">Home</span>
              <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </li>
        {breadCrumbPages.map((page: any, index: any) => (
          <li key={page.title}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <Link
                aria-current={index === breadCrumbPages.length - 1 ? 'page' : undefined}
                href={page.href}
                className={clsx(
                  'ml-2 text-sm font-medium ',
                  index === breadCrumbPages.length - 1
                    ? 'w-48 truncate text-brand-400 sm:w-64'
                    : 'text-zinc-500 hover:text-zinc-700'
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
