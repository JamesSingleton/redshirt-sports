'use client'
import { forwardRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { motion, useScroll, useTransform } from 'framer-motion'

import { Search, MobileSearch } from './Search'
import { ModeToggle } from './ModeToggle'
import {
  MobileNavigation,
  useIsInsideMobileNavigation,
  useMobileNavigationStore,
} from './MobileNavigation'
import Logo from '../SmallLogo'
import LargeLogo from '../LargeLogo'

interface Props {
  className?: string
  categories?: {
    _id: string
    title: string
    slug: string
    subcategories: {
      _id: string
      title: string
      slug: string
    }
  }[]
}

function TopLevelNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm leading-5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

export const Header = forwardRef<HTMLDivElement, Props>(function Header(
  { className, categories },
  ref
) {
  const { isOpen: mobileNavIsOpen } = useMobileNavigationStore()
  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const { scrollY } = useScroll()
  const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9])
  const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8])

  return (
    <motion.div
      ref={ref}
      className={clsx(
        className,
        'fixed inset-x-0 top-0 z-50 gap-12 px-4 transition sm:px-6 lg:z-30 lg:px-8',
        !isInsideMobileNavigation && 'backdrop-blur-sm dark:backdrop-blur',
        isInsideMobileNavigation
          ? 'bg-white dark:bg-zinc-900'
          : 'bg-white/[var(--bg-opacity-light)] dark:bg-zinc-900/[var(--bg-opacity-dark)]'
      )}
      style={{
        // @ts-ignore
        '--bg-opacity-light': bgOpacityLight,
        '--bg-opacity-dark': bgOpacityDark,
      }}
    >
      <div
        className={clsx(
          'absolute inset-x-0 top-full h-px transition',
          (isInsideMobileNavigation || !mobileNavIsOpen) && 'bg-zinc-900/7.5 dark:bg-white/7.5'
        )}
      />
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-5">
          <MobileNavigation categories={categories!} />
          <Link href="/" aria-label="Home">
            <LargeLogo className="h-8" />
          </Link>
          <nav className="hidden lg:block">
            <ul role="list" className="flex items-center gap-8">
              {categories &&
                categories.map((category) => (
                  <TopLevelNavItem key={category._id} href={`/news/${category.slug}`}>
                    {category.title}
                  </TopLevelNavItem>
                ))}
              <TopLevelNavItem href="/about">About</TopLevelNavItem>
              <TopLevelNavItem href="/contact">Contact Us</TopLevelNavItem>
            </ul>
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Search />
          <div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/20" />
          <div className="flex gap-4">
            <MobileSearch />
            <ModeToggle />
          </div>
        </div>
      </div>
    </motion.div>
  )
})
