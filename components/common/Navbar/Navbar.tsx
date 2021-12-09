import { Fragment, FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Popover, Transition } from '@headlessui/react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import { SearchIcon } from '@heroicons/react/solid'
import NavbarRoot from './NavbarRoot'

const navigation = [
  { name: 'FBS', href: '/fbs' },
  { name: 'FCS', href: '/fcs' },
  { name: 'Meet the Team', href: '/authors' },
]

const Navbar: FC = () => {
  return (
    <NavbarRoot>
      <div
        className="absolute inset-0 shadow z-30 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-20">
        <div className="max-w-8xl mx-auto flex justify-between items-center px-4 py-5 sm:px-6 sm:py-4 lg:px-8 md:justify-start md:space-x-10">
          <div>
            <Link href="/">
              <a className="flex text-4xl font-bold text-white">R/S</a>
            </Link>
          </div>
          <div className="hidden md:flex-1 md:flex md:items-center md:justify-between">
            <nav className="flex space-x-10">
              {navigation.map(({ name, href }) => (
                <Link href={href} key={name}>
                  <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                    {name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="md:hidden">
            <Popover.Button className="bg-gray-800 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
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
        leave="duration-200 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute z-30 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
        >
          {({ close }) => (
            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
              <div className="pt-5 pb-6 px-5 sm:pb-8">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-3xl">R/S</div>
                  <div className="-mr-2">
                    <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                      <span className="sr-only">Close menu</span>
                      <XIcon className="h-6 w-6" aria-hidden="true" />
                    </Popover.Button>
                  </div>
                </div>
                <div className="mt-6 sm:mt-8">
                  <nav>
                    <div className="grid gap-7 sm:grid-cols-2 sm:gap-y-8 sm:gap-x-4">
                      {navigation.map(({ name, href }) => (
                        <Link href={href} key={name}>
                          <a
                            onClick={() => close()}
                            className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700"
                          >
                            {name}
                          </a>
                        </Link>
                      ))}
                    </div>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Popover.Panel>
      </Transition>
    </NavbarRoot>
  )
}

export default Navbar
