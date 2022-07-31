import { Fragment } from 'react'
import Link from 'next/link'
import { Transition, Popover } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'

import { SmallLogo } from '../Logo'
import { NAVIGATION_ITEMS } from '@lib/constants'

const MobileNav = () => {
  return (
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
        className="absolute inset-x-0 top-0 z-10 origin-top-right transform p-2 transition lg:hidden"
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
                {NAVIGATION_ITEMS.map((item) => (
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
  )
}

export default MobileNav
