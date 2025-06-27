import * as React from 'react'
import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@workspace/ui/components/navigation-menu'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { SearchBar } from './search-bar'
import SmallLogo from './small-logo'
import { getLatestFinalRankings } from '@/server/queries'
import MegaMobileNav from './mega-mobile-nav'
import { ModeToggle } from './mode-toggle'

export interface Conference {
  _id: string
  name: string
  slug: string
  shortName: string | null
}

export interface Grouping {
  _id: string
  conferences: Conference[]
  name: string
  slug: string | null
  type: string
}

export interface SportData {
  _id: string
  groupings: Grouping[]
  name: string
  slug: string
}

export type SportsData = SportData[]

export async function MegaNav({ sportsNav }: { sportsNav: SportsData }) {
  const latestFCSTop25 = await getLatestFinalRankings({
    division: 'fcs',
  })

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b shadow-sm">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile Menu Trigger */}
        <MegaMobileNav sportsNav={sportsNav} latestFCSTop25={latestFCSTop25} />
        <Link
          href="/"
          className="absolute left-1/2 flex -translate-x-1/2 transform items-center lg:static lg:mx-4 lg:transform-none"
        >
          <SmallLogo className="h-10 w-auto" />
          <span className="sr-only">Redshirt Sports Logo</span>
        </Link>
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {sportsNav.map((sport) => (
              <NavigationMenuItem key={sport.slug}>
                <NavigationMenuTrigger>{sport.name}</NavigationMenuTrigger>
                <NavigationMenuContent key={sport.slug}>
                  <div className="w-[850px] p-4">
                    <div className="grid grid-cols-4 gap-6">
                      {sport.groupings.map((grouping) => {
                        return (
                          <div className="space-y-3" key={grouping._id}>
                            <h3 className="border-b pb-1 text-base font-medium">
                              {grouping?.name}
                            </h3>
                            <ScrollArea
                              className="h-[280px] pr-4"
                              scrollHideDelay={0}
                              type="always"
                            >
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
                      <div className="space-y-1.5">
                        <Link
                          href={`/college/football/rankings/${latestFCSTop25?.division}/${latestFCSTop25?.year}/${latestFCSTop25?.week === 999 ? 'final-rankings' : latestFCSTop25?.week}`}
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 text-sm leading-none font-semibold transition-colors outline-none select-none"
                        >
                          FCS College Football Rankings
                        </Link>
                      </div>
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

        {/* Search Button */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-full max-w-[250px] md:max-w-[300px] lg:block lg:max-w-[350px]">
            <SearchBar placeholder="Search articles..." className="w-full" />
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
