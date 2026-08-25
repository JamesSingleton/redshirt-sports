import { sanityFetch } from "@redshirt-sports/sanity/live";
import type { StrictDefinedFetchType } from "next-sanity/live";

/**
 * Page content fetch with draft-aware perspective and stega.
 * Typed as `StrictDefinedFetchType` so `"use cache"` doesn't erase query generics.
 */
export const sanityFetchPage: StrictDefinedFetchType = async (options) => {
  "use cache";
  return sanityFetch(options);
};
