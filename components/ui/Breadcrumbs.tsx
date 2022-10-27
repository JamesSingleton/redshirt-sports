import Link from 'next/link'
import { useRouter } from 'next/router'
import { usePlausible } from 'next-plausible'
import ChevronRightIcon from '@heroicons/react/24/solid/ChevronRightIcon'
import HomeIcon from '@heroicons/react/24/solid/HomeIcon'

interface BreadCrumbsProps {
  breadCrumbPages: {
    name: string
    href: string
  }[]
}

const Breadcrumbs = ({ breadCrumbPages }: BreadCrumbsProps) => {
  const plausible = usePlausible()
  const { asPath } = useRouter()
  return (
    <nav aria-label="breadcrumb" title="breadcrumb" className="flex items-center text-sm">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/" prefetch={false}>
              <a
                onClick={() =>
                  plausible('clickOnBreadCrumb', {
                    props: {
                      location: 'Home',
                    },
                  })
                }
                className="text-slate-400 hover:text-slate-500"
              >
                <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">Home</span>
              </a>
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
              <Link href={page.href} prefetch={false}>
                <a
                  onClick={() =>
                    plausible('clickOnBreadCrumb', {
                      props: {
                        location: page.name.toUpperCase(),
                      },
                    })
                  }
                  className="ml-4 text-sm font-medium text-slate-500 hover:text-slate-700"
                  aria-current={page.href === asPath ? 'page' : undefined}
                >
                  {page.name}
                </a>
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
