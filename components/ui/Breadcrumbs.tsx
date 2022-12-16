'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ChevronRightIcon from '@heroicons/react/24/solid/ChevronRightIcon'
import HomeIcon from '@heroicons/react/24/solid/HomeIcon'

interface BreadCrumbsProps {
  breadCrumbPages: {
    name: string
    href: string
  }[]
}

const Breadcrumbs = ({ breadCrumbPages }: BreadCrumbsProps) => {
  const pathname = usePathname()

  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex items-center text-sm">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/" prefetch={false} className="text-slate-400 hover:text-slate-500">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {breadCrumbPages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <Link
                href={page.href}
                prefetch={false}
                className="ml-4 text-sm font-medium text-slate-500 hover:text-slate-700"
                aria-current={page.href === pathname ? 'page' : undefined}
              >
                {page.name}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
