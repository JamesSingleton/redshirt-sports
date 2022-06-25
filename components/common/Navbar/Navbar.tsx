import { Fragment } from 'react'
import Link from 'next/link'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { SearchIcon } from '@heroicons/react/solid'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { HorizontalLogo, SmallLogo } from '../Logo'

const navigation = [
  { name: 'FCS', href: '/fcs' },
  { name: 'Meet the Team', href: '/authors' },
  { name: 'About', href: '/about' },
  { name: 'Contact Us', href: '/contact-us' },
]

const Navbar = () => {
  return (
    <Disclosure as="nav" className="shadow">
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
                <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                  {navigation.map(({ name, href }) => (
                    <Link href={href} key={name}>
                      <a className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-lg font-medium text-slate-800 hover:border-slate-300 hover:text-slate-700">
                        {name}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
                <div className="w-full max-w-lg lg:max-w-xs">
                  <label htmlFor="search" className="sr-only">
                    Search
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <SearchIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-slate-500 focus:border-indigo-500 focus:placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Search"
                      type="search"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center lg:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            <div className="space-y-1 pt-2 pb-3">
              {/* Current: "bg-indigo-50 border-indigo-500 text-indigo-700", Default: "border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800" */}
              <Disclosure.Button
                as="a"
                href="#"
                className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700"
              >
                Dashboard
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="#"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Team
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="#"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Projects
              </Disclosure.Button>
              <Disclosure.Button
                as="a"
                href="#"
                className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
              >
                Calendar
              </Disclosure.Button>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

export default Navbar
