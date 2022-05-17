import { FC } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import cn from 'classnames'
import { Popover } from '@headlessui/react'
import { MenuIcon } from '@heroicons/react/outline'
import { usePlausible } from 'next-plausible'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import MobileNav from './MobileNav'

const navigation = [
  { name: 'FBS', href: '/fbs' },
  { name: 'FCS', href: '/fcs' },
  { name: 'Meet the Team', href: '/authors' },
]

const Navbar: FC = () => {
  const { asPath } = useRouter()
  const plausible = usePlausible()

  return (
    <Popover
      as="header"
      className="mx-auto bg-white dark:border-slate-50/[0.06]  dark:bg-slate-900 lg:border-b lg:border-slate-900/10"
    >
      {({ open }) => (
        <>
          <div className="relative">
            <div className="flex items-center justify-between px-4 sm:px-6 md:justify-start md:space-x-10">
              <div>
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
                    <span className="sr-only">Redshirt Sports</span>
                    <Image
                      src="/images/icons/RS_red.svg"
                      alt="Redshirt Sports Logo"
                      width={74}
                      height={74}
                    />
                  </a>
                </Link>
              </div>
              <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
                <nav className="flex space-x-10">
                  {navigation.map(({ name, href }) => (
                    <Link href={href} key={name} prefetch={false}>
                      <a
                        onClick={() =>
                          plausible('clickOnNavbar', {
                            props: {
                              item: name,
                            },
                          })
                        }
                        className={cn(
                          asPath === href
                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                            : 'text-slate-900 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-50 dark:hover:bg-slate-800',
                          'block rounded-md py-2 px-3 text-base font-medium'
                        )}
                      >
                        {name}
                      </a>
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center md:ml-12">
                  <ThemeToggle />
                  <a
                    href="https://twitter.com/_redshirtsports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-8"
                  >
                    <span className="sr-only">
                      Redshirt Sports Twitter Link
                    </span>
                    <svg
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>
              <div className="md:hidden">
                <Popover.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:bg-slate-800">
                  <span className="sr-only">Open menu</span>
                  <MenuIcon className="h-6 w-6" aria-hidden="true" />
                </Popover.Button>
              </div>
            </div>
          </div>
          {open && <MobileNav navigation={navigation} />}
        </>
      )}
    </Popover>
  )
}

export default Navbar
