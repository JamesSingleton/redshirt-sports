'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronDown, ChevronRight } from 'lucide-react'

import { ScrollArea } from '@workspace/ui/components/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import { Button } from '@workspace/ui/components/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@workspace/ui/components/navigation-menu'
import { SheetContent, SheetHeader, SheetTitle } from '@workspace/ui/components/sheet'
import { Sheet, SheetTrigger } from '@workspace/ui/components/sheet'
import { cn } from '@workspace/ui/lib/utils'

import { useIsMobile } from '@/hooks/use-is-mobile'
import type {
  QueryNavbarDataResult,
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from '@/lib/sanity/sanity.types'

import { Logo } from './logo'
import { ModeToggle } from './mode-toggle'
import { SearchBar } from './search-bar'

interface MenuItem {
  title: string
  description: string
  href?: string
}

function MenuItemLink({
  item,
  setIsOpen,
}: {
  item: MenuItem
  setIsOpen?: (isOpen: boolean) => void
}) {
  return (
    <Link
      className={cn(
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 leading-none transition-colors outline-none select-none',
      )}
      aria-label={`Link to ${item.title ?? item.href}`}
      onClick={() => setIsOpen?.(false)}
      href={item.href ?? '/'}
    >
      <div className="">
        <div className="text-sm font-semibold">{item.title}</div>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
          {item.description}
        </p>
      </div>
    </Link>
  )
}

function MobileNavbar({
  navbarData,
  settingsData,
}: {
  navbarData: GlobalNavigationQueryResult
  settingsData: QueryGlobalSeoSettingsResult
}) {
  const { siteTitle, logo } = settingsData ?? {}
  const [isOpen, setIsOpen] = useState(false)

  const path = usePathname()

  // biome-ignore lint/correctness/useExhaustiveDependencies: This is intentional
  useEffect(() => {
    setIsOpen(false)
  }, [path])

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-end">
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{logo && <Logo alt={siteTitle} image={logo} />}</SheetTitle>
        </SheetHeader>

        <div className="mt-8 mb-8 flex flex-col gap-4">
          {navbarData.map((sport) => (
            <Collapsible key={sport._id}>
              <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors">
                {sport.name}
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-2">
                {sport.groupings.map((grouping) => (
                  <Collapsible key={grouping?._id}>
                    <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left font-medium transition-colors">
                      {grouping?.name} ({grouping?.conferences.length})
                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-1">
                      <div className="mt-1 grid grid-cols-1 gap-0.5">
                        {grouping?.conferences.map((conference) => (
                          <Link
                            key={conference._id}
                            href={`/college/${sport.slug}/news/${grouping.slug}/${conference.slug}`}
                            className="hover:bg-muted block rounded px-2 py-1 transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {conference.shortName || conference.name}
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
          <Link
            href="/college/news"
            className="hover:bg-muted flex items-center px-4 py-3 text-base font-medium transition-colors"
            onClick={() => setIsOpen(false)}
          >
            News
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavbarColumnLink({
  column,
}: {
  column: NonNullable<NonNullable<QueryNavbarDataResult>['columns']>[number]
}) {
  if (column.type !== 'link') return null
  return (
    <Link aria-label={`Link to ${column.name ?? column.href}`} href={column.href ?? ''}>
      <NavigationMenuLink
        className={cn(navigationMenuTriggerStyle(), 'text-muted-foreground dark:text-neutral-300')}
      >
        {column.name}
      </NavigationMenuLink>
    </Link>
  )
}

function NavbarColumn({
  column,
}: {
  column: NonNullable<NonNullable<QueryNavbarDataResult>['columns']>[number]
}) {
  if (column.type !== 'column') return null
  return (
    <NavigationMenuList>
      <NavigationMenuItem className="text-muted-foreground dark:text-neutral-300">
        <NavigationMenuTrigger>{column.title}</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="w-80 p-3">
            {column.links?.map((item) => (
              <li key={item._key}>
                <MenuItemLink
                  item={{
                    description: item.description ?? '',
                    href: item.href ?? '',
                    title: item.name ?? '',
                  }}
                />
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  )
}

export function DesktopNavbar({ navbarData }: { navbarData: GlobalNavigationQueryResult }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-8">
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {navbarData.map((sport) => (
            <NavigationMenuItem key={sport.slug}>
              <NavigationMenuTrigger>{sport.name}</NavigationMenuTrigger>
              <NavigationMenuContent key={sport.slug}>
                <div className="w-[850px] p-4">
                  <div className="grid grid-cols-4 gap-6">
                    {sport.groupings.map((grouping) => {
                      return (
                        <div className="space-y-3" key={grouping?._id}>
                          <h3 className="border-b pb-1 text-base font-medium">{grouping?.name}</h3>
                          <ScrollArea className="h-[280px] pr-4" scrollHideDelay={0} type="always">
                            <div className="space-y-1.5">
                              {grouping?.conferences.map((conference) => (
                                <Link
                                  key={conference._id}
                                  href={`/college/${sport.slug}/news/${grouping.slug}/${conference.slug}`}
                                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 text-sm leading-none font-semibold transition-colors outline-none select-none"
                                  title={conference.name}
                                >
                                  {conference.shortName ?? conference.name}
                                </Link>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}

          <NavigationMenuItem>
            <NavigationMenuTrigger>Rankings</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[600px] p-4">
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <h3 className="border-b pb-1 text-base font-medium">
                      College Football Rankings
                    </h3>
                    {/* <div className="space-y-1.5">
                      <Link
                        href={`/college/football/rankings/${latestFCSTop25?.division}/${latestFCSTop25?.year}/${latestFCSTop25?.week === 999 ? 'final-rankings' : latestFCSTop25?.week}`}
                        className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 text-sm leading-none font-semibold transition-colors outline-none select-none"
                      >
                        FCS College Football Rankings
                      </Link>
                    </div> */}
                  </div>
                  {/* <div className="space-y-3">
                    <h3 className="border-b pb-1 text-base font-medium">
                      Men's College Basketball Rankings
                    </h3>
                    <div className="space-y-1.5">
                      <Link
                        href="/rankings/basketball/di-power-5"
                        className="hover:text-primary block py-1 text-sm"
                      >
                        DI (Power 5) Men's College Basketball Rankings
                      </Link>
                      <Link
                        href="/rankings/basketball/di-mid-major"
                        className="hover:text-primary block py-1 text-sm"
                      >
                        DI (Mid Major) Men's College Basketball Rankings
                      </Link>
                      <Link
                        href="/rankings/basketball/dii"
                        className="hover:text-primary block py-1 text-sm"
                      >
                        DII Men's College Basketball Rankings
                      </Link>
                      <Link
                        href="/rankings/basketball/diii"
                        className="hover:text-primary block py-1 text-sm"
                      >
                        DIII Men's College Basketball Rankings
                      </Link>
                    </div>
                  </div> */}
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/college/news">
              News
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4 justify-self-end">
        <SearchBar placeholder="Search articles..." />
        <ModeToggle />
      </div>
    </div>
  )
}

const ClientSideNavbar = ({
  navbarData,
  settingsData,
}: {
  navbarData: GlobalNavigationQueryResult
  settingsData: QueryGlobalSeoSettingsResult
}) => {
  const isMobile = useIsMobile()

  if (isMobile === undefined) {
    return null // Return null on initial render to avoid hydration mismatch
  }

  return isMobile ? (
    <MobileNavbar navbarData={navbarData} settingsData={settingsData} />
  ) : (
    <DesktopNavbar navbarData={navbarData} />
  )
}

function SkeletonMobileNavbar() {
  return (
    <div className="md:hidden">
      <div className="flex justify-end">
        <div className="bg-muted h-10 w-10 animate-pulse rounded-md" />
      </div>
    </div>
  )
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden w-full grid-cols-[1fr_auto] items-center gap-8 md:grid">
      <div className="flex max-w-max flex-1 items-center justify-center gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`nav-item-skeleton-${index.toString()}`}
            className="bg-muted h-10 w-32 animate-pulse rounded"
          />
        ))}
      </div>

      <div className="justify-self-end">
        <div className="flex items-center gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`nav-button-skeleton-${index.toString()}`}
              className="bg-muted h-10 w-32 animate-pulse rounded-[10px]"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function NavbarSkeletonResponsive() {
  return (
    <>
      <SkeletonMobileNavbar />
      <SkeletonDesktopNavbar />
    </>
  )
}

// Dynamically import the navbar with no SSR to avoid hydration issues
export const NavbarClient = dynamic(() => Promise.resolve(ClientSideNavbar), {
  ssr: false,
  loading: () => <NavbarSkeletonResponsive />,
})
