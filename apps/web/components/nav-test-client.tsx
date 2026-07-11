"use client";

import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
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
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@redshirt-sports/ui/components/sheet";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";
import CustomImage from "./sanity-image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavSubItem {
  label: string;
  description?: string;
  href: string;
}

interface NavSection {
  heading?: string;
  items: NavSubItem[];
}

interface FeaturedCard {
  label: string;
  description: string;
  href: string;
}

interface MegaMenuConfig {
  label: string;
  columns: NavSection[];
  featured?: FeaturedCard;
}

const darkNavTriggerClass = cn(
  "h-auto rounded-none bg-transparent py-5 text-sm font-medium text-brand-surface-muted shadow-none transition-colors",
  "hover:bg-brand-surface-foreground/10 hover:text-brand-surface-foreground",
  "data-popup-open:bg-brand-surface-foreground/10 data-popup-open:text-brand-surface-foreground",
  "focus:bg-brand-surface-foreground/10 focus:text-brand-surface-foreground focus-visible:ring-0",
);

const darkDropdownContentClass =
  "!mt-0 !rounded-none !border-0 !bg-transparent !p-0 !shadow-none";

const navigationMenuClassName = cn(
  "relative w-full max-w-none",
  "[&>div.absolute]:left-0 [&>div.absolute]:w-full [&>div.absolute]:justify-start",
  "**:data-[slot=navigation-menu-viewport]:mt-0 **:data-[slot=navigation-menu-viewport]:rounded-none **:data-[slot=navigation-menu-viewport]:border-x-0 **:data-[slot=navigation-menu-viewport]:border-t **:data-[slot=navigation-menu-viewport]:border-brand-surface-border **:data-[slot=navigation-menu-viewport]:bg-brand-surface **:data-[slot=navigation-menu-viewport]:text-brand-surface-foreground **:data-[slot=navigation-menu-viewport]:shadow-2xl",
);

// ── Nav data ──────────────────────────────────────────────────────────────────

const FOOTBALL_MENU: MegaMenuConfig = {
  label: "Football",
  columns: [
    {
      heading: "News by Division",
      items: [
        {
          label: "All Football News",
          description: "Latest college football coverage",
          href: "/college/football/news",
        },
        {
          label: "Division I – FBS",
          description: "Top-level FBS programs",
          href: "/college/football/news/fbs",
        },
        {
          label: "Division I – FCS",
          description: "FCS programs & playoffs",
          href: "/college/football/news/fcs",
        },
        {
          label: "Division II",
          description: "D-II football news & updates",
          href: "/college/football/news/division-ii",
        },
        {
          label: "Division III",
          description: "D-III football coverage",
          href: "/college/football/news/division-iii",
        },
        {
          label: "NAIA",
          description: "NAIA football news",
          href: "/college/football/news/naia",
        },
      ],
    },
    {
      heading: "Rankings",
      items: [
        {
          label: "FBS Top 25 Poll",
          description: "Weekly FBS rankings",
          href: "/college/football/rankings/fbs/2025/preseason",
        },
        {
          label: "FCS Top 25 Poll",
          description: "Weekly FCS rankings",
          href: "/college/football/rankings/fcs/2025/preseason",
        },
      ],
    },
    {
      heading: "Recruiting",
      items: [
        {
          label: "Football Recruiting",
          description: "Prospect news & commitments",
          href: "/recruiting",
        },
        {
          label: "Recruits",
          description: "Search prospect database",
          href: "/recruiting/players",
        },
      ],
    },
  ],
  featured: {
    label: "Transfer Portal",
    description: "Track every football transfer in real time",
    href: "/transfer-portal/wire/football/2025",
  },
};

const BASKETBALL_MENU: MegaMenuConfig = {
  label: "Basketball",
  columns: [
    {
      heading: "Men's Basketball",
      items: [
        {
          label: "All Men's Basketball",
          description: "Latest coverage",
          href: "/college/mens-basketball/news",
        },
        {
          label: "Division I – Power Conference",
          description: "Big-conference hoops",
          href: "/college/mens-basketball/news/power-conference",
        },
        {
          label: "Division I – Mid-Major",
          description: "Mid-major storylines",
          href: "/college/mens-basketball/news/mid-major",
        },
        {
          label: "Division II",
          description: "D-II men's basketball",
          href: "/college/mens-basketball/news/division-ii",
        },
        {
          label: "Men's Top 25",
          description: "Weekly poll & rankings",
          href: "/college/mens-basketball/rankings/division-i/2025/preseason",
        },
      ],
    },
    {
      heading: "Women's Basketball",
      items: [
        {
          label: "All Women's Basketball",
          description: "Latest coverage",
          href: "/college/womens-basketball/news",
        },
        {
          label: "Division I – Power Conference",
          description: "Big-conference hoops",
          href: "/college/womens-basketball/news/power-conference",
        },
        {
          label: "Division I – Mid-Major",
          description: "Mid-major storylines",
          href: "/college/womens-basketball/news/mid-major",
        },
        {
          label: "Division II",
          description: "D-II women's basketball",
          href: "/college/womens-basketball/news/division-ii",
        },
        {
          label: "Women's Top 25",
          description: "Weekly poll & rankings",
          href: "/college/womens-basketball/rankings/division-i/2025/preseason",
        },
      ],
    },
  ],
  featured: {
    label: "Basketball Recruiting",
    description: "Top prospects, commitments and class rankings",
    href: "/recruiting/basketball",
  },
};

const TRANSFER_PORTAL_MENU: MegaMenuConfig = {
  label: "Transfer Portal",
  columns: [
    {
      heading: "Portal Hub",
      items: [
        {
          label: "Transfer Portal News",
          description: "Breaking portal news",
          href: "/transfer-portal/news",
        },
        {
          label: "NCAA Transfer Portal",
          description: "Live tracker & wire",
          href: "/transfer-portal/wire/football/2025",
        },
        {
          label: "Transfer Portal Rankings",
          description: "Player & class rankings",
          href: "/transfer-portal/rankings",
        },
        {
          label: "Transfer Portal Team Rankings",
          description: "Team-by-team grade",
          href: "/transfer-portal/team-rankings",
        },
      ],
    },
  ],
};

const RECRUITING_MENU: MegaMenuConfig = {
  label: "Recruiting",
  columns: [
    {
      heading: "Recruiting",
      items: [
        {
          label: "Football Recruiting",
          description: "Top prospects & commitments",
          href: "/recruiting",
        },
        {
          label: "Basketball Recruiting",
          description: "Hoops recruiting coverage",
          href: "/recruiting/basketball",
        },
        {
          label: "Recruits",
          description: "Search prospect database",
          href: "/recruiting/players",
        },
      ],
    },
  ],
};

const MEGA_MENUS = [
  FOOTBALL_MENU,
  BASKETBALL_MENU,
  TRANSFER_PORTAL_MENU,
  RECRUITING_MENU,
] as const;

// ── Desktop mega-menu content ─────────────────────────────────────────────────

function MegaMenuContent({ config }: { config: MegaMenuConfig }) {
  const colCount = config.columns.length + (config.featured ? 1 : 0);

  return (
    <div
      className="grid w-full justify-items-start gap-x-8"
      style={{ gridTemplateColumns: `repeat(${colCount}, minmax(160px, 1fr))` }}
      role="menu"
      aria-label={`${config.label} navigation`}
    >
      {config.columns.map((col) => (
        <div key={col.heading} className="flex w-full flex-col items-start">
          {col.heading ? (
            <p className="mb-0.5 px-2 pt-0.5 pb-1 text-left text-[10px] font-semibold tracking-widest text-brand-surface-muted uppercase">
              {col.heading}
            </p>
          ) : null}
          {col.items.map((item) => (
            <NavigationMenuLink
              key={item.href}
              className="w-full items-start"
              render={
                <Link
                  href={item.href}
                  className="group/link flex w-full flex-col items-start gap-0.5 rounded px-2 py-2 text-left transition-colors hover:bg-brand-surface-foreground/8"
                  role="menuitem"
                />
              }
            >
              <span className="text-sm leading-snug font-medium text-brand-surface-foreground/85 group-hover/link:text-brand-surface-foreground">
                {item.label}
              </span>
              {item.description ? (
                <span className="text-xs leading-snug text-brand-surface-muted group-hover/link:text-brand-surface-foreground/55">
                  {item.description}
                </span>
              ) : null}
            </NavigationMenuLink>
          ))}
        </div>
      ))}

      {config.featured ? (
        <div className="flex w-full flex-col items-start">
          <p className="mb-0.5 px-2 pt-0.5 pb-1 text-left text-[10px] font-semibold tracking-widest text-brand-surface-muted uppercase">
            More
          </p>
          <NavigationMenuLink
            className="w-full items-start"
            render={
              <Link
                href={config.featured.href}
                className="flex w-full flex-col items-start gap-1 rounded-lg border border-brand-surface-border bg-brand-surface-foreground/6 p-3 text-left transition-colors hover:bg-brand-surface-foreground/10"
                role="menuitem"
              />
            }
          >
            <span className="text-sm font-semibold text-brand-surface-foreground">
              {config.featured.label}
            </span>
            <span className="text-xs leading-snug text-brand-surface-muted">
              {config.featured.description}
            </span>
          </NavigationMenuLink>
        </div>
      ) : null}
    </div>
  );
}

// ── Mobile collapsible section ────────────────────────────────────────────────

function MobileSimpleLink({ label, href }: { label: string; href: string }) {
  return (
    <div className="border-b border-brand-surface-border">
      <SheetClose
        nativeButton={false}
        render={
          <Link
            href={href}
            className="flex w-full items-center justify-between px-5 py-4 text-[15px] font-medium text-brand-surface-foreground transition-colors hover:text-brand-surface-muted"
          />
        }
      >
        {label}
      </SheetClose>
    </div>
  );
}

function MobileCollapsibleSection({ config }: { config: MegaMenuConfig }) {
  return (
    <Collapsible>
      <div className="border-b border-brand-surface-border">
        <CollapsibleTrigger className="group/collapsible flex w-full items-center justify-between px-5 py-4 text-[15px] font-medium text-brand-surface-foreground transition-colors hover:text-brand-surface-muted">
          <span>{config.label}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-brand-surface-muted transition-transform duration-200 group-data-open/collapsible:rotate-180"
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <div className="bg-brand-surface-foreground/3 px-3 pb-3">
            {config.columns.map((col) => (
              <div key={col.heading}>
                {col.heading && config.columns.length > 1 ? (
                  <p className="px-2 pt-3 pb-1 text-[10px] font-semibold tracking-widest text-brand-surface-muted uppercase">
                    {col.heading}
                  </p>
                ) : null}
                {col.items.map((item) => (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className="flex flex-col gap-0.5 rounded px-2 py-2.5 transition-colors hover:bg-brand-surface-foreground/6"
                      />
                    }
                  >
                    <span className="text-sm font-medium text-brand-surface-foreground/85">
                      {item.label}
                    </span>
                    {item.description ? (
                      <span className="text-xs text-brand-surface-muted">
                        {item.description}
                      </span>
                    ) : null}
                  </SheetClose>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

function NavLogoMark({
  siteTitle,
  image,
}: {
  siteTitle?: string | null;
  image?: NonNullable<QueryGlobalSeoSettingsResult>["logo"];
}) {
  if (image) {
    return (
      <CustomImage
        image={image}
        width={70}
        height={40}
        className="h-5 w-auto"
        priority
        quality={100}
      />
    );
  }

  return (
    <span className="text-lg font-semibold">
      {siteTitle ?? "Redshirt Sports"}
    </span>
  );
}

export function NavTestClient({
  settingsData,
}: {
  settingsData: QueryGlobalSeoSettingsResult;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [_searchOpen, _setSearchOpen] = useState(false);
  const { siteTitle, logo, footerLogoDarkMode } = settingsData ?? {};
  const headerLogo = footerLogoDarkMode ?? logo;
  const homeLabel = siteTitle
    ? `${siteTitle} – go to homepage`
    : "Go to homepage";

  return (
    <>
      <header className="sticky top-0 z-50 bg-brand-surface text-brand-surface-foreground">
        <NavigationMenu
          className={navigationMenuClassName}
          aria-label="Main navigation"
        >
          <div className="container flex h-14 items-center gap-4 px-4 lg:h-16">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 text-brand-surface-foreground hover:bg-brand-surface-foreground/10 hover:text-brand-surface-foreground lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-sheet"
              onClick={() => setMobileOpen(true)}
            >
              <Menu />
            </Button>

            {headerLogo ? (
              <Logo alt={siteTitle} image={headerLogo} priority />
            ) : (
              <Link href="/" className="text-lg font-semibold">
                {siteTitle ?? "Redshirt Sports"}
              </Link>
            )}

            <NavigationMenuList className="hidden gap-0 lg:flex">
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/college/teams" />}
                  className={darkNavTriggerClass}
                >
                  Teams
                </NavigationMenuLink>
              </NavigationMenuItem>

              {MEGA_MENUS.map((menu) => (
                <NavigationMenuItem key={menu.label}>
                  <NavigationMenuTrigger className={darkNavTriggerClass}>
                    {menu.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className={darkDropdownContentClass}>
                    <div className="w-screen max-w-none bg-brand-surface">
                      <div className="container px-4 py-5">
                        <MegaMenuContent config={menu} />
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>

            <div className="ml-auto hidden items-center gap-2 lg:flex">
              {/* <SearchTrigger
              variant="desktop"
              onClick={() => setSearchOpen(true)}
            /> */}
              <ModeToggle className="text-brand-surface-foreground hover:bg-brand-surface-foreground/10 hover:text-brand-surface-foreground" />
            </div>

            <div className="ml-auto flex items-center gap-1 lg:hidden">
              {/* <SearchTrigger
              variant="mobile"
              onClick={() => setSearchOpen(true)}
            /> */}
              <ModeToggle className="text-brand-surface-foreground hover:bg-brand-surface-foreground/10 hover:text-brand-surface-foreground" />
            </div>
          </div>
        </NavigationMenu>
      </header>

      {/* Search dialog */}
      {/* <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} /> */}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          id="mobile-sheet"
          side="left"
          showCloseButton={false}
          className="flex w-80 max-w-[85vw] flex-col overflow-hidden border-brand-surface-border border-r bg-brand-surface p-0 text-brand-surface-foreground"
        >
          <SheetHeader className="flex h-14 shrink-0 flex-row items-center justify-between border-brand-surface-border border-b px-5">
            <SheetTitle className="text-left font-medium">
              <SheetClose
                nativeButton={false}
                render={<Link href="/" aria-label={homeLabel} />}
              >
                <NavLogoMark siteTitle={siteTitle} image={headerLogo} />
              </SheetClose>
            </SheetTitle>
            <SheetClose
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0 rounded-full border-brand-surface-border text-brand-surface-foreground hover:bg-brand-surface-foreground/10"
                  aria-label="Close navigation menu"
                />
              }
            >
              <X />
              <span className="sr-only">Close navigation menu</span>
            </SheetClose>
          </SheetHeader>

          <ScrollArea className="min-h-0 flex-1">
            <nav aria-label="Mobile navigation">
              <MobileSimpleLink label="Teams" href="/college/teams" />
              {MEGA_MENUS.map((menu) => (
                <MobileCollapsibleSection key={menu.label} config={menu} />
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
