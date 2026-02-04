'use client'

import { useEffect, useState, memo, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, ChevronDown, ChevronRight } from 'lucide-react'

import { ScrollArea } from '@redshirt-sports/ui/components/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@redshirt-sports/ui/components/collapsible'
import { Button } from '@redshirt-sports/ui/components/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@redshirt-sports/ui/components/navigation-menu'
import { SheetContent, SheetHeader, SheetTitle } from '@redshirt-sports/ui/components/sheet'
import { Sheet, SheetTrigger } from '@redshirt-sports/ui/components/sheet'

import { useIsMobile } from '@/hooks/use-is-mobile'
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from '@redshirt-sports/sanity/types'

import { Logo } from './logo'
import { ModeToggle } from './mode-toggle'
import { SearchBar } from './search-bar'
import { Top25RankingsData } from './navbar'

const divisionDisplayNames: Record<string, string> = {
  fbs: 'FBS',
  fcs: 'FCS',
  d2: 'Division II',
  d3: 'Division III',
  naia: 'NAIA',
  'power-conference': 'Power Conference',
  'mid-major': 'Mid-Major',
}

const MobileNavbar = memo(function MobileNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult
  settingsData: QueryGlobalSeoSettingsResult
  latestRankings: Top25RankingsData
}) {
  const { siteTitle, logo } = settingsData ?? {}
  const [isOpen, setIsOpen] = useState(false)
  const footballRankings = useMemo(
    () => latestRankings.find((sportData) => sportData.sport === 'football')?.divisions || [],
    [latestRankings],
  )

  const path = usePathname()

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
        <div className="my-4 flex flex-col gap-4">
          <div className="border-b px-4 py-3">
            <SearchBar placeholder="Search articles..." className="w-full" />
          </div>
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
                            prefetch={false}
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
          {latestRankings && (
            <Collapsible>
              <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors">
                Rankings
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-2">
                {footballRankings && (
                  <Collapsible>
                    <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                      College Football
                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-1">
                      <div className="mt-1 grid grid-cols-1 gap-0.5">
                        {footballRankings.map((ranking: any) => (
                          <Link
                            key={`${ranking?.division}-${ranking?.year}-${ranking?.week}-mobile`}
                            href={`/college/football/rankings/${ranking?.division}/${ranking?.year}/${ranking?.week === 999 ? 'final-rankings' : ranking?.week}`}
                            className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {divisionDisplayNames[ranking?.division] ?? ranking?.division} Football
                            Rankings
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                    Men&apos;s Basketball
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1">
                    <div className="mt-1 grid grid-cols-1 gap-0.5">
                      <span className="text-muted-foreground py-1 text-sm">Coming Soon...</span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Link
            href="/college/news"
            className="hover:bg-muted flex items-center px-4 py-3 text-base font-medium transition-colors"
            onClick={() => setIsOpen(false)}
            prefetch={false}
          >
            News
          </Link>

          <Link
            href="/transfer-portal"
            className="hover:bg-muted flex items-center px-4 py-3 text-base font-bold transition-colors"
            style={{ color: '#FF4500' }}
            onClick={() => setIsOpen(false)}
            prefetch={false}
          >
            Transfer Portal
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
})

export const DesktopNavbar = memo(function DesktopNavbar({
  navbarData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult
  latestRankings: Top25RankingsData
}) {
  const footballRankings = useMemo(
    () => latestRankings.find((sportData) => sportData.sport === 'football')?.divisions || [],
    [latestRankings],
  )

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
                                  prefetch={false}
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

          {latestRankings && (
            <NavigationMenuItem>
              <NavigationMenuTrigger>Rankings</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[600px] p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {footballRankings && (
                      <div className="space-y-3">
                        <h3 className="border-b pb-1 text-base font-medium">College Football</h3>
                        <div className="space-y-1.5">
                          {footballRankings.map((ranking) => (
                            <Link
                              key={`${ranking?.division}-${ranking?.year}-${ranking?.week}`}
                              href={`/college/football/rankings/${ranking?.division}/${ranking?.year}/${ranking?.week === 999 ? 'final-rankings' : ranking?.week}`}
                              className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 text-sm leading-none font-semibold transition-colors outline-none select-none"
                            >
                              {ranking?.division && divisionDisplayNames[ranking.division]
                                ? divisionDisplayNames[ranking.division]
                                : ranking?.division}{' '}
                              Football Rankings
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="border-b pb-1 text-base font-medium">
                        Men&apos;s College Basketball
                      </h3>
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground py-1 text-sm">Coming Soon...</span>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}

          <NavigationMenuItem>
            <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/college/news">
              News
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              href="/transfer-portal"
              style={{ color: '#FF4500', fontWeight: 600 }}
            >
              Transfer Portal
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
})

const ClientSideNavbar = memo(function ClientSideNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult
  settingsData: QueryGlobalSeoSettingsResult
  latestRankings: Top25RankingsData
}) {
  const isMobile = useIsMobile()

  // Show skeleton during initial render/hydration to prevent mismatch
  if (isMobile === null) {
    return <NavbarSkeletonResponsive />
  }

  return isMobile ? (
    <MobileNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  ) : (
    <DesktopNavbar navbarData={navbarData} latestRankings={latestRankings} />
  )
})

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

// Export the client navbar directly - now SSR-friendly with proper hydration handling
export const NavbarClient = ClientSideNavbar
