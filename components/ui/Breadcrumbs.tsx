'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ChevronRightIcon from '@heroicons/react/24/solid/ChevronRightIcon'
import HomeIcon from '@heroicons/react/24/solid/HomeIcon'

interface Props {
  breadCrumbPages: {
    name: string
    href: string
  }[]
}

const Breadcrumbs = ({ breadCrumbPages }: Props) => {
  const pathname = usePathname()

  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex items-center text-sm">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/" className="text-zinc-400 hover:text-zinc-500">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {breadCrumbPages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-zinc-400"
                aria-hidden="true"
              />
              <Link
                href={page.href}
                className="ml-4 text-sm font-medium text-zinc-500 hover:text-zinc-700"
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
