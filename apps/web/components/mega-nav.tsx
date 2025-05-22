'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ChevronRight, Search } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@workspace/ui/components/navigation-menu'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@workspace/ui/components/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { useState } from 'react'
// import { SearchInput } from "@/components/search/search-input"
// import { MobileSearch } from "@/components/search/mobile-search"

import SmallLogo from './small-logo'

// Football divisions and conferences data
const footballData = {
  FBS: [
    'ACC',
    'Big 12',
    'Big Ten',
    'Pac-12',
    'SEC',
    'American',
    'Conference USA',
    'MAC',
    'Mountain West',
    'Sun Belt',
    'Independents',
  ],
  FCS: [
    'Big Sky',
    'Big South',
    'CAA',
    'Ivy League',
    'MEAC',
    'Missouri Valley',
    'Northeast',
    'Ohio Valley',
    'Patriot',
    'Pioneer',
    'Southern',
    'Southland',
    'SWAC',
  ],
  DII: [
    'CIAA',
    'G-MAC',
    'GLIAC',
    'GLVC',
    'GMAC',
    'Gulf South',
    'Lone Star',
    'MIAA',
    'Mountain East',
    'NE-10',
    'NSIC',
    'PSAC',
    'RMAC',
    'SAC',
    'SIAC',
  ],
  DIII: [
    'ASC',
    'CCIW',
    'Centennial',
    'Empire 8',
    'HCAC',
    'Liberty League',
    'MAC',
    'MIAA',
    'Middle Atlantic',
    'Midwest',
    'NACC',
    'NESCAC',
    'NEWMAC',
    'NJAC',
    'NWC',
    'OAC',
    'ODAC',
    'PAC',
    'SAA',
    'SCIAC',
    'SCAC',
    'USA South',
  ],
  NAIA: [
    'Appalachian Athletic',
    'Cascade',
    'Frontier',
    'Great Plains Athletic',
    'Heart of America',
    'Kansas Collegiate',
    'Mid-South',
    'North Star Athletic',
    'Sooner Athletic',
    'The Sun',
  ],
}

// Basketball divisions and conferences data
const basketballData = {
  'DI (Power 5)': ['ACC', 'Big 12', 'Big Ten', 'Pac-12', 'SEC'],
  'DI (Mid-Major)': [
    'American',
    'Atlantic 10',
    'Big East',
    'Big Sky',
    'Big South',
    'Big West',
    'CAA',
    'Conference USA',
    'Horizon',
    'Ivy League',
    'MAAC',
    'MAC',
    'MEAC',
    'Missouri Valley',
    'Mountain West',
    'Northeast',
    'Ohio Valley',
    'Patriot',
    'Southern',
    'Southland',
    'Summit League',
    'Sun Belt',
    'SWAC',
    'WAC',
    'WCC',
  ],
  DII: [
    'CACC',
    'CIAA',
    'ECC',
    'G-MAC',
    'GLIAC',
    'GLVC',
    'GMAC',
    'Great Northwest',
    'Gulf South',
    'Lone Star',
    'MIAA',
    'Mountain East',
    'NE-10',
    'NSIC',
    'PacWest',
    'Peach Belt',
    'PSAC',
    'RMAC',
    'SAC',
    'SIAC',
    'SSC',
  ],
  DIII: [
    'AMCC',
    'ASC',
    'Capital Athletic',
    'CCIW',
    'Centennial',
    'Coast-To-Coast',
    'Commonwealth Coast',
    'Empire 8',
    'GNAC',
    'HCAC',
    'Landmark',
    'Liberty League',
    'Little East',
    'MAC Freedom',
    'MAC Commonwealth',
    'MASCAC',
    'MIAA',
    'Midwest',
    'NACC',
    'NESCAC',
    'NEWMAC',
    'NJAC',
    'NWC',
    'OAC',
    'ODAC',
    'PAC',
    'SAA',
    'SCIAC',
    'SCAC',
    'SLIAC',
    'USA South',
    'WIAC',
  ],
  NAIA: [
    'Appalachian Athletic',
    'California Pacific',
    'Cascade',
    'Chicagoland',
    'Crossroads League',
    'Frontier',
    'Golden State Athletic',
    'Great Plains Athletic',
    'Gulf Coast Athletic',
    'Heart of America',
    'Kansas Collegiate',
    'Mid-South',
    'North Star Athletic',
    'Red River Athletic',
    'River States',
    'Sooner Athletic',
    'The Sun',
    'Wolverine-Hoosier',
  ],
}

// Combined data for search functionality
const allConferences = [
  ...Object.entries(footballData).flatMap(([division, conferences]) =>
    conferences.map((conf) => ({ sport: 'Football', division, conference: conf })),
  ),
  ...Object.entries(basketballData).flatMap(([division, conferences]) =>
    conferences.map((conf) => ({ sport: 'Basketball', division, conference: conf })),
  ),
]

export function MegaNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<typeof allConferences>([])
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setSearchResults([])
      return
    }

    const results = allConferences.filter(
      (item) =>
        item.conference.toLowerCase().includes(query.toLowerCase()) ||
        item.division.toLowerCase().includes(query.toLowerCase()) ||
        item.sport.toLowerCase().includes(query.toLowerCase()),
    )

    setSearchResults(results)
  }

  return (
    <header className="bg-background sticky top-0 z-50 w-full border-b shadow-sm">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[400px] p-0">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link
                href="/"
                className="flex items-center space-x-2"
                onClick={() => setMobileOpen(false)}
              >
                <SmallLogo className="h-8 w-auto" />
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            {/* Mobile Search */}
            <div className="border-b p-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsMobileSearchOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search conferences, divisions...
              </Button>
            </div>

            {/* Mobile Search */}
            {/* <MobileSearch isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} /> */}

            {/* Mobile Navigation - Scalable for future sports additions */}
            <div className="h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex flex-col">
                <div className="border-b">
                  <div className="px-4 py-3">
                    <h3 className="font-medium">Sports</h3>
                  </div>
                  <div className="space-y-1 px-2 pb-2">
                    <Collapsible>
                      <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-2 text-left">
                        College Football
                        <ChevronRight className="ui-open:rotate-90 h-4 w-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(footballData).map(([division, conferences]) => (
                          <Collapsible key={division} className="mt-1 ml-4">
                            <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm">
                              {division}
                              <ChevronRight className="ui-open:rotate-90 h-3.5 w-3.5 transition-transform" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="grid grid-cols-2 gap-x-2 p-2">
                                {conferences.map((conference) => (
                                  <Link
                                    key={conference}
                                    href={`/football/${division.toLowerCase()}/${conference.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {conference}
                                  </Link>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-2 text-left">
                        Men's College Basketball
                        <ChevronRight className="ui-open:rotate-90 h-4 w-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(basketballData).map(([division, conferences]) => (
                          <Collapsible key={division} className="mt-1 ml-4">
                            <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm">
                              {division}
                              <ChevronRight className="ui-open:rotate-90 h-3.5 w-3.5 transition-transform" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="grid grid-cols-2 gap-x-2 p-2">
                                {conferences.map((conference) => (
                                  <Link
                                    key={conference}
                                    href={`/basketball/${division.toLowerCase().replace(/\s+|$$|$$/g, '-')}/${conference.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {conference}
                                  </Link>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>

                    <Collapsible>
                      <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-2 text-left">
                        Rankings
                        <ChevronRight className="ui-open:rotate-90 h-4 w-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Collapsible className="mt-1 ml-4">
                          <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm">
                            College Football Rankings
                            <ChevronRight className="ui-open:rotate-90 h-3.5 w-3.5 transition-transform" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex flex-col space-y-1 p-2">
                              <Link
                                href="/rankings/football/fbs"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                FBS College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/fcs"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                FCS College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/dii"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DII College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/diii"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DIII College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/naia"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                NAIA College Football Rankings
                              </Link>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible className="mt-1 ml-4">
                          <CollapsibleTrigger className="hover:bg-accent/50 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm">
                            Men's College Basketball Rankings
                            <ChevronRight className="ui-open:rotate-90 h-3.5 w-3.5 transition-transform" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex flex-col space-y-1 p-2">
                              <Link
                                href="/rankings/basketball/di-power-5"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DI (Power 5) Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/di-mid-major"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DI (Mid Major) Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/dii"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DII Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/diii"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                DIII Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/naia"
                                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                                onClick={() => setMobileOpen(false)}
                              >
                                NAIA Men's College Basketball Rankings
                              </Link>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Placeholder for future sports - demonstrates scalability */}
                    <Button
                      variant="ghost"
                      className="text-muted-foreground w-full justify-between px-2 py-2 font-normal"
                    >
                      <span>
                        Baseball{' '}
                        <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
                          Coming Soon
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground w-full justify-between px-2 py-2 font-normal"
                    >
                      <span>
                        Softball{' '}
                        <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs">
                          Coming Soon
                        </span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </div>
                </div>

                <div className="border-t">
                  <Link
                    href="/news"
                    className="hover:bg-accent flex h-12 items-center border-b px-4 font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    News
                  </Link>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <SmallLogo className="h-8 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>College Football</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[850px] p-4">
                  <div className="grid grid-cols-5 gap-6">
                    {Object.entries(footballData).map(([division, conferences]) => (
                      <div key={division} className="space-y-3">
                        <h3 className="border-b pb-1 text-base font-medium">{division}</h3>
                        <ScrollArea className="h-[280px] pr-4" scrollHideDelay={0} type="always">
                          <div className="space-y-1.5">
                            {conferences.map((conference) => (
                              <Link
                                key={conference}
                                href={`/football/${division.toLowerCase()}/${conference.toLowerCase().replace(/\s+/g, '-')}`}
                                className="hover:text-primary block py-1 text-sm"
                              >
                                {conference}
                              </Link>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Men's College Basketball</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[850px] p-4">
                  <div className="grid grid-cols-5 gap-6">
                    {Object.entries(basketballData).map(([division, conferences]) => (
                      <div key={division} className="space-y-3">
                        <h3 className="border-b pb-1 text-base font-medium">{division}</h3>
                        <ScrollArea className="h-[280px] pr-4" scrollHideDelay={0} type="always">
                          <div className="space-y-1.5">
                            {conferences.map((conference) => (
                              <Link
                                key={conference}
                                href={`/basketball/${division.toLowerCase().replace(/\s+|$$|$$/g, '-')}/${conference.toLowerCase().replace(/\s+/g, '-')}`}
                                className="hover:text-primary block py-1 text-sm"
                              >
                                {conference}
                              </Link>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Rankings</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[600px] p-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="border-b pb-1 text-base font-medium">
                        College Football Rankings
                      </h3>
                      <div className="space-y-1.5">
                        <Link
                          href="/rankings/football/fbs"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          FBS College Football Rankings
                        </Link>
                        <Link
                          href="/rankings/football/fcs"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          FCS College Football Rankings
                        </Link>
                        <Link
                          href="/rankings/football/dii"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          DII College Football Rankings
                        </Link>
                        <Link
                          href="/rankings/football/diii"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          DIII College Football Rankings
                        </Link>
                        <Link
                          href="/rankings/football/naia"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          NAIA College Football Rankings
                        </Link>
                      </div>
                    </div>
                    <div className="space-y-3">
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
                        <Link
                          href="/rankings/basketball/naia"
                          className="hover:text-primary block py-1 text-sm"
                        >
                          NAIA Men's College Basketball Rankings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/news">
                News
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Tablet Navigation - Removed tabs in favor of hamburger menu */}
        <div className="flex-1 md:flex lg:hidden"></div>

        {/* Search Button */}
        {mobileSearchOpen ? (
          // <MobileSearch isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
          <div />
        ) : (
          <>
            {/* Mobile Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Desktop Search Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="ml-auto hidden md:flex">
                  <Search className="h-4 w-4" />
                  <span className="sr-only">Search</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Search</DialogTitle>
                </DialogHeader>
                <div className="mt-2">
                  <form
                    action="/search"
                    method="get"
                    onSubmit={(e) => {
                      const form = e.currentTarget
                      const input = form.querySelector('input') as HTMLInputElement
                      if (!input.value.trim()) {
                        e.preventDefault()
                      }
                    }}
                  >
                    {/* <SearchInput name="q" placeholder="Search articles, teams, conferences..." autoFocus /> */}
                  </form>
                </div>

                {/* Quick Links */}
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium">Popular Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/search?q=football">Football</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/search?q=basketball">Basketball</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/search?q=rankings">Rankings</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/search?q=recruiting">Recruiting</Link>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </header>
  )
}
