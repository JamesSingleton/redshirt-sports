import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import { queryNavbarData } from "@redshirt-sports/sanity/queries";
import type { QueryNavbarDataResult } from "@redshirt-sports/sanity/types";
import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { Skeleton } from "@redshirt-sports/ui/components/skeleton";
import { SearchIcon } from "lucide-react";
import Link from "next/link";

import { toNavigation } from "@/lib/navigation";
import { HeaderSearch } from "./site-header/header-search";
import { MobileNav } from "./site-header/mobile-nav";
import { NavAnchor } from "./site-header/nav-anchor";
import { PrimaryNav } from "./site-header/primary-nav";
import { SiteLogo } from "./site-logo";

const BRAND_NAME = "Redshirt Sports";

export async function DynamicNavbarServer() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedNavbarServer perspective={perspective} stega={stega} />;
}

async function getCachedNavbarData({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data } = await sanityFetch({
    query: queryNavbarData,
    perspective,
    stega,
  });
  return data;
}

export async function CachedNavbarServer({
  perspective,
  stega,
}: DynamicFetchOptions) {
  const data = await getCachedNavbarData({ perspective, stega });
  // `type` and `href` are on the stega denylist, so they stay plain strings
  // at runtime; only display text (names, titles) carries stega markers.
  const navigation = toNavigation(data as QueryNavbarDataResult);

  return (
    <header className="bg-header text-header-foreground border-header-border sticky top-0 z-40 border-b">
      <div className="container grid h-16 grid-cols-[1fr_auto] items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-1">
          <div className="lg:hidden">
            <MobileNav
              navigation={navigation}
              brandName={BRAND_NAME}
              logo={
                <SiteLogo
                  light={data?.logo}
                  dark={data?.logoDark}
                  className="h-7"
                />
              }
            />
          </div>
          <Link
            href="/"
            className="flex items-center"
            aria-label={`${BRAND_NAME} home`}
          >
            <SiteLogo
              light={data?.logo}
              dark={data?.logoDark}
              priority
              className="h-7"
            />
          </Link>
        </div>
        <div className="hidden lg:block">
          <PrimaryNav items={navigation.items} />
        </div>
        <div className="flex items-center justify-end gap-2">
          <HeaderSearch className="hidden max-w-64 md:block" />
          <Link
            href="/search"
            aria-label="Search"
            className={buttonVariants({
              variant: "ghost",
              size: "icon",
              className: "md:hidden",
            })}
          >
            <SearchIcon />
          </Link>
          {navigation.cta ? (
            <NavAnchor
              link={navigation.cta}
              className={buttonVariants({
                size: "sm",
                className: "hidden sm:inline-flex",
              })}
            >
              {navigation.cta.name}
            </NavAnchor>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function NavbarSkeleton() {
  return (
    <div className="bg-header border-header-border border-b">
      <div className="container flex h-16 items-center">
        <Skeleton className="h-7 w-36" />
      </div>
    </div>
  );
}
