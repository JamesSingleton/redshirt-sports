import type { QueryGlobalSeoSettingsResult } from "@redshirt-sports/sanity/types";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@redshirt-sports/ui/components/collapsible";
import { ScrollArea } from "@redshirt-sports/ui/components/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@redshirt-sports/ui/components/sheet";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronDown, Menu } from "lucide-react";
import Link from "next/link";

import {
  flattenNavbarColumnLinks,
  type ResolvedNavbarItem,
} from "@/lib/nav-data";
import type { NavLink } from "@/lib/nav-rankings";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";

type MobileNavProps = {
  siteTitle?: string | null;
  logo?: NonNullable<QueryGlobalSeoSettingsResult>["logo"];
  items: ResolvedNavbarItem[];
  className?: string;
};

function MobileNavLogo({
  siteTitle,
  logo,
}: Pick<MobileNavProps, "siteTitle" | "logo">) {
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

function MobileNavLink({
  link,
  className,
}: {
  link: NavLink;
  className?: string;
}) {
  return (
    <SheetClose
      render={
        <Link
          href={link.href}
          className={cn(
            "py-2 font-medium transition-colors hover:text-foreground/80",
            className,
          )}
          target={link.openInNewTab ? "_blank" : undefined}
          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        />
      }
    >
      {link.label}
    </SheetClose>
  );
}

export function MobileNav({
  siteTitle,
  logo,
  items,
  className,
}: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("md:hidden", className)}
            aria-label="Open menu"
          />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex min-w-80 flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="text-left font-medium">
            <MobileNavLogo siteTitle={siteTitle} logo={logo} />
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col px-6 py-4">
            <nav aria-label="Mobile navigation" className="flex flex-col">
              {items.map((item) => {
                if (item.type === "link") {
                  return <MobileNavLink key={item._key} link={item} />;
                }

                const columnLinks = flattenNavbarColumnLinks(item);

                return (
                  <Collapsible key={item._key}>
                    <CollapsibleTrigger className="group/collapsible flex w-full items-center justify-between py-2 font-medium transition-colors hover:text-foreground/80">
                      {item.title}
                      <ChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col pb-2">
                      {columnLinks.map((link) => (
                        <MobileNavLink
                          key={`${item._key}-${link.href}`}
                          link={link}
                          className="text-sm font-normal text-muted-foreground hover:text-foreground"
                        />
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </nav>

            <div className="mt-4">
              <ModeToggle />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
