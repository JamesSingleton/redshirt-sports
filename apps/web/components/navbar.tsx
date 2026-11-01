import {
  cachedSanity,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { queryNavbarData } from "@redshirt-sports/sanity/queries";
import type {
  QueryGlobalSeoSettingsResult,
  QueryNavbarDataResult,
} from "@redshirt-sports/sanity/types";
import type { StegaBranded } from "next-sanity";
import { memo } from "react";

import {
  NavbarClient,
  NavbarSkeletonResponsive,
} from "@/components/navbar-client";
import { fetchGlobalSeoSettings } from "@/lib/global-seo-settings";
import { resolveDynamicFetchOptions } from "@/lib/resolve-dynamic-fetch-options";

export type NavbarItems = NonNullable<
  NonNullable<StegaBranded<QueryNavbarDataResult>>["items"]
>;
export type NavbarItem = NavbarItems[number];
export type NavSportMenuItem = Extract<NavbarItem, { _type: "navSportMenu" }>;
export type NavRankingsMenuItem = Extract<
  NavbarItem,
  { _type: "navRankingsMenu" }
>;
export type NavColumnItem = Extract<NavbarItem, { _type: "navbarColumn" }>;
export type NavLinkItem = Extract<NavbarItem, { _type: "navbarLink" }>;

export async function DynamicNavbarServer() {
  return <CachedNavbarServer {...(await resolveDynamicFetchOptions())} />;
}

/**
 * Navigation comes only from the Sanity `navbar` singleton (and the sports and
 * divisions it references). No Postgres data: the navbar is in every page's
 * static shell, so anything it reads would invalidate every page.
 */
async function getNavbarSanity({ perspective, stega }: DynamicFetchOptions) {
  const [{ data: navbarData }, settingsData] = await Promise.all([
    cachedSanity({
      query: queryNavbarData,
      perspective,
      stega,
    }),
    fetchGlobalSeoSettings(perspective),
  ]);
  return { items: navbarData?.items ?? [], settingsData };
}

export async function CachedNavbarServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const { items, settingsData } = await getNavbarSanity({ perspective, stega });
  return <MemoizedNavbar items={items} settingsData={settingsData} />;
}

const MemoizedNavbar = memo(function Navbar({
  items,
  settingsData,
}: {
  items: NavbarItems;
  settingsData: QueryGlobalSeoSettingsResult;
}) {
  return (
    <header
      className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      data-testid="site-header"
    >
      <div className="relative">
        <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
          <NavbarClient items={items} settingsData={settingsData} />
        </div>
      </div>
    </header>
  );
});

export { MemoizedNavbar as Navbar };

export function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95">
      <div className="mx-auto flex h-14 max-w-site items-center gap-3 px-4 lg:h-16 lg:px-6">
        <div className="bg-muted h-7 w-[169px] animate-pulse rounded" />
        <NavbarSkeletonResponsive />
      </div>
    </header>
  );
}
