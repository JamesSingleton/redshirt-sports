import { Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Transition, Popover } from '@headlessui/react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import { HorizontalLogo, SmallLogo } from '../Logo'
import SearchBar from './SearchBar'

const navigation = [
  { name: 'FCS', href: '/fcs' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact Us', href: '/contact' },
]

const Navbar = () => {
  const router = useRouter()

  const handleSearch = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    router.push('/search')
  }
  return (
    <Popover as="header" className="shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-screen-2xl px-2 sm:px-4 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex px-2 lg:px-0">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/" prefetch={false}>
                    <a className="block h-8 w-auto lg:hidden">
                      <SmallLogo className="h-8 w-auto" />
                    </a>
                  </Link>
                  <Link href="/" prefetch={false}>
                    <a className="hidden h-8 w-auto lg:block">
                      <HorizontalLogo className="h-8" />
                    </a>
                  </Link>
                </div>
                <nav
                  className="hidden lg:ml-6 lg:flex lg:space-x-8"
                  title="Main Navigation"
                  aria-label="Main Navigation"
                >
                  {navigation.map(({ name, href }) => (
                    <Link href={href} key={name} prefetch={false}>
                      <a
                        className={clsx(
                          'inline-flex items-center border-b-2 px-1 pt-1 text-lg font-medium',
                          router.pathname === href
                            ? 'border-brand-500 text-slate-900'
                            : 'border-transparent text-slate-800 hover:border-slate-300 hover:text-slate-700'
                        )}
                      >
                        {name}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <SearchBar />
              <div className="flex items-center lg:hidden">
                <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500">
                  <span className="sr-only">Open menu</span>
                  <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>
            </div>
          </div>

          <Transition
            as={Fragment}
            enter="duration-200 ease-out"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="duration-100 ease-in"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Popover.Panel
              focus
              className="absolute inset-x-0 top-0 z-10 origin-top-right transform p-2 transition md:hidden"
            >
              <div className="divide-y-2 divide-slate-50 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="px-5 pt-5 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <SmallLogo className="h-8 w-auto" />
                    </div>
                    <div className="-mr-2">
                      <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500">
                        <span className="sr-only">Close menu</span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </Popover.Button>
                    </div>
                  </div>
                  <div className="mt-6">
                    <nav className="grid gap-y-4">
                      {navigation.map((item) => (
                        <Link key={item.name} href={item.href} prefetch={false}>
                          <a className="-m-3 flex items-center rounded-md p-3 text-slate-900 hover:bg-slate-50">
                            {item.name}
                          </a>
                        </Link>
                      ))}
                    </nav>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

export default Navbar
