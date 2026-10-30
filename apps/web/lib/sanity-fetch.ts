import {
  cachedSanity,
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
