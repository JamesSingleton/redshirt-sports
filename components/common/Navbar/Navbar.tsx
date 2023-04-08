'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

import SearchBar from './SearchBar'
import Logo from '../SmallLogo'
import { NAVIGATION_ITEMS } from '@lib/constants'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white">
      <nav
        className="mx-auto flex max-w-screen-2xl items-center justify-between p-6 lg:px-8"
        aria-label="Global"
      >
        <div className="flex items-center gap-x-12">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">Redshirt Sports</span>
            <Logo className="h-8 w-auto" />
          </Link>
          <Popover.Group className="hidden lg:flex lg:gap-x-12" as="div">
            {NAVIGATION_ITEMS.map((item) => {
              if (item.name === 'FCS') {
                return (
                  <Popover className="relative" key={item.name}>
                    <Popover.Button className="flex items-center gap-x-1 text-lg font-semibold leading-6 text-slate-900">
                      {item.name}
                      <ChevronDownIcon
                        className="h-5 w-5 flex-none text-slate-400"
                        aria-hidden="true"
                      />
                    </Popover.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4">
                        <div className="text-md w-56 shrink rounded-xl bg-white p-4 font-semibold leading-6 text-slate-900 shadow-lg ring-1 ring-gray-900/5">
                          {item.conferences?.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              className="block p-2 hover:bg-slate-100"
                            >
                              {item.name}
                            </a>
                          ))}
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </Popover>
                )
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-semibold leading-6 text-slate-900 hover:text-indigo-600"
                >
                  {item.name}
                </Link>
              )
            })}
          </Popover.Group>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex">
          <SearchBar />
        </div>
      </nav>
      <Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
        <div className="fixed inset-0 z-10" />
        <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="sr-only">Redshirt Sports</span>
              <Logo className="h-8 w-auto" />
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-slate-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {NAVIGATION_ITEMS.map((item) => {
                  if (item.name === 'FCS') {
                    return (
                      <Disclosure as="div" className="-mx-3" key={item.name}>
                        {({ open }) => (
                          <>
                            <Disclosure.Button className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 hover:bg-gray-50">
                              FCS
                              <ChevronDownIcon
                                className={clsx(open ? 'rotate-180' : '', 'h-5 w-5 flex-none')}
                                aria-hidden="true"
                              />
                            </Disclosure.Button>
                            <Disclosure.Panel className="mt-2 space-y-2">
                              {item.conferences?.map((item) => (
                                <Disclosure.Button
                                  key={item.name}
                                  as="a"
                                  href={item.href}
                                  className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-slate-900 hover:bg-gray-50"
                                >
                                  {item.name}
                                </Disclosure.Button>
                              ))}
                            </Disclosure.Panel>
                          </>
                        )}
                      </Disclosure>
                    )
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </header>
  )
}
