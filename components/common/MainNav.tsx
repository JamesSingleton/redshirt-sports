'use client'

import { forwardRef, ElementRef, ComponentPropsWithoutRef } from 'react'
import Link from 'next/link'

import { cn } from '@lib/utils'
import LargeLogo from './LargeLogo'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@components/ui/NavigationMenu'

export function MainNav(props: any) {
  const { categories } = props
  return (
    <div className="mr-4 hidden lg:flex">
      <Link href="/" className="flex items-center">
        <LargeLogo className="h-10 w-auto" />
        <span className="sr-only">Redshirt Sports</span>
      </Link>
      <NavigationMenu className="ml-4">
        <NavigationMenuList>
          {categories.map((category: any) => {
            if (category.conferences.length > 0) {
              return (
                <NavigationMenuItem key={category._id}>
                  <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href={`/news/${category.slug}`}
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">{`${category.name} Home`}</div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              {/* {category.navSnippet} */}
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      {category.conferences.map((component: any) => {
                        return (
                          <ListItem
                            key={`main_nav_${component._id}`}
                            title={component.name}
                            href={`/news/${category.slug}/${component.slug}`}
                          />
                        )
                      })}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            } else {
              return (
                <NavigationMenuItem key={`main_nav_${category._id}`}>
                  <Link href={`/news/${category.slug}`} legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      {category.title}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )
            }
          })}

          <NavigationMenuItem>
            <Link href="/about" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                About
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contact" legacyBehavior passHref>
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
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className,
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </Link>
        </NavigationMenuLink>
      </li>
    )
  },
)
ListItem.displayName = 'ListItem'
