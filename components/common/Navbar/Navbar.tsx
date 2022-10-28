import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Popover } from '@headlessui/react'
import Bars3Icon from '@heroicons/react/24/outline/Bars3Icon'
import clsx from 'clsx'
import { usePlausible } from 'next-plausible'

import SearchBar from './SearchBar'
import Logo from '../SmallLogo'
import { NAVIGATION_ITEMS } from '@lib/constants'

const MobileNav = dynamic(() => import('./MobileNav'))

const Navbar = () => {
  const router = useRouter()
  const plausible = usePlausible()

  return (
    <Popover as="header" className="shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-screen-2xl px-2 sm:px-4 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex px-2 lg:px-0">
                <div className="flex flex-shrink-0 items-center">
                  <Link
                    href="/"
                    prefetch={false}
                    onClick={() =>
                      plausible('clickOnNavbar', {
                        props: {
                          item: 'Home',
                        },
                      })
                    }
                    aria-label="Redshirt Sports Small Logo, click to go to the homepage"
                  >
                    <Logo className="h-8 w-auto" />
                  </Link>
                </div>
                <nav
                  className="hidden lg:ml-6 lg:flex lg:space-x-8"
                  title="Main Navigation"
                  aria-label="Main Navigation"
                >
                  {NAVIGATION_ITEMS.map(({ name, href }) => (
                    <Link
                      href={href}
                      key={name}
                      prefetch={false}
                      onClick={() =>
                        plausible('clickOnNavbar', {
                          props: {
                            item: name,
                          },
                        })
                      }
                      className={clsx(
                        'inline-flex items-center border-b-2 px-1 pt-1 text-lg font-medium',
                        router.pathname === href
                          ? 'border-brand-500 text-slate-900'
                          : 'border-transparent text-slate-800 hover:border-slate-300 hover:text-slate-700'
                      )}
                    >
                      {name}
                    </Link>
                  ))}
                </nav>
              </div>
              <SearchBar />
              <div className="flex items-center lg:hidden">
                <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500">
                  <span className="sr-only">Open menu</span>
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>
            </div>
          </div>

          {open && <MobileNav />}
        </>
      )}
    </Popover>
  )
}

export default Navbar
