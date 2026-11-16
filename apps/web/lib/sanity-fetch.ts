import {
  cachedSanity,
  cachedSanityRemote,
  type DynamicFetchOptions,
} from "@redshirt-sports/sanity/live";
import type { QueryParams } from "next-sanity";

/**
 * Page content fetch. Delegates to the single `cachedSanity` boundary.
 * Callers must not themselves be `"use cache"`: awaiting that boundary from
 * inside another cache fill deadlocks until the function timeout in production.
 */
export async function sanityFetchPage<const QueryString extends string>({
  query,
  params = {},
  perspective,
  stega,
}: {
  query: QueryString;
  params?: QueryParams;
} & DynamicFetchOptions) {
  return cachedSanity({ query, params, perspective, stega });
}

/**
 * Fetch for a component that renders on each request (after `connection()`),
 * so its data is not written into the page's static shell. Published reads
 * use the shared remote cache. Draft preview keeps the per-instance one.
 */
export async function sanityFetchRequestTime<const QueryString extends string>({
  query,
  params = {},
  perspective,
  stega,
}: {
  query: QueryString;
  params?: QueryParams;
} & DynamicFetchOptions) {
  if (perspective === "published" && !stega) {
    return cachedSanityRemote({ query, params });
  }
  return cachedSanity({ query, params, perspective, stega });
}
