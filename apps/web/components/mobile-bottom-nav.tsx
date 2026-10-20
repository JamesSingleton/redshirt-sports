"use client";

import { cn } from "@redshirt-sports/ui/lib/utils";
import {
  Home,
  type LucideIcon,
  Network,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
  match: (pathname: string) => boolean;
}

interface MobileBottomNavProps {
  /** Latest FCS football rankings URL; falls back to FCS football news. */
  rankingsHref?: string;
}

const FALLBACK_RANKINGS_HREF = "/college/football/news/fcs";

export function MobileBottomNav({
  rankingsHref = FALLBACK_RANKINGS_HREF,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? "";

  const items: BottomNavItem[] = [
    {
      label: "Home",
      href: "/",
      Icon: Home,
      match: (p) => p === "/",
    },
    {
      label: "Rankings",
      href: rankingsHref,
      Icon: Trophy,
      match: (p) => p.includes("/rankings"),
    },
    {
      label: "Brackets",
      href: "/college/football/bracket-challenge/fcs",
      Icon: Network,
      match: (p) => p.includes("/bracket-challenge"),
    },
    {
      label: "Following",
      href: "/",
      Icon: Users,
      match: () => false,
    },
    {
      label: "Me",
      href: "/sign-in",
      Icon: User,
      match: (p) => p.startsWith("/sign-in") || p.startsWith("/sign-up"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="bg-background/95 supports-[backdrop-filter]:bg-background/85 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {items.map(({ label, href, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
