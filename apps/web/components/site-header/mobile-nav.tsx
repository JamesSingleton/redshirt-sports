"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import { Separator } from "@redshirt-sports/ui/components/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@redshirt-sports/ui/components/sheet";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { isActivePath, type Navigation, type NavLink } from "@/lib/navigation";
import { HeaderSearch } from "./header-search";
import { NavAnchor } from "./nav-anchor";

type Section = { key: string; title: string | null; links: NavLink[] };

function toSections({ items, secondaryLinks }: Navigation): Section[] {
  const topLevel: NavLink[] = [];
  const menus: Section[] = [];

  for (const item of items) {
    if (item.type === "menu") {
      menus.push({ key: item.key, title: item.title, links: item.links });
    } else {
      topLevel.push(item);
    }
  }

  return [
    ...(topLevel.length ? [{ key: "top", title: null, links: topLevel }] : []),
    ...menus,
    ...(secondaryLinks.length
      ? [{ key: "more", title: "More", links: secondaryLinks }]
      : []),
  ];
}

export function MobileNav({
  navigation,
  brandName,
}: {
  navigation: Navigation;
  brandName: string;
}) {
  const pathname = usePathname();
  const sections = toSections(navigation);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b">
          <SheetTitle className="headline text-xl">{brandName}</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <HeaderSearch />
          <nav aria-label="Mobile" className="flex flex-col">
            {sections.map((section, index) => (
              <Fragment key={section.key}>
                {index > 0 ? <Separator className="my-3" /> : null}
                <section className="flex flex-col">
                  {section.title ? (
                    <h2 className="text-foreground px-2 pb-1 text-base font-bold">
                      {section.title}
                    </h2>
                  ) : null}
                  <ul className="flex flex-col">
                    {section.links.map((link) => {
                      const active = isActivePath(pathname, link.href);
                      return (
                        <li key={link.key}>
                          <SheetClose asChild>
                            <NavAnchor
                              link={link}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "hover:bg-muted flex min-h-11 items-center rounded-sm px-2 text-base",
                                active
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground",
                              )}
                            >
                              {link.name}
                            </NavAnchor>
                          </SheetClose>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              </Fragment>
            ))}
          </nav>
        </div>
        {navigation.cta ? (
          <div className="border-t p-4">
            <SheetClose asChild>
              <Button asChild className="w-full">
                <NavAnchor link={navigation.cta}>
                  {navigation.cta.name}
                </NavAnchor>
              </Button>
            </SheetClose>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
