import { useState, useEffect } from 'react'
import Link from 'next/link'
import Router from 'next/router'
import { Dialog } from '@headlessui/react'
import { DotsVerticalIcon, XIcon, SearchIcon } from '@heroicons/react/outline'
import clsx from 'clsx'

import { SmallLogo, HorizontalLogo } from '../Logo'
import { ThemeSelect, ThemeToggle } from '../ThemeToggle/ThemeToggle'

export function NavItems() {
  return (
    <>
      <li>
        <Link href="/fcs">
          <a className="hover:text-sky-500 dark:hover:text-sky-400">FCS</a>
        </Link>
      </li>
      <li>
        <Link href="/authors">
          <a className="hover:text-sky-500 dark:hover:text-sky-400">Meet the Team</a>
        </Link>
      </li>
      <li>
        <Link href="/about-us">
          <a className="hover:text-sky-500 dark:hover:text-sky-400">About</a>
        </Link>
      </li>
      <li>
        <Link href="/contact-us">
          <a className="hover:text-sky-500 dark:hover:text-sky-400">Contact Us</a>
        </Link>
      </li>
    </>
  )
}

export const NavPopover = ({ display = 'md:hidden', className, ...props }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    function handleRouteChange() {
      setIsOpen(false)
    }

    Router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [isOpen])

  return (
    <div className={clsx(className, display)} {...props}>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
        onClick={() => setIsOpen(true)}
      >
        <span className="sr-only">Navigation</span>
        <DotsVerticalIcon className="h-6 w-6" />
      </button>
      <Dialog
        as="div"
        className={clsx('fixed inset-0 z-50', display)}
        open={isOpen}
        onClose={setIsOpen}
      >
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-slate-900/80" />
        <div className="dark:highlight-white/5 fixed top-4 right-4 w-full max-w-xs rounded-lg bg-white p-6 text-base font-semibold text-slate-900 shadow-lg dark:bg-slate-800 dark:text-slate-400">
          <button
            type="button"
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
            onClick={() => setIsOpen(false)}
          >
            <span className="sr-only">Close navigation</span>
            <XIcon className="h-6 w-6 overflow-visible" />
          </button>
          <ul className="space-y-6">
            <NavItems />
          </ul>
          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-200/10">
            <ThemeSelect />
          </div>
        </div>
      </Dialog>
    </div>
  )
}

const Navbar = ({ hasNav = false, navIsOpen, onNavToggle, title, section }) => {
  const [isOpaque, setIsOpaque] = useState(false)

  useEffect(() => {
    let offset = 50
    function onScroll() {
      if (!isOpaque && window.scrollY > offset) {
        setIsOpaque(true)
      } else if (isOpaque && window.scrollY <= offset) {
        setIsOpaque(false)
      }
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll, { passive: true })
    }
  }, [isOpaque])

  return (
    <>
      <div
        className={clsx(
          'sticky top-0 z-40 w-full flex-none backdrop-blur transition-colors duration-500 dark:border-slate-50/[0.06] lg:z-50 lg:border-b lg:border-slate-900/10',
          isOpaque
            ? 'supports-backdrop-blur:bg-white/95 bg-white dark:bg-slate-900/75'
            : 'supports-backdrop-blur:bg-white/60 bg-white/95 dark:bg-transparent'
        )}
      >
        <div className="max-w-8xl mx-auto">
          <div
            className={clsx(
              'border-b border-slate-900/10 py-4 dark:border-slate-300/10 lg:border-0 lg:px-8',
              hasNav ? 'mx-4 lg:mx-0' : 'px-4'
            )}
          >
            <div className="relative flex items-center">
              <Link href="/">
                <a
                  className="mr-3 w-auto flex-none overflow-hidden"
                  onContextMenu={(e) => {
                    e.preventDefault()
                    Router.push('/brand')
                  }}
                >
                  <span className="sr-only">Tailwind CSS home page</span>
                  <SmallLogo className="h-8 w-auto" />
                </a>
              </Link>
              <div className="relative ml-auto hidden items-center lg:flex">
                <nav className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                  <ul className="flex space-x-8">
                    <NavItems />
                  </ul>
                </nav>
                <div className="ml-6 flex items-center border-l border-slate-200 pl-6 dark:border-slate-800">
                  <ThemeToggle panelClassName="mt-8" />
                  <a
                    href="https://github.com/tailwindlabs/tailwindcss"
                    className="ml-6 block text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
                  >
                    <span className="sr-only">Tailwind CSS on GitHub</span>
                    <svg
                      viewBox="0 0 16 16"
                      className="h-5 w-5"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                  </a>
                </div>
              </div>
              <button className="-my-1 ml-auto flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 lg:hidden">
                <span className="sr-only">Search</span>
                <SearchIcon className="h-6 w-6" />
              </button>
              <NavPopover className="-my-1 ml-2" display="lg:hidden" />
            </div>
          </div>
          {hasNav && (
            <div className="flex items-center border-b border-slate-900/10 p-4 dark:border-slate-50/[0.06] lg:hidden">
              <button
                type="button"
                onClick={() => onNavToggle(!navIsOpen)}
                className="text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <span className="sr-only">Navigation</span>
                <svg width="24" height="24">
                  <path
                    d="M5 6h14M5 12h14M5 18h14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              {title && (
                <ol className="ml-4 flex min-w-0 whitespace-nowrap text-sm leading-6">
                  {section && (
                    <li className="flex items-center">
                      {section}
                      <svg
                        width="3"
                        height="6"
                        aria-hidden="true"
                        className="mx-3 overflow-visible text-slate-400"
                      >
                        <path
                          d="M0 0L3 3L0 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </li>
                  )}
                  <li className="truncate font-semibold text-slate-900 dark:text-slate-200">
                    {title}
                  </li>
                </ol>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Navbar
