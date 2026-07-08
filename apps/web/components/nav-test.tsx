import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";

import { sanityFetchPage } from "@/lib/sanity-fetch";
import { NavTestClient } from "./nav-test-client";

export async function DynamicHeader() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedHeader perspective={perspective} stega={stega} />;
}

export async function CachedHeader({
  perspective,
  stega,
}: DynamicFetchOptions) {
  "use cache";
  const { data: settingsData } = await sanityFetchPage({
    query: queryGlobalSeoSettings,
    perspective,
    stega,
  });

  return <NavTestClient settingsData={settingsData} />;
}

export async function Header() {
  return <CachedHeader perspective="published" stega={false} />;
}
