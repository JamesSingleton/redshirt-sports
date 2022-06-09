import { Fragment, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Menu, Popover, Transition } from '@headlessui/react'
import { SearchIcon } from '@heroicons/react/solid'
import { BellIcon, MenuIcon, XIcon } from '@heroicons/react/outline'
import cn from 'clsx'
import { usePlausible } from 'next-plausible'

import { ThemeToggle, ThemeSelect } from '../ThemeToggle/ThemeToggle'
import Logo from '../../../public/images/icons/RS_red.svg'

const navigation = [
  { name: 'FCS', href: '/fcs' },
  { name: 'Meet the Team', href: '/authors' },
  { name: 'About', href: '/about' },
  { name: 'Contact Us', href: '/contact-us' },
]

const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]

const user = {
  name: 'Whitney Francis',
  email: 'whitney@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80',
}

const Navbar = () => {
  const { asPath } = useRouter()
  const plausible = usePlausible()
  const [scrolled, setScrolled] = useState(false)

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [onScroll])

  return (
    <header
      className={`fixed w-full ${
        scrolled ? 'drop-shadow-md' : ''
      } ease top-0 left-0 right-0 z-30 h-16 bg-white transition-all duration-150`}
    >
      <div className="mx-auto max-w-none px-2 sm:px-4 lg:px-8">
        <Popover className="flex h-16 justify-between">
          <div className="flex px-2 lg:px-0">
            <div className="flex w-auto flex-shrink-0 items-center">
              <Link href="/" prefetch={false}>
                <a
                  onClick={() =>
                    plausible('clickOnNavbar', {
                      props: {
                        item: 'Home',
                      },
                    })
                  }
                >
                  <Image
                    src="/images/icons/RS_red.svg"
                    alt="Redshirt Sports Logo"
                    width={64}
                    height={64}
                  />
                </a>
              </Link>
            </div>
            <nav
              aria-label="Global"
              className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4"
            >
              {navigation.map(({ name, href }) => (
                <Link key={name} href={href} prefetch={false}>
                  <a
                    onClick={() =>
                      plausible('clickOnNavbar', {
                        props: {
                          item: name,
                        },
                      })
                    }
                    className="px-3 py-2 text-base font-medium text-slate-900"
                  >
                    {name}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="w-full max-w-lg lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <SearchIcon
                    className="h-5 w-5 text-slate-900"
                    aria-hidden="true"
                  />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border border-slate-900 bg-white py-2 pl-10 pr-3 leading-5 placeholder-slate-900 shadow-sm focus:border-blue-600 focus:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600 sm:text-sm"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center lg:hidden">
            {/* Mobile menu button */}
            <Popover.Button className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
              <span className="sr-only">Open main menu</span>
              <MenuIcon className="block h-6 w-6" aria-hidden="true" />
            </Popover.Button>
          </div>
          <Transition.Root as={Fragment}>
            <div className="lg:hidden">
              <Transition.Child
                as={Fragment}
                enter="duration-150 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="duration-150 ease-in"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Popover.Overlay
                  className="fixed inset-0 z-20 bg-black bg-opacity-25"
                  aria-hidden="true"
                />
              </Transition.Child>

              <Transition.Child
                as={Fragment}
                enter="duration-150 ease-out"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="duration-150 ease-in"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Popover.Panel
                  focus
                  className="absolute top-0 right-0 z-30 w-full max-w-none origin-top transform p-2 transition"
                >
                  <div className="divide-y divide-gray-200 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="pt-3 pb-2">
                      <div className="flex items-center justify-between px-4">
                        <div>
                          <Image
                            src="/images/icons/RS_red.svg"
                            alt="Redshirt Sports Logo"
                            width={64}
                            height={64}
                          />
                        </div>
                        <div className="-mr-2">
                          <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                            <span className="sr-only">Close menu</span>
                            <XIcon className="h-6 w-6" aria-hidden="true" />
                          </Popover.Button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1 px-2">
                        {navigation.map((item) => (
                          <a
                            key={item.name}
                            href={item.href}
                            className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 hover:text-gray-800"
                          >
                            {item.name}
                          </a>
                        ))}
                      </div>
                    </div>
                    {/* <div className="px-5 pt-4 pb-2">
                      <ThemeSelect />
                    </div> */}
                  </div>
                </Popover.Panel>
              </Transition.Child>
            </div>
          </Transition.Root>
          <div className="hidden lg:ml-4 lg:flex lg:items-center">
            <a
              href="https://twitter.com/_redshirtsports"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-900"
            >
              <span className="sr-only">Redshirt Sports Twitter Link</span>
              <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>

            {/* <div className="relative ml-4 flex-shrink-0">
              <ThemeToggle />
            </div> */}
          </div>
        </Popover>
      </div>
    </header>
  )
}

export default Navbar
