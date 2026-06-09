import {
  type DynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import type { QueryParams } from "next-sanity";

/** Page content fetch with draft-aware perspective and stega. Must run inside `'use cache'`. */
export async function sanityFetchPage<const QueryString extends string>({
  query,
  params = {},
  perspective,
  stega,
}: {
  query: QueryString;
  params?: QueryParams;
} & DynamicFetchOptions) {
  "use cache";
  return sanityFetch({ query, params, perspective, stega });
}
