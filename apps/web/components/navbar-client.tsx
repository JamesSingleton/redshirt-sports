"use client";

import { formatWeekSegment } from "@redshirt-sports/clients/espn";
import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@redshirt-sports/ui/components/navigation-menu";
import { ScrollArea } from "@redshirt-sports/ui/components/scroll-area";
import { Separator } from "@redshirt-sports/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@redshirt-sports/ui/components/sheet";
import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StegaBranded } from "next-sanity";
import { memo, useEffect, useMemo, useState } from "react";

import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import type { Top25RankingsData } from "./navbar";
import { SearchBar } from "./search-bar";

const BRACKET_CHALLENGE_HREF = "/college/football/bracket-challenge/fcs";

const divisionDisplayNames: Record<string, string> = {
  fbs: "FBS",
  fcs: "FCS",
  d2: "Division II",
  d3: "Division III",
  naia: "NAIA",
  "power-conference": "Power Conference",
  "mid-major": "Mid-Major",
};

type NavbarData = StegaBranded<GlobalNavigationQueryResult>;

const megaLinkClass =
  "hover:bg-accent hover:text-primary focus:bg-accent focus:text-primary flex items-center gap-4 rounded-md px-3 py-2.5 text-sm leading-none font-semibold transition-colors outline-none select-none";

function useFootballRankings(latestRankings: Top25RankingsData) {
  return useMemo(
    () =>
      latestRankings.find((sportData) => sportData.sport === "football")
        ?.divisions || [],
    [latestRankings],
  );
}

function rankingHref(ranking: Top25RankingsData[number]["divisions"][number]) {
  return `/college/football/rankings/${ranking?.division}/${ranking?.year}/${formatWeekSegment(ranking?.week ?? 0)}`;
}

function rankingLabel(ranking: Top25RankingsData[number]["divisions"][number]) {
  const division = ranking?.division;
  return `${division && divisionDisplayNames[division] ? divisionDisplayNames[division] : division} Football Rankings`;
}

/** Hamburger + left sheet, visible below `lg`. */
const MobileNavbar = memo(function MobileNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: NavbarData;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const { siteTitle } = settingsData ?? {};
  const [isOpen, setIsOpen] = useState(false);
  const footballRankings = useFootballRankings(latestRankings);
  const path = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  const close = () => setIsOpen(false);
  const rowLinkClass =
    "hover:bg-muted flex items-center rounded-md px-3 py-2.5 text-base font-semibold transition-colors";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="order-first -ml-2 lg:hidden"
        >
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] max-w-sm gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle>
            <Logo alt={siteTitle} />
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 py-5">
          <SearchBar placeholder="Search articles..." className="w-full" />

          {navbarData.map((sport) => (
            <section key={sport._id} aria-label={sport.name ?? undefined}>
              <h3 className="kicker text-muted-foreground mb-2">
                {sport.name}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {sport.groupings.map((grouping) =>
                  grouping ? (
                    <Link
                      key={grouping._id}
                      href={`/college/${sport.slug}/news/${grouping.slug}`}
                      className="hover:border-primary hover:text-primary rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors"
                      onClick={close}
                      prefetch={false}
                    >
                      {grouping.name}
                    </Link>
                  ) : null,
                )}
              </div>
            </section>
          ))}

          {latestRankings && (
            <section aria-label="Rankings">
              <h3 className="kicker text-muted-foreground mb-2">Rankings</h3>
              <div className="flex flex-col">
                {footballRankings.map((ranking) => (
                  <Link
                    key={`${ranking?.division}-${ranking?.year}-${ranking?.week}-mobile`}
                    href={rankingHref(ranking)}
                    className={rowLinkClass}
                    onClick={close}
                    prefetch={false}
                  >
                    {rankingLabel(ranking)}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section aria-label="More" className="flex flex-col">
            <Link
              href={BRACKET_CHALLENGE_HREF}
              className={rowLinkClass}
              onClick={close}
              prefetch={false}
            >
              Bracket Challenge
            </Link>
            <Link
              href="/college/news"
              className={rowLinkClass}
              onClick={close}
              prefetch={false}
            >
              News
            </Link>
            <Link
              href="/about"
              className={rowLinkClass}
              onClick={close}
              prefetch={false}
            >
              About
            </Link>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
});

/** Sport mega menus + primary links, visible from `lg`. */
export const DesktopNavbar = memo(function DesktopNavbar({
  navbarData,
  latestRankings,
}: {
  navbarData: NavbarData;
  latestRankings: Top25RankingsData;
}) {
  const footballRankings = useFootballRankings(latestRankings);

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {navbarData.map((sport) => (
          <NavigationMenuItem key={sport.slug}>
            <NavigationMenuTrigger className="font-display text-base font-bold tracking-wide uppercase">
              {sport.name}
            </NavigationMenuTrigger>
            <NavigationMenuContent key={sport.slug}>
              <div className="w-[850px] p-4">
                <div className="grid grid-cols-4 gap-6">
                  {sport.groupings.map((grouping) => (
                    <div className="space-y-3" key={grouping?._id}>
                      <h3 className="kicker text-primary border-b pb-2">
                        {grouping?.name}
                      </h3>
                      <ScrollArea
                        className="h-[280px] pr-4"
                        scrollHideDelay={0}
                        type="always"
                      >
                        <div className="space-y-1">
                          {grouping?.conferences.map((conference) => (
                            <Link
                              key={conference._id}
                              href={`/college/${sport.slug}/news/${grouping.slug}/${conference.slug}`}
                              className={megaLinkClass}
                              title={conference.name}
                              prefetch={false}
                            >
                              {conference.shortName ?? conference.name}
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
        ))}

        <NavigationMenuItem aria-hidden="true">
          <Separator orientation="vertical" className="mx-2 h-6" />
        </NavigationMenuItem>

        {latestRankings && (
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-display text-base font-bold tracking-wide uppercase">
              Rankings
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[600px] p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="kicker text-primary border-b pb-2">
                      College Football
                    </h3>
                    <div className="space-y-1">
                      {footballRankings.map((ranking) => (
                        <Link
                          key={`${ranking?.division}-${ranking?.year}-${ranking?.week}`}
                          href={rankingHref(ranking)}
                          className={megaLinkClass}
                          prefetch={false}
                        >
                          {rankingLabel(ranking)}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="kicker text-primary border-b pb-2">
                      Men&apos;s College Basketball
                    </h3>
                    <span className="text-muted-foreground block py-1 text-sm">
                      Coming Soon...
                    </span>
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        )}

        <NavigationMenuItem>
          <NavigationMenuLink
            className={`${navigationMenuTriggerStyle()} font-display text-base font-bold tracking-wide uppercase`}
            href={BRACKET_CHALLENGE_HREF}
          >
            Bracket Challenge
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem className="hidden xl:block">
          <NavigationMenuLink
            className={`${navigationMenuTriggerStyle()} font-display text-base font-bold tracking-wide uppercase`}
            href="/college/news"
          >
            News
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
});

function NavbarActions() {
  return (
    <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/search" prefetch={false} aria-label="Search">
          <Search className="size-5" />
        </Link>
      </Button>
      <div className="hidden md:block">
        <ModeToggle />
      </div>
      <Button
        variant="outline"
        size="sm"
        className="hidden md:inline-flex"
        asChild
      >
        <Link href="/" prefetch={false}>
          Follow teams
        </Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/sign-in" prefetch={false}>
          Sign in
        </Link>
      </Button>
    </div>
  );
}

const ResponsiveNavbar = memo(function ResponsiveNavbar({
  navbarData,
  settingsData,
  latestRankings,
}: {
  navbarData: NavbarData;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  // Fragment: children participate in the header's flex row alongside <Logo />.
  return (
    <>
      <MobileNavbar
        navbarData={navbarData}
        settingsData={settingsData}
        latestRankings={latestRankings}
      />
      <DesktopNavbar navbarData={navbarData} latestRankings={latestRankings} />
      <NavbarActions />
    </>
  );
});

export function NavbarSkeletonResponsive() {
  return (
    <>
      <div className="bg-muted order-first -ml-2 size-10 animate-pulse rounded-md lg:hidden" />
      <div className="hidden items-center gap-2 lg:flex">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`nav-item-skeleton-${index.toString()}`}
            className="bg-muted h-9 w-24 animate-pulse rounded"
          />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`nav-button-skeleton-${index.toString()}`}
            className="bg-muted h-9 w-20 animate-pulse rounded-md"
          />
        ))}
      </div>
    </>
  );
}

export const NavbarClient = ResponsiveNavbar;
