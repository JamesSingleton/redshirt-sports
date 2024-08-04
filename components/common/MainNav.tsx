'use client'

import { forwardRef, ElementRef, ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import SmallLogo from './SmallLogo'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

import type { NavProps } from '@/types'

export function MainNav({ divisions }: NavProps) {
  return (
    <div className="mr-4 hidden lg:flex">
      <Link
        href="/"
        className="flex items-center"
        prefetch={false}
        aria-label="Home - Redshirt Sports"
      >
        <SmallLogo className="h-10 w-auto" />
        <span className="sr-only">Redshirt Sports</span>
      </Link>
      <NavigationMenu className="ml-4">
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/news" legacyBehavior passHref prefetch={false}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>News</NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          {divisions.map((division) => {
            if (division.conferences.length > 0) {
              return (
                <NavigationMenuItem key={division._id}>
                  <NavigationMenuTrigger>{division.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[700px] lg:w-[850px] lg:grid-cols-4">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href={`/news/${division.slug}`}
                            prefetch={false}
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">{`${division.name} Home`}</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {division.conferences.map((conference) => {
                        return (
                          <ListItem
                            key={`main_nav_${conference._id}`}
                            title={conference.name}
                            href={`/news/${division.slug}/${conference.slug}`}
                          />
                        )
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            } else {
              return (
                <NavigationMenuItem key={`main_nav_${division._id}`}>
                  <Link href={`/news/${division.slug}`} legacyBehavior passHref prefetch={false}>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {division.name}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )
            }
          })}

          <NavigationMenuItem>
            <Link href="/about" legacyBehavior passHref prefetch={false}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                About
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contact" legacyBehavior passHref prefetch={false}>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Contact
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = forwardRef<ElementRef<'a'>, ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            ref={ref}
            href={props.href!}
            prefetch={false}
            className={cn(
              'block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = 'ListItem'
