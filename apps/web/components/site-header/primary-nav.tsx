"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@redshirt-sports/ui/components/navigation-menu";
import { usePathname } from "next/navigation";

import { isActivePath, type NavItem } from "@/lib/navigation";
import { NavAnchor } from "./nav-anchor";

export function PrimaryNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  if (!items.length) return null;

  return (
    <NavigationMenu viewport={false} aria-label="Primary">
      <NavigationMenuList className="gap-0">
        {items.map((item) =>
          item.type === "menu" ? (
            <NavigationMenuItem key={item.key}>
              <NavigationMenuTrigger
                tone="header"
                data-active={
                  item.links.some((link) => isActivePath(pathname, link.href))
                    ? ""
                    : undefined
                }
              >
                {item.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex w-60 flex-col">
                  {item.links.map((link) => (
                    <li key={link.key}>
                      <NavigationMenuLink
                        asChild
                        active={isActivePath(pathname, link.href)}
                      >
                        <NavAnchor link={link}>
                          <span className="font-semibold">{link.name}</span>
                          {link.description ? (
                            <span className="text-muted-foreground line-clamp-2 text-xs">
                              {link.description}
                            </span>
                          ) : null}
                        </NavAnchor>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.key}>
              <NavigationMenuLink
                asChild
                active={isActivePath(pathname, item.href)}
                className={navigationMenuTriggerStyle({ tone: "header" })}
              >
                <NavAnchor link={item}>{item.name}</NavAnchor>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
