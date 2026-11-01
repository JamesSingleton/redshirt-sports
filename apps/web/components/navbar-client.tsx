"use client";

import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import { Input } from "@redshirt-sports/ui/components/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@redshirt-sports/ui/components/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  memo,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ColumnMenuContent,
  columnLinks,
} from "@/components/chrome/link-column-panel";
import {
  RankingsMenuContent,
  rankingsMenuSports,
} from "@/components/chrome/rankings-menu-panel";
import {
  SportMenuContent,
  sportMenuLabel,
} from "@/components/chrome/sport-mega-panel";
import { Logo } from "@/components/logo";
import { ModeToggle } from "@/components/mode-toggle";
import type { NavbarItem, NavbarItems } from "@/components/navbar";
import { SearchBar } from "@/components/search-bar";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { pollLatestPath } from "@/lib/rankings/poll-paths";
import {
  navPollLabel,
  sportHubPath,
  sportNavLabel,
  sportRankingsIndexPath,
} from "@/lib/sport-nav";

function useBrand(settingsData: QueryGlobalSeoSettingsResult) {
  return (
    settingsData?.siteBrand ?? settingsData?.siteTitle ?? "Redshirt Sports"
  );
}

/** Top-level text for a nav item. */
export function navItemLabel(item: NavbarItem): string {
  switch (item._type) {
    case "navSportMenu":
      return sportMenuLabel(item);
    case "navRankingsMenu":
      return item.label;
    case "navbarColumn":
      return item.title ?? "";
    case "navbarLink":
      return item.name ?? "";
  }
}

/** Items that open a dropdown panel (and have something to show in it). */
export function navItemHasPanel(item: NavbarItem): boolean {
  switch (item._type) {
    case "navSportMenu":
      return true;
    case "navRankingsMenu":
      return rankingsMenuSports(item).length > 0;
    case "navbarColumn":
      return columnLinks(item).length > 0;
    case "navbarLink":
      return false;
  }
}

/** Dropdown body for an item (shadcn NavigationMenu content). */
export function NavMenuContent({ item }: { item: NavbarItem }) {
  switch (item._type) {
    case "navSportMenu":
      return <SportMenuContent item={item} />;
    case "navRankingsMenu":
      return <RankingsMenuContent item={item} />;
    case "navbarColumn":
      return <ColumnMenuContent item={item} />;
    case "navbarLink":
      return null;
  }
}

const topLevelClass =
  "bg-transparent px-2.5 font-semibold text-muted-foreground hover:text-foreground data-[state=open]:text-foreground";

const mobileLinkClass = "rounded-md px-2 py-2 text-sm hover:bg-accent";

function MobileSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="group py-1" open>
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2.5 font-display text-base font-bold uppercase tracking-wide hover:bg-accent [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown
          className="size-4 opacity-60 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="grid grid-cols-2 gap-1 pb-2 pl-2">{children}</div>
    </details>
  );
}

function MobileNavItem({
  item,
  onNavigate,
}: {
  item: NavbarItem;
  onNavigate: () => void;
}) {
  switch (item._type) {
    case "navSportMenu": {
      const { sport } = item;
      const label = sportMenuLabel(item);
      return (
        <MobileSection label={label}>
          <Link
            href={sportHubPath(sport.slug)}
            className={mobileLinkClass}
            prefetch={false}
            onClick={onNavigate}
          >
            All {label} news
          </Link>
          {(sport.polls ?? []).length > 0 ? (
            <Link
              href={sportRankingsIndexPath(sport.slug)}
              className={mobileLinkClass}
              prefetch={false}
              onClick={onNavigate}
            >
              Rankings
            </Link>
          ) : null}
          {(item.divisions ?? []).map((division) =>
            division.slug ? (
              <Link
                key={division._id}
                href={`/college/${sport.slug}/news/${division.slug}`}
                className={mobileLinkClass}
                prefetch={false}
                onClick={onNavigate}
              >
                {division.name} news
              </Link>
            ) : null,
          )}
        </MobileSection>
      );
    }
    case "navRankingsMenu": {
      const sports = rankingsMenuSports(item);
      if (sports.length === 0) return null;
      return (
        <MobileSection label={item.label}>
          {sports.flatMap((sport) =>
            sport.polls.map((poll) => (
              <Link
                key={`${sport._id}-${poll._key}`}
                href={pollLatestPath(sport.slug, poll.slug)}
                className={mobileLinkClass}
                prefetch={false}
                onClick={onNavigate}
              >
                {sports.length > 1
                  ? `${sportNavLabel(sport.slug, sport.name)} ${navPollLabel(poll)}`
                  : navPollLabel(poll)}{" "}
                Top 25
              </Link>
            )),
          )}
        </MobileSection>
      );
    }
    case "navbarColumn": {
      const links = columnLinks(item);
      if (links.length === 0) return null;
      return (
        <MobileSection label={item.title ?? ""}>
          {links.map((link) => (
            <Link
              key={link._key}
              href={link.href}
              className={mobileLinkClass}
              prefetch={false}
              onClick={onNavigate}
              {...(link.openInNewTab
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.name}
            </Link>
          ))}
        </MobileSection>
      );
    }
    case "navbarLink":
      return item.href ? (
        <Link
          href={item.href}
          className="flex items-center justify-between rounded-md px-2 py-2.5 font-display text-base font-bold uppercase tracking-wide hover:bg-accent"
          prefetch={false}
          onClick={onNavigate}
          {...(item.openInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {item.name}
        </Link>
      ) : null;
  }
}

const MobileNavbar = memo(function MobileNavbar({
  items,
  settingsData,
  menuOpen,
  setMenuOpen,
}: {
  items: NavbarItems;
  settingsData: QueryGlobalSeoSettingsResult;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const brand = useBrand(settingsData);
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
          <nav aria-label="Site" className="divide-y">
            {items.map((item) => (
              <MobileNavItem key={item._key} item={item} onNavigate={close} />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
});

/**
 * Desktop nav on shadcn's NavigationMenu: compact dropdowns sized to their
 * content, with Radix handling hover intent, focus, and keyboard.
 */
const DesktopNavbar = memo(function DesktopNavbar({
  items,
}: {
  items: NavbarItems;
}) {
  return (
    <div className="hidden min-w-0 flex-1 items-center lg:flex">
      <NavigationMenu className="ml-4" aria-label="Site" viewport={false}>
        <NavigationMenuList className="gap-0.5">
          {items.map((item) => {
            if (item._type === "navbarLink") {
              return item.href ? (
                <NavigationMenuItem key={item._key}>
                  <NavigationMenuLink
                    asChild
                    className={cn(navigationMenuTriggerStyle(), topLevelClass)}
                  >
                    <Link
                      href={item.href}
                      prefetch={false}
                      {...(item.openInNewTab
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null;
            }
            if (!navItemHasPanel(item)) return null;
            return (
              <NavigationMenuItem key={item._key}>
                <NavigationMenuTrigger className={topLevelClass}>
                  {navItemLabel(item)}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <NavMenuContent item={item} />
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
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

function CloseMenuOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const path = usePathname();
  useEffect(() => {
    onNavigate();
  }, [path, onNavigate]);
  return null;
}

export const NavbarClient = memo(function NavbarClient({
  items,
  settingsData,
}: {
  items: NavbarItems;
  settingsData: QueryGlobalSeoSettingsResult;
}) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const brand = useBrand(settingsData);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  if (isMobile === null) {
    return <NavbarSkeletonResponsive />;
  }

  return (
    <>
      <Suspense fallback={null}>
        <CloseMenuOnNavigate onNavigate={closeMenu} />
      </Suspense>
      <div className="flex w-full flex-1 items-center gap-3">
        {isMobile ? (
          <MobileNavbar
            items={items}
            settingsData={settingsData}
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
          <DesktopNavbar items={items} />
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
