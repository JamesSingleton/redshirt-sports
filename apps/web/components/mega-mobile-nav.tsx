'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronDown, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@workspace/ui/components/sheet'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'

import SmallLogo from './small-logo'
import { SearchBar } from './search-bar'

import type { SportsData } from './mega-nav'

export default function MegaMobileNav({
  sportsNav,
  latestFCSTop25,
}: {
  sportsNav: SportsData
  latestFCSTop25: any
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open mobile menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 sm:w-[350px]">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center">
            <SmallLogo className="mr-2 h-6 w-auto" />
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-65px)]">
          <div className="py-2">
            {/* Search in Mobile Menu */}
            <div className="border-b px-4 py-3">
              <SearchBar placeholder="Search articles..." className="w-full" />
            </div>

            {/* Navigation Items */}
            {sportsNav.map((sport) => (
              <Collapsible key={sport._id}>
                <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors">
                  {sport.name}
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-2">
                  {sport.groupings.map((grouping) => (
                    <Collapsible key={grouping._id}>
                      <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                        {grouping.name} ({grouping.conferences.length})
                        <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-1">
                        <div className="mt-1 grid grid-cols-1 gap-0.5">
                          {grouping.conferences.map((conference) => (
                            <Link
                              key={conference._id}
                              href={`/college/${sport.slug}/news/${grouping.slug}/${conference.slug}`}
                              className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
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

            {/* Rankings section */}
            <Collapsible>
              <CollapsibleTrigger className="hover:bg-muted flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors">
                Rankings
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-2">
                <Collapsible>
                  <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                    College Football
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1">
                    <div className="mt-1 grid grid-cols-1 gap-0.5">
                      <Link
                        href={`college/football/rankings/${latestFCSTop25?.division}/${latestFCSTop25?.year}/${latestFCSTop25?.week === 999 ? 'final-rankings' : latestFCSTop25?.week}`}
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        FCS College Football Rankings
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* <Collapsible>
                  <CollapsibleTrigger className="text-muted-foreground hover:bg-muted/50 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                    Men's Basketball
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1">
                    <div className="mt-1 grid grid-cols-1 gap-0.5">
                      <Link
                        href="/rankings/basketball/di-power-5"
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        DI (Power 5)
                      </Link>
                      <Link
                        href="/rankings/basketball/di-mid-major"
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        DI (Mid Major)
                      </Link>
                      <Link
                        href="/rankings/basketball/dii"
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        DII
                      </Link>
                      <Link
                        href="/rankings/basketball/diii"
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        DIII
                      </Link>
                      <Link
                        href="/rankings/basketball/naia"
                        className="hover:bg-muted block rounded px-2 py-1 text-xs transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        NAIA
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible> */}
              </CollapsibleContent>
            </Collapsible>

            {/* News link */}
            <Link
              href="/college/news"
              className="hover:bg-muted flex items-center px-4 py-3 text-base font-medium transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              News
            </Link>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
