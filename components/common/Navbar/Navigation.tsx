import { Key, ClassAttributes, HTMLAttributes, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { AnimatePresence, motion, useIsPresent } from 'framer-motion'

import { useIsInsideMobileNavigation } from './MobileNavigation'
import { remToPx } from '@lib/remToPx'

function useInitialValue(value: any[], condition = true) {
  const initialValue = useRef(value).current
  return condition ? initialValue : value
}

function TopLevelNavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li className="lg:hidden">
      <Link
        href={href}
        className="block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        {children}
      </Link>
    </li>
  )
}

function NavLink({
  href,
  tag,
  active,
  isAnchorLink = false,
  children,
}: {
  href: string
  tag?: string
  active?: boolean
  isAnchorLink?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex justify-between gap-2 py-1 pr-3 text-sm transition',
        isAnchorLink ? 'pl-7' : 'pl-4',
        active
          ? 'text-zinc-900 dark:text-white'
          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
      )}
    >
      <span className="truncate">{children}</span>
      {tag && (
        <span className="font-mono text-[0.625rem] font-semibold leading-6 text-zinc-400 dark:text-zinc-500">
          {tag}
        </span>
      )}
    </Link>
  )
}

function NavigationGroup({ group, className }: { group: any; className?: string | boolean }) {
  // If this is the mobile navigation then we always render the initial
  // state, so that the state does not change during the close animation.
  // The state will still update when we re-open (re-render) the navigation.
  let isInsideMobileNavigation = useIsInsideMobileNavigation()

  const pathname = usePathname()

  return (
    <li className={clsx('relative mt-6', className)}>
      <motion.h2 layout="position" className="text-xs font-semibold text-zinc-900 dark:text-white">
        {group.title}
      </motion.h2>
      <div className="relative mt-3 pl-2">
        <motion.div
          layout
          className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5"
        />

        <ul role="list" className="border-l border-transparent">
          {group.subcategories.map((link: { slug: string; title: any; parentSlug: string }) => (
            <motion.li key={link.slug} layout="position" className="relative">
              <NavLink
                href={`/news/${link.parentSlug}/${link.slug}`}
                active={`/news/${link.parentSlug}/${link.slug}` === pathname}
              >
                {link.title}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </div>
    </li>
  )
}

export function Navigation(props: any) {
  return (
    <nav {...props}>
      <ul role="list">
        {props.categories.map((group: any, groupIndex: number) => (
          <NavigationGroup
            key={group.title}
            group={group}
            className={groupIndex === 0 && 'md:mt-0'}
          />
        ))}
        <TopLevelNavItem href="/about">About</TopLevelNavItem>
        <TopLevelNavItem href="/contact">Contact Us</TopLevelNavItem>
      </ul>
    </nav>
  )
}
