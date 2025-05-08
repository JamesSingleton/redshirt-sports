"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronRight, Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@workspace/ui/components/collapsible"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@workspace/ui/components/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { useState } from "react"
// import { SearchInput } from "@/components/search/search-input"
// import { MobileSearch } from "@/components/search/mobile-search"

import SmallLogo from './small-logo'

// Football divisions and conferences data
const footballData = {
  FBS: [
    "ACC",
    "Big 12",
    "Big Ten",
    "Pac-12",
    "SEC",
    "American",
    "Conference USA",
    "MAC",
    "Mountain West",
    "Sun Belt",
    "Independents",
  ],
  FCS: [
    "Big Sky",
    "Big South",
    "CAA",
    "Ivy League",
    "MEAC",
    "Missouri Valley",
    "Northeast",
    "Ohio Valley",
    "Patriot",
    "Pioneer",
    "Southern",
    "Southland",
    "SWAC",
  ],
  DII: [
    "CIAA",
    "G-MAC",
    "GLIAC",
    "GLVC",
    "GMAC",
    "Gulf South",
    "Lone Star",
    "MIAA",
    "Mountain East",
    "NE-10",
    "NSIC",
    "PSAC",
    "RMAC",
    "SAC",
    "SIAC",
  ],
  DIII: [
    "ASC",
    "CCIW",
    "Centennial",
    "Empire 8",
    "HCAC",
    "Liberty League",
    "MAC",
    "MIAA",
    "Middle Atlantic",
    "Midwest",
    "NACC",
    "NESCAC",
    "NEWMAC",
    "NJAC",
    "NWC",
    "OAC",
    "ODAC",
    "PAC",
    "SAA",
    "SCIAC",
    "SCAC",
    "USA South",
  ],
  NAIA: [
    "Appalachian Athletic",
    "Cascade",
    "Frontier",
    "Great Plains Athletic",
    "Heart of America",
    "Kansas Collegiate",
    "Mid-South",
    "North Star Athletic",
    "Sooner Athletic",
    "The Sun",
  ],
}

// Basketball divisions and conferences data
const basketballData = {
  "DI (Power 5)": ["ACC", "Big 12", "Big Ten", "Pac-12", "SEC"],
  "DI (Mid-Major)": [
    "American",
    "Atlantic 10",
    "Big East",
    "Big Sky",
    "Big South",
    "Big West",
    "CAA",
    "Conference USA",
    "Horizon",
    "Ivy League",
    "MAAC",
    "MAC",
    "MEAC",
    "Missouri Valley",
    "Mountain West",
    "Northeast",
    "Ohio Valley",
    "Patriot",
    "Southern",
    "Southland",
    "Summit League",
    "Sun Belt",
    "SWAC",
    "WAC",
    "WCC",
  ],
  DII: [
    "CACC",
    "CIAA",
    "ECC",
    "G-MAC",
    "GLIAC",
    "GLVC",
    "GMAC",
    "Great Northwest",
    "Gulf South",
    "Lone Star",
    "MIAA",
    "Mountain East",
    "NE-10",
    "NSIC",
    "PacWest",
    "Peach Belt",
    "PSAC",
    "RMAC",
    "SAC",
    "SIAC",
    "SSC",
  ],
  DIII: [
    "AMCC",
    "ASC",
    "Capital Athletic",
    "CCIW",
    "Centennial",
    "Coast-To-Coast",
    "Commonwealth Coast",
    "Empire 8",
    "GNAC",
    "HCAC",
    "Landmark",
    "Liberty League",
    "Little East",
    "MAC Freedom",
    "MAC Commonwealth",
    "MASCAC",
    "MIAA",
    "Midwest",
    "NACC",
    "NESCAC",
    "NEWMAC",
    "NJAC",
    "NWC",
    "OAC",
    "ODAC",
    "PAC",
    "SAA",
    "SCIAC",
    "SCAC",
    "SLIAC",
    "USA South",
    "WIAC",
  ],
  NAIA: [
    "Appalachian Athletic",
    "California Pacific",
    "Cascade",
    "Chicagoland",
    "Crossroads League",
    "Frontier",
    "Golden State Athletic",
    "Great Plains Athletic",
    "Gulf Coast Athletic",
    "Heart of America",
    "Kansas Collegiate",
    "Mid-South",
    "North Star Athletic",
    "Red River Athletic",
    "River States",
    "Sooner Athletic",
    "The Sun",
    "Wolverine-Hoosier",
  ],
}

// Combined data for search functionality
const allConferences = [
  ...Object.entries(footballData).flatMap(([division, conferences]) =>
    conferences.map((conf) => ({ sport: "Football", division, conference: conf })),
  ),
  ...Object.entries(basketballData).flatMap(([division, conferences]) =>
    conferences.map((conf) => ({ sport: "Basketball", division, conference: conf })),
  ),
]

export function MegaNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<typeof allConferences>([])
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  // Handle search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim() === "") {
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
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
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
              <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
                <SmallLogo
                  className="h-8 w-auto"
                />
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            {/* Mobile Search */}
            <div className="border-b p-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsMobileSearchOpen(true)}>
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
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent/50">
                        College Football
                        <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(footballData).map(([division, conferences]) => (
                          <Collapsible key={division} className="ml-4 mt-1">
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50">
                              {division}
                              <ChevronRight className="h-3.5 w-3.5 transition-transform ui-open:rotate-90" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="grid grid-cols-2 gap-x-2 p-2">
                                {conferences.map((conference) => (
                                  <Link
                                    key={conference}
                                    href={`/football/${division.toLowerCase()}/${conference.toLowerCase().replace(/\s+/g, "-")}`}
                                    className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
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
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent/50">
                        Men's College Basketball
                        <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(basketballData).map(([division, conferences]) => (
                          <Collapsible key={division} className="ml-4 mt-1">
                            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50">
                              {division}
                              <ChevronRight className="h-3.5 w-3.5 transition-transform ui-open:rotate-90" />
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="grid grid-cols-2 gap-x-2 p-2">
                                {conferences.map((conference) => (
                                  <Link
                                    key={conference}
                                    href={`/basketball/${division.toLowerCase().replace(/\s+|$$|$$/g, "-")}/${conference.toLowerCase().replace(/\s+/g, "-")}`}
                                    className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
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
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent/50">
                        Rankings
                        <ChevronRight className="h-4 w-4 transition-transform ui-open:rotate-90" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <Collapsible className="ml-4 mt-1">
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50">
                            College Football Rankings
                            <ChevronRight className="h-3.5 w-3.5 transition-transform ui-open:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex flex-col p-2 space-y-1">
                              <Link
                                href="/rankings/football/fbs"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                FBS College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/fcs"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                FCS College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/dii"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DII College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/diii"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DIII College Football Rankings
                              </Link>
                              <Link
                                href="/rankings/football/naia"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                NAIA College Football Rankings
                              </Link>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible className="ml-4 mt-1">
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50">
                            Men's College Basketball Rankings
                            <ChevronRight className="h-3.5 w-3.5 transition-transform ui-open:rotate-90" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex flex-col p-2 space-y-1">
                              <Link
                                href="/rankings/basketball/di-power-5"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DI (Power 5) Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/di-mid-major"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DI (Mid Major) Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/dii"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DII Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/diii"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                onClick={() => setMobileOpen(false)}
                              >
                                DIII Men's College Basketball Rankings
                              </Link>
                              <Link
                                href="/rankings/basketball/naia"
                                className="rounded-md px-2 py-1.5 text-sm hover:bg-accent"
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
                      className="w-full justify-between px-2 py-2 font-normal text-muted-foreground"
                    >
                      <span>
                        Baseball <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">Coming Soon</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-2 py-2 font-normal text-muted-foreground"
                    >
                      <span>
                        Softball <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-xs">Coming Soon</span>
                      </span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </Button>
                  </div>
                </div>

                <div className="border-t">
                  <Link
                    href="/news"
                    className="flex h-12 items-center border-b px-4 font-medium hover:bg-accent"
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
        <Link href="/" className="flex items-center space-x-2 mr-4">
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
                        <h3 className="text-base font-medium border-b pb-1">{division}</h3>
                        <ScrollArea className="h-[280px] pr-4" scrollHideDelay={0} type="always">
                          <div className="space-y-1.5">
                            {conferences.map((conference) => (
                              <Link
                                key={conference}
                                href={`/football/${division.toLowerCase()}/${conference.toLowerCase().replace(/\s+/g, "-")}`}
                                className="block text-sm py-1 hover:text-primary"
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
                        <h3 className="text-base font-medium border-b pb-1">{division}</h3>
                        <ScrollArea className="h-[280px] pr-4" scrollHideDelay={0} type="always">
                          <div className="space-y-1.5">
                            {conferences.map((conference) => (
                              <Link
                                key={conference}
                                href={`/basketball/${division.toLowerCase().replace(/\s+|$$|$$/g, "-")}/${conference.toLowerCase().replace(/\s+/g, "-")}`}
                                className="block text-sm py-1 hover:text-primary"
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
                      <h3 className="text-base font-medium border-b pb-1">College Football Rankings</h3>
                      <div className="space-y-1.5">
                        <Link href="/rankings/football/fbs" className="block text-sm py-1 hover:text-primary">
                          FBS College Football Rankings
                        </Link>
                        <Link href="/rankings/football/fcs" className="block text-sm py-1 hover:text-primary">
                          FCS College Football Rankings
                        </Link>
                        <Link href="/rankings/football/dii" className="block text-sm py-1 hover:text-primary">
                          DII College Football Rankings
                        </Link>
                        <Link href="/rankings/football/diii" className="block text-sm py-1 hover:text-primary">
                          DIII College Football Rankings
                        </Link>
                        <Link href="/rankings/football/naia" className="block text-sm py-1 hover:text-primary">
                          NAIA College Football Rankings
                        </Link>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-base font-medium border-b pb-1">Men's College Basketball Rankings</h3>
                      <div className="space-y-1.5">
                        <Link href="/rankings/basketball/di-power-5" className="block text-sm py-1 hover:text-primary">
                          DI (Power 5) Men's College Basketball Rankings
                        </Link>
                        <Link
                          href="/rankings/basketball/di-mid-major"
                          className="block text-sm py-1 hover:text-primary"
                        >
                          DI (Mid Major) Men's College Basketball Rankings
                        </Link>
                        <Link href="/rankings/basketball/dii" className="block text-sm py-1 hover:text-primary">
                          DII Men's College Basketball Rankings
                        </Link>
                        <Link href="/rankings/basketball/diii" className="block text-sm py-1 hover:text-primary">
                          DIII Men's College Basketball Rankings
                        </Link>
                        <Link href="/rankings/basketball/naia" className="block text-sm py-1 hover:text-primary">
                          NAIA Men's College Basketball Rankings
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link href="/news" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>News</NavigationMenuLink>
              </Link>
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
            <Button variant="ghost" size="icon" className="md:hidden ml-auto" onClick={() => setMobileSearchOpen(true)}>
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Desktop Search Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="hidden md:flex ml-auto">
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
                      const input = form.querySelector("input") as HTMLInputElement
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
