'use client'

import { forwardRef, ComponentRef, ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'
import { cn } from '@workspace/ui/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@workspace/ui/components/navigation-menu'

import SmallLogo from './small-logo'


import type { NavProps } from '@/types'

export function MainNav({ divisions, latestFCSTop25 }: NavProps) {
  return (
    <div className="mr-4 hidden lg:flex">
      <Link
        href="/"
        className="flex items-center"
        prefetch={false}
        aria-label={`Home - ${process.env.NEXT_PUBLIC_APP_NAME}`}
      >
        <SmallLogo className="h-10 w-auto" />
        <span className="sr-only">{process.env.NEXT_PUBLIC_APP_NAME}</span>
      </Link>
      <NavigationMenu className="ml-4">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>College Football</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid grid-cols-3 gap-2 w-[700px]">
                <li>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/college/football/news/fbs"
                      prefetch={false}
                      className="block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <div className="text-sm font-medium leading-none">FBS</div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>College Basketball</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid grid-cols-3 gap-2 w-[700px]">

              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const ListItem = forwardRef<ComponentRef<'a'>, ComponentPropsWithoutRef<'a'>>(
  ({ className, title, ...props }, ref) => {
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
