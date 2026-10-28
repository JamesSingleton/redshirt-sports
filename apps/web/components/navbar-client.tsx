"use client";

import type {
  GlobalNavigationQueryResult,
  QueryGlobalSeoSettingsResult,
} from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import { Separator } from "@redshirt-sports/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StegaBranded } from "next-sanity";
import { memo, Suspense, use, useCallback, useEffect, useState } from "react";

import { SportMegaPanel } from "@/components/chrome/sport-mega-panel";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import type { Top25RankingsData } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  globalRankingsNavHref,
  SPORT_MEGA_KEY,
  type SportMegaKey,
  sportHasRankingsNav,
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

function useBrand(settingsData: QueryGlobalSeoSettingsResult) {
  return (
    settingsData?.siteBrand ?? settingsData?.siteTitle ?? "Redshirt Sports"
  );
}

const MobileNavbar = memo(function MobileNavbar({
  navbarData,
  settingsData,
  latestRankings,
  menuOpen,
  setMenuOpen,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const brand = useBrand(settingsData);
  const globalRankingsHref = globalRankingsNavHref(latestRankings);

  const close = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="-ml-1 lg:hidden"
        aria-label="Open menu"
        onClick={() => setMenuOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="flex w-[85%] max-w-sm flex-col gap-2 overflow-y-auto p-5"
          aria-label="Site menu"
        >
          <SheetTitle className="sr-only">Site menu</SheetTitle>
          <div className="flex items-center justify-between">
            <Logo
              alt={brand}
              image={settingsData?.logo}
              footerLogo={settingsData?.footerLogo}
              footerLogoDarkMode={settingsData?.footerLogoDarkMode}
              priority
            />
          </div>
          <label className="sr-only" htmlFor="sheet-search">
            Search Redshirt Sports
          </label>
          <div className="relative mt-3">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="sheet-search"
              type="search"
              placeholder="Search Redshirt Sports"
              className="pl-8"
            />
          </div>
          <nav aria-label="Sports" className="divide-y">
            {navbarData.map((sport) => (
              <details key={sport._id} className="group py-1" open>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2.5 font-display text-base font-bold uppercase tracking-wide hover:bg-accent [&::-webkit-details-marker]:hidden">
                  {sportNavLabel(sport.slug, sport.name)}
                  <ChevronDown
                    className="size-4 opacity-60 transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="grid grid-cols-2 gap-1 pb-2 pl-2">
                  <Link
                    href={sportHubPath(sport.slug)}
                    className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                    prefetch={false}
                    onClick={close}
                  >
                    All {sportNavLabel(sport.slug, sport.name)} news
                  </Link>
                  {sportHasRankingsNav(latestRankings, sport.slug) ? (
                    <Link
                      href={sportRankingsIndexPath(sport.slug)}
                      className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                      prefetch={false}
                      onClick={close}
                    >
                      Rankings
                    </Link>
                  ) : null}
                  {sport.groupings.map((grouping) =>
                    grouping?.slug ? (
                      <Link
                        key={grouping._id}
                        href={`/college/${sport.slug}/news/${grouping.slug}`}
                        className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                        prefetch={false}
                        onClick={close}
                      >
                        {grouping.name} news
                      </Link>
                    ) : null,
                  )}
                </div>
              </details>
            ))}
          </nav>
          <Separator />
          <div className="grid gap-1 text-sm">
            <Link
              href="/college/teams"
              className="flex items-center justify-between rounded-md px-2 py-2 font-semibold hover:bg-accent"
              prefetch={false}
              onClick={close}
            >
              All teams A–Z
            </Link>
            {globalRankingsHref ? (
              <Link
                href={globalRankingsHref}
                className="rounded-md px-2 py-2 hover:bg-accent"
                prefetch={false}
                onClick={close}
              >
                Rankings
              </Link>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

const DesktopNavbar = memo(function DesktopNavbar({
  navbarData,
  latestRankings,
  activeMega,
  setActiveMega,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  latestRankings: Top25RankingsData;
  activeMega: SportMegaKey | null;
  setActiveMega: (key: SportMegaKey | null) => void;
}) {
  const globalRankingsHref = globalRankingsNavHref(latestRankings);
  return (
    <div className="hidden min-w-0 flex-1 items-center lg:flex">
      <nav
        className="ml-6 flex flex-1 items-center"
        aria-label="Sports"
        onKeyDown={(e) => {
          if (e.key === "Escape") setActiveMega(null);
        }}
      >
        {navbarData.map((sport) => {
          const megaKey = SPORT_MEGA_KEY[sport.slug];
          if (!megaKey) return null;
          const isOpen = activeMega === megaKey;
          return (
            <button
              key={sport._id}
              type="button"
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2.5 text-sm font-semibold hover:bg-accent hover:text-accent-foreground",
                isOpen ? "text-foreground" : "text-muted-foreground",
              )}
              aria-expanded={isOpen}
              aria-controls={`mega-${megaKey}`}
              onClick={() => setActiveMega(isOpen ? null : megaKey)}
            >
              {sportNavLabel(sport.slug, sport.name)}
              <ChevronDown className="size-3.5 opacity-60" aria-hidden />
            </button>
          );
        })}
        <span className="mx-2 h-5 w-px bg-border" aria-hidden />
        {globalRankingsHref ? (
          <Link
            href={globalRankingsHref}
            className="shrink-0 whitespace-nowrap px-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            prefetch={false}
          >
            Rankings
          </Link>
        ) : null}
        <Link
          href="/college/teams"
          className="shrink-0 whitespace-nowrap px-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          prefetch={false}
        >
          Teams
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <SearchBar
          placeholder="Search Redshirt Sports"
          className="hidden md:flex"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Search"
        >
          <Search className="size-4" />
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
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const isMobile = useIsMobile();
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMega, setActiveMega] = useState<SportMegaKey | null>(null);
  const brand = useBrand(settingsData);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMega(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeSport = navbarData.find(
    (s) => SPORT_MEGA_KEY[s.slug] === activeMega,
  );

  if (isMobile === null) {
    return <NavbarSkeletonResponsive />;
  }

  return (
    <>
      <div className="flex w-full flex-1 items-center gap-3">
        {isMobile ? (
          <MobileNavbar
            navbarData={navbarData}
            settingsData={settingsData}
            latestRankings={latestRankings}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        ) : null}
        <Logo
          alt={brand}
          image={settingsData?.logo}
          footerLogo={settingsData?.footerLogo}
          footerLogoDarkMode={settingsData?.footerLogoDarkMode}
          priority
        />
        {!isMobile ? (
          <DesktopNavbar
            navbarData={navbarData}
            latestRankings={latestRankings}
            activeMega={activeMega}
            setActiveMega={setActiveMega}
          />
        ) : (
          <div className="ml-auto flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <ModeToggle />
          </div>
        )}
      </div>
      {!isMobile && activeMega && activeSport ? (
        <div
          className="absolute inset-x-0 top-full z-40 border-b bg-popover shadow-lg"
          onMouseLeave={() => setActiveMega(null)}
        >
          <div
            id={`mega-${activeMega}`}
            role="region"
            aria-label={`${sportNavLabel(activeSport.slug, activeSport.name)} menu`}
          >
            <SportMegaPanel
              sport={activeSport}
              latestRankings={latestRankings}
              onNavigate={() => setActiveMega(null)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
});

function SkeletonMobileNavbar() {
  return (
    <div className="flex flex-1 justify-end lg:hidden">
      <div className="bg-muted size-9 animate-pulse rounded-md" />
    </div>
  );
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden flex-1 items-center justify-between lg:flex">
      <div className="bg-muted h-9 w-64 animate-pulse rounded-md" />
      <div className="flex gap-2">
        <div className="bg-muted size-9 animate-pulse rounded-md" />
        <div className="bg-muted size-9 animate-pulse rounded-md" />
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

function NavbarClientResolved({
  navbarData,
  settingsData,
  latestRankingsPromise,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankingsPromise: Promise<Top25RankingsData>;
}) {
  const latestRankings = use(latestRankingsPromise);
  return (
    <ClientSideNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings}
    />
  );
}

export function NavbarClient({
  navbarData,
  settingsData,
  latestRankings,
  latestRankingsPromise,
}: {
  navbarData: StegaBranded<GlobalNavigationQueryResult>;
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings?: Top25RankingsData;
  latestRankingsPromise?: Promise<Top25RankingsData>;
}) {
  if (latestRankingsPromise) {
    return (
      <Suspense
        fallback={
          <ClientSideNavbar
            navbarData={navbarData}
            settingsData={settingsData}
            latestRankings={[]}
          />
        }
      >
        <NavbarClientResolved
          navbarData={navbarData}
          settingsData={settingsData}
          latestRankingsPromise={latestRankingsPromise}
        />
      </Suspense>
    );
  }

  return (
    <ClientSideNavbar
      navbarData={navbarData}
      settingsData={settingsData}
      latestRankings={latestRankings ?? []}
    />
  );
}
