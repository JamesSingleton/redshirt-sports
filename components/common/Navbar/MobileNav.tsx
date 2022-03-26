import { FC, Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Popover, Transition } from '@headlessui/react'
import { XIcon } from '@heroicons/react/outline'
import { usePlausible } from 'next-plausible'
import { ThemeSelect } from '../ThemeToggle/ThemeToggle'

interface MobileNavProps {
  navigation: { name: string; href: string }[]
}

const MobileNav: FC<MobileNavProps> = ({ navigation }) => {
  const plausible = usePlausible()
  return (
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
        className="absolute inset-x-0 top-0 z-30 origin-top-right transform p-2 transition md:hidden"
      >
        {({ close }) => (
          <div className="dark:highlight-white/5 divide-y-2 divide-slate-50 rounded-lg bg-white text-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-slate-800 dark:text-slate-400">
            <div className="px-5 pt-5 pb-6 sm:pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <Image
                    src="/images/icons/RS_red.svg"
                    height="74"
                    width="74"
                    alt="Redshirt Sports logo"
                  />
                </div>
                <div className="-mr-2">
                  <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                    <span className="sr-only">Close menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-6 sm:mt-8">
                <nav>
                  <div className="grid gap-7 sm:grid-cols-2 sm:gap-y-8 sm:gap-x-4">
                    {navigation.map(({ name, href }) => (
                      <Link href={href} key={name} prefetch={false}>
                        <a
                          onClick={() => {
                            plausible('clickOnMobileNavbar', {
                              props: {
                                item: name,
                              },
                            })
                            close()
                          }}
                          className="rounded-md text-base font-medium hover:text-sky-500 dark:hover:text-sky-400"
                        >
                          {name}
                        </a>
                      </Link>
                    ))}
                  </div>
                </nav>
                <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-200/10">
                  <ThemeSelect />
                </div>
              </div>
            </div>
          </div>
        )}
      </Popover.Panel>
    </Transition>
  )
}

export default MobileNav
