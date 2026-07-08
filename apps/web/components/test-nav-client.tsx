"use client";

import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@redshirt-sports/ui/components/navigation-menu";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ResolvedNavbarItem } from "@/lib/nav-data";
import type { NavLink } from "@/lib/nav-rankings";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ModeToggle } from "./mode-toggle";

function megaMenuGridClass(sectionCount: number) {
  if (sectionCount >= 4) {
    return "grid-cols-4";
  }
  if (sectionCount === 3) {
    return "grid-cols-3";
  }
  if (sectionCount === 2) {
    return "grid-cols-2";
  }
  return "grid-cols-1";
}

function MegaMenuLink({ link }: { link: NavLink }) {
  return (
    <NavigationMenuLink
      render={
        <Link
          href={link.href}
          className="group/link flex flex-col gap-1 rounded-md p-2.5 transition-colors hover:bg-muted/80"
          target={link.openInNewTab ? "_blank" : undefined}
          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        />
      }
    >
      <span className="flex items-center gap-1 font-medium">
        {link.label}
        <ArrowRight
          aria-hidden
          className="size-3 -translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
        />
      </span>
      {link.description ? (
        <span className="text-xs leading-relaxed text-muted-foreground">
          {link.description}
        </span>
      ) : null}
    </NavigationMenuLink>
  );
}

function MegaMenuSection({
  title,
  links,
  sectionKey,
}: {
  title: string;
  links: NavLink[];
  sectionKey: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {title ? (
        <p className="h-5 text-xs font-normal tracking-wide text-muted-foreground">
          {title}
        </p>
      ) : null}
      {title ? <div className="h-px bg-border/20" /> : null}
      <div className="flex flex-col gap-1">
        {links.map((link) => (
          <MegaMenuLink key={`${sectionKey}-${link.href}`} link={link} />
        ))}
      </div>
    </div>
  );
}

function SiteLogo({
  siteTitle,
  logo,
}: {
  siteTitle?: string | null;
  logo?: NonNullable<QueryGlobalSeoSettingsResult>["logo"];
}) {
  if (logo) {
    return <Logo alt={siteTitle} image={logo} />;
  }

  if (siteTitle) {
    return (
      <Link href="/" className="text-lg font-semibold">
        {siteTitle}
      </Link>
    );
  }

  return null;
}

export function TestNavClient({
  settingsData,
  navItems,
}: {
  settingsData: QueryGlobalSeoSettingsResult;
  navItems: ResolvedNavbarItem[];
}) {
  const { siteTitle, logo } = settingsData ?? {};

  return (
    <header className="sticky top-0 z-50 w-full bg-background transition-all duration-300">
      <NavigationMenu
        className={cn(
          "relative w-full max-w-none",
          "[&>div.absolute]:left-0 [&>div.absolute]:w-full [&>div.absolute]:justify-start",
          "**:data-[slot=navigation-menu-viewport]:mt-0 **:data-[slot=navigation-menu-viewport]:rounded-none **:data-[slot=navigation-menu-viewport]:border-x-0 **:data-[slot=navigation-menu-viewport]:border-t **:data-[slot=navigation-menu-viewport]:border-dashed **:data-[slot=navigation-menu-viewport]:shadow-none",
        )}
      >
        <div className="container px-4">
          <div className="flex h-fit w-full items-center justify-between gap-4 py-4">
            <SiteLogo siteTitle={siteTitle} logo={logo} />

            <NavigationMenuList className="hidden flex-1 justify-center md:flex">
              {navItems.map((item) => {
                if (item.type === "link") {
                  return (
                    <NavigationMenuItem key={item._key}>
                      <NavigationMenuLink
                        render={
                          <Link
                            href={item.href}
                            target={item.openInNewTab ? "_blank" : undefined}
                            rel={
                              item.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                          />
                        }
                        className={navigationMenuTriggerStyle()}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }

                return (
                  <NavigationMenuItem key={item._key}>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-screen max-w-none bg-background">
                        <div className="container px-4 py-8">
                          <div
                            className={cn(
                              "grid gap-8",
                              megaMenuGridClass(item.sections.length),
                            )}
                          >
                            {item.sections.map((section) => (
                              <MegaMenuSection
                                key={section._key}
                                sectionKey={section._key}
                                title={section.groupLabel ?? ""}
                                links={section.links}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>

            <div className="flex items-center gap-2">
              <ModeToggle className="hidden md:inline-flex" />
              <MobileNav siteTitle={siteTitle} logo={logo} items={navItems} />
            </div>
          </div>
        </div>
      </NavigationMenu>
    </header>
  );
}
