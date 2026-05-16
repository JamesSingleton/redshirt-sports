"use client";

import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@redshirt-sports/ui/components/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@redshirt-sports/ui/components/navigation-menu";
import { ScrollArea } from "@redshirt-sports/ui/components/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@redshirt-sports/ui/components/sheet";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useMemo, useState } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import type { Top25RankingsData } from "./navbar";
import { SearchBar } from "./search-bar";

const divisionDisplayNames: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  naia: "NAIA",
  "power-conference": "Power Conference",
  "mid-major": "Mid-Major",
};

const MobileNavbar = memo(function MobileNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const { siteTitle, logo } = settingsData ?? {};
  const [isOpen, setIsOpen] = useState(false);
  const footballRankings = useMemo(
    () =>
      latestRankings.find((sportData) => sportData.sport === "football")
        ?.divisions || [],
    [latestRankings],
  );

  const path = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-end">
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent className="overflow-y-auto bg-black border-l-0">
        <SheetHeader>
          <SheetTitle>
            {logo && <Logo alt={siteTitle} image={logo} />}
          </SheetTitle>
        </SheetHeader>
        <div className="my-4 flex flex-col gap-4">
          <div className="border-b border-white/20 px-4 py-3">
            <SearchBar placeholder="Search articles..." className="w-full" />
          </div>
          {navbarData.map((sport) => (
            <Collapsible key={sport._id}>
              <CollapsibleTrigger className="hover:bg-white/10 flex w-full items-center justify-between px-4 py-3 text-left font-medium text-white transition-colors">
                {sport.name}
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-2">
                {sport.groupings.map((grouping) => (
                  <Collapsible key={grouping?._id}>
                    <CollapsibleTrigger className="text-white/70 hover:bg-white/5 flex w-full items-center justify-between rounded px-2 py-2 text-left font-medium transition-colors">
                      {grouping?.name} ({grouping?.conferences.length})
                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-1">
                      <div className="mt-1 grid grid-cols-1 gap-0.5">
                        {grouping?.conferences.map((conference) => (
                          <Link
                            key={conference._id}
                            href={`/college/${sport.slug}/news/${grouping.slug}/${conference.slug}`}
                            className="hover:bg-white/10 text-white/80 hover:text-white block rounded px-2 py-1 transition-colors"
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
              <CollapsibleTrigger className="hover:bg-white/10 flex w-full items-center justify-between px-4 py-3 text-left font-medium text-white transition-colors">
                Rankings
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-2">
                {footballRankings && (
                  <Collapsible>
                    <CollapsibleTrigger className="text-white/70 hover:bg-white/5 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                      College Football
                      <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-1">
                      <div className="mt-1 grid grid-cols-1 gap-0.5">
                        {footballRankings.map((ranking: any) => (
                          <Link
                            key={`${ranking?.division}-${ranking?.year}-${ranking?.week}-mobile`}
                            href={`/college/football/rankings/${ranking?.division}/${ranking?.year}/${ranking?.week === 999 ? "final-rankings" : ranking?.week}`}
                            className="hover:bg-white/10 text-white/80 hover:text-white block rounded px-2 py-1 text-xs transition-colors"
                            onClick={() => setIsOpen(false)}
                          >
                            {divisionDisplayNames[ranking?.division] ??
                              ranking?.division}{" "}
                            Football Rankings
                          </Link>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="text-white/70 hover:bg-white/5 flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm font-medium transition-colors">
                    Men&apos;s Basketball
                    <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-2 pb-1">
                    <div className="mt-1 grid grid-cols-1 gap-0.5">
                      <span className="text-white/50 py-1 text-sm">
                        Coming Soon...
                      </span>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Link
            href="/college/news"
            className="hover:bg-white/10 flex items-center px-4 py-3 text-base font-medium text-white transition-colors"
            onClick={() => setIsOpen(false)}
            prefetch={false}
          >
            News
          </Link>
          
          <div className="px-4 pt-4 border-t border-white/20">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white font-semibold">
              <Link href="/subscribe">Subscribe</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

export const DesktopNavbar = memo(function DesktopNavbar({
  navbarData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult;
  latestRankings: Top25RankingsData;
}) {
  const footballRankings = useMemo(
    () =>
      latestRankings.find((sportData) => sportData.sport === "football")
        ?.divisions || [],
    [latestRankings],
  );

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-8">
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {navbarData.map((sport) => (
            <NavigationMenuItem key={sport.slug}>
              <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 focus:bg-white/10 focus:text-white">
                {sport.name}
              </NavigationMenuTrigger>
              <NavigationMenuContent key={sport.slug}>
                <div className="w-[850px] p-4">
                  <div className="grid grid-cols-4 gap-6">
                    {sport.groupings.map((grouping) => {
                      return (
                        <div className="space-y-3" key={grouping?._id}>
                          <h3 className="border-b pb-1 text-base font-bold">
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
                                  prefetch={false}
                                >
                                  {conference.shortName ?? conference.name}
                                </Link>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}

          {latestRankings && (
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-white hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 focus:bg-white/10 focus:text-white">
                Rankings
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[600px] p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {footballRankings && (
                      <div className="space-y-3">
                        <h3 className="border-b pb-1 text-base font-bold">
                          College Football
                        </h3>
                        <div className="space-y-1.5">
                          {footballRankings.map((ranking) => (
                            <Link
                              key={`${ranking?.division}-${ranking?.year}-${ranking?.week}`}
                              href={`/college/football/rankings/${ranking?.division}/${ranking?.year}/${ranking?.week === 999 ? "final-rankings" : ranking?.week}`}
                              className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex items-center gap-4 rounded-md p-3 text-sm leading-none font-semibold transition-colors outline-none select-none"
                            >
                              {ranking?.division &&
                              divisionDisplayNames[ranking.division]
                                ? divisionDisplayNames[ranking.division]
                                : ranking?.division}{" "}
                              Football Rankings
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-3">
                      <h3 className="border-b pb-1 text-base font-bold">
                        Men&apos;s College Basketball
                      </h3>
                      <div className="space-y-1.5">
                        <span className="text-muted-foreground py-1 text-sm">
                          Coming Soon...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}

          <NavigationMenuItem>
            <NavigationMenuLink
              className="bg-transparent text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
              href="/college/news"
            >
              News
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4 justify-self-end">
        <SearchBar placeholder="Search articles..." />
        <Button asChild className="bg-primary hover:bg-primary/90 text-white font-semibold hidden sm:inline-flex">
          <Link href="/subscribe">Subscribe</Link>
        </Button>
        <ModeToggle />
      </div>
    </div>
  );
});

const ClientSideNavbar = memo(function ClientSideNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: GlobalNavigationQueryResult;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const isMobile = useIsMobile();

  // Show skeleton during initial render/hydration to prevent mismatch
  if (isMobile === null) {
    return <NavbarSkeletonResponsive />;
  }

  return isMobile ? (
    <MobileNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  ) : (
    <DesktopNavbar navbarData={navbarData} latestRankings={latestRankings} />
  );
});

function SkeletonMobileNavbar() {
  return (
    <div className="md:hidden">
      <div className="flex justify-end">
        <div className="bg-white/20 h-10 w-10 animate-pulse rounded-md" />
      </div>
    </div>
  );
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden w-full grid-cols-[1fr_auto] items-center gap-8 md:grid">
      <div className="flex max-w-max flex-1 items-center justify-center gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`nav-item-skeleton-${index.toString()}`}
            className="bg-white/20 h-10 w-32 animate-pulse rounded"
          />
        ))}
      </div>

      <div className="justify-self-end">
        <div className="flex items-center gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`nav-button-skeleton-${index.toString()}`}
              className="bg-white/20 h-10 w-32 animate-pulse rounded-[10px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function NavbarSkeletonResponsive() {
  return (
    <>
      <SkeletonMobileNavbar />
      <SkeletonDesktopNavbar />
    </>
  );
}

// Export the client navbar directly - now SSR-friendly with proper hydration handling
export const NavbarClient = ClientSideNavbar;
