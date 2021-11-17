import { Fragment, FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Popover, Transition } from '@headlessui/react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'
import { SearchIcon } from '@heroicons/react/solid'
import NavbarRoot from './NavbarRoot'

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
              <a className="flex">
                <span className="sr-only">Redshirt Sports</span>
                <Image
                  className="h-8 w-auto sm:h-10"
                  src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                  alt=""
                  width="40"
                  height="40"
                />
              </a>
            </Link>
          </div>
          <div className="hidden md:flex-1 md:flex md:items-center md:justify-between">
            <Popover.Group as="nav" className="flex space-x-10">
              <Link href="/fbs">
                <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  FBS
                </a>
              </Link>
              <Link href="/fcs">
                <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  FCS
                </a>
              </Link>
              <Link href="/authors">
                <a className="text-base px-3 py-2 font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-md">
                  Meet the Team
                </a>
              </Link>
            </Popover.Group>
          </div>
          <div className="flex-1 flex justify-center px-4 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </div>
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
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel
          focus
          className="absolute z-30 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
        >
          <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
            <div className="pt-5 pb-6 px-5 sm:pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <Image
                    className="h-8 w-auto"
                    src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                    alt="Workflow"
                    height="32"
                    width="32"
                  />
                </div>
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
                    <Link href="/fcs">
                      <a className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700">
                        FCS
                      </a>
                    </Link>

                    <Link href="/fbs">
                      <a className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700">
                        FBS
                      </a>
                    </Link>
                    <Link href="/authors">
                      <a className="rounded-md text-base font-medium text-gray-900 hover:text-gray-700">
                        Meet the Team
                      </a>
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </NavbarRoot>
  )
}

export default Navbar
