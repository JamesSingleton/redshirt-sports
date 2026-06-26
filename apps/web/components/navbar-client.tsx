"use client";

import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@redshirt-sports/ui/components/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@redshirt-sports/ui/components/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useEffect, useState } from "react";

import { useIsMobile } from "@/hooks/use-is-mobile";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import {
  dropdownNavItems,
  flattenSportNavLinks,
  sportNavConfigs,
  teamsNavLink,
} from "./nav-config";
import {
  MobileNavSection,
  SimpleDropdownPanel,
  SportDropdownPanel,
} from "./nav-menus";
import type { Top25RankingsData } from "./nav-types";
import { SearchBar } from "./search-bar";

const darkNavTriggerClass =
  "inline-flex h-auto w-max items-center justify-center gap-1 rounded-none border-0 bg-transparent px-4 py-4 text-sm font-medium text-brand-surface-foreground/80 shadow-none outline-none transition-colors hover:!bg-white/15 hover:!text-brand-surface-foreground focus:!bg-white/15 focus:!text-brand-surface-foreground focus-visible:ring-0 data-[state=open]:!bg-white/15 data-[state=open]:!text-brand-surface-foreground data-[state=open]:hover:!bg-white/15";

/** Strip default NavigationMenuContent chrome (border, padding, popover bg). */
const darkDropdownContentClass =
  "!mt-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none";

const MobileNavbar = memo(function MobileNavbar({
  settingsData,
  latestRankings,
}: {
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const { siteTitle, logo, footerLogoDarkMode } = settingsData ?? {};
  const sheetLogo = footerLogoDarkMode ?? logo;
  const [isOpen, setIsOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [path]);

  const close = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex justify-end lg:hidden">
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-brand-surface-foreground hover:bg-white/10 hover:text-brand-surface-foreground"
          >
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
      </div>
      <SheetContent className="bg-brand-surface text-brand-surface-foreground border-brand-surface-border w-80 max-w-[85vw] overflow-y-auto p-0">
        <SheetHeader className="border-brand-surface-border border-b px-4 py-4">
          <SheetTitle className="text-left">
            {sheetLogo ? (
              <Logo alt={siteTitle} image={sheetLogo} />
            ) : (
              <span className="text-lg font-semibold">{siteTitle}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="border-brand-surface-border border-b px-4 py-3">
          <SearchBar placeholder="Search articles..." className="w-full" />
        </div>

        <nav aria-label="Mobile navigation">
          <MobileNavSection
            title="Teams"
            links={[teamsNavLink]}
            onNavigate={close}
          />
          {sportNavConfigs.map((config) => (
            <MobileNavSection
              key={config.slug}
              title={config.label.toUpperCase()}
              links={flattenSportNavLinks(config, latestRankings)}
              onNavigate={close}
            />
          ))}
          {dropdownNavItems.map((config) => (
            <MobileNavSection
              key={config.label}
              title={config.label.toUpperCase()}
              links={config.items}
              onNavigate={close}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
});

export const DesktopNavbar = memo(function DesktopNavbar({
  latestRankings,
}: {
  latestRankings: Top25RankingsData;
}) {
  return (
    <div className="hidden grid-cols-[1fr_auto] items-center gap-6 lg:grid">
      <NavigationMenu
        viewport={false}
        className="max-w-none flex-1 justify-start"
        aria-label="Main navigation"
      >
        <NavigationMenuList className="gap-0">
          <NavigationMenuItem>
            <NavigationMenuLink asChild className={darkNavTriggerClass}>
              <Link href={teamsNavLink.href}>{teamsNavLink.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          {sportNavConfigs.map((config) => (
            <NavigationMenuItem key={config.slug}>
              <NavigationMenuTrigger className={darkNavTriggerClass}>
                {config.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className={darkDropdownContentClass}>
                <SportDropdownPanel
                  config={config}
                  latestRankings={latestRankings}
                />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}

          {dropdownNavItems.map((config) => (
            <NavigationMenuItem key={config.label}>
              <NavigationMenuTrigger className={darkNavTriggerClass}>
                {config.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent className={darkDropdownContentClass}>
                <SimpleDropdownPanel config={config} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-3 justify-self-end">
        <SearchBar
          placeholder="Search articles..."
          className="hidden md:block"
        />
        <ModeToggle className="text-brand-surface-foreground hover:bg-white/10 hover:text-brand-surface-foreground" />
      </div>
    </div>
  );
});

const ClientSideNavbar = memo(function ClientSideNavbar({
  settingsData,
  latestRankings,
}: {
  settingsData: QueryGlobalSeoSettingsResult;
  latestRankings: Top25RankingsData;
}) {
  const isMobile = useIsMobile();

  if (isMobile === null) {
    return <NavbarSkeletonResponsive />;
  }

  return (
    <>
      <MobileNavbar
        settingsData={settingsData}
        latestRankings={latestRankings}
      />
      <DesktopNavbar latestRankings={latestRankings} />
    </>
  );
});

function SkeletonMobileNavbar() {
  return (
    <div className="lg:hidden">
      <div className="flex justify-end">
        <div className="h-10 w-10 animate-pulse rounded-md bg-white/10" />
      </div>
    </div>
  );
}

function SkeletonDesktopNavbar() {
  return (
    <div className="hidden w-full grid-cols-[1fr_auto] items-center gap-6 lg:grid">
      <div className="flex max-w-max flex-1 items-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`nav-item-skeleton-${index.toString()}`}
            className="h-10 w-28 animate-pulse rounded bg-white/10"
          />
        ))}
      </div>
      <div className="flex items-center gap-3 justify-self-end">
        <div className="hidden h-10 w-48 animate-pulse rounded bg-white/10 md:block" />
        <div className="h-10 w-10 animate-pulse rounded bg-white/10" />
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

export const NavbarClient = ClientSideNavbar;
