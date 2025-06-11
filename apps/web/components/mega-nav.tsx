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

export interface Conference {
  _id: string
  name: string
  slug: string
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
      <div className="container flex h-16 items-center">
        {/* Mobile Menu Trigger */}

        {/* Logo */}
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <SmallLogo className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
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
                                    className="hover:text-primary block py-1 text-sm"
                                  >
                                    {conference?.name}
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
                          href={`college/football/rankings/${latestFCSTop25?.division}/${latestFCSTop25?.year}/${latestFCSTop25?.week === 999 ? 'final-rankings' : latestFCSTop25?.week}`}
                          className="hover:text-primary block py-1 text-sm"
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
        <div className="ml-auto flex items-center">
          <div className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px] lg:max-w-[350px]">
            <SearchBar placeholder="Search..." className="w-full" />
          </div>
        </div>
      </div>
    </header>
  )
}
