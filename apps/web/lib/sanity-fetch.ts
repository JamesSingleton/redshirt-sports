import { sanityFetch } from "@redshirt-sports/sanity/live";
import type { QueryParams } from "next-sanity";
import { type LivePerspective } from "next-sanity/live";
import { cookies, draftMode } from "next/headers";

export interface DynamicFetchOptions {
  perspective: LivePerspective;
  stega: boolean;
}

/** Resolve perspective + stega for page/layout content fetches. */
export async function getDynamicFetchOptions(): Promise<DynamicFetchOptions> {
  const { isEnabled: isDraftMode } = await draftMode();

  if (!isDraftMode) {
    return { perspective: "published", stega: false };
  }

  const jar = await cookies();
  const perspective =
    (jar.get("sanity-preview-perspective")?.value as LivePerspective | undefined) ??
    "drafts";

  return { perspective, stega: true };
}

/** For generateMetadata / sitemaps — never enable stega (avoids garbled titles). */
export async function sanityFetchMetadata<const QueryString extends string>({
  query,
  params = {},
  perspective,
}: {
  query: QueryString;
  params?: QueryParams;
  perspective: LivePerspective;
}) {
  return sanityFetch({ query, params, perspective, stega: false });
}

/** Page content fetch with draft-aware perspective and stega. */
export async function sanityFetchPage<const QueryString extends string>({
  query,
  params = {},
  perspective,
  stega,
}: {
  query: QueryString;
  params?: QueryParams;
} & DynamicFetchOptions) {
  return sanityFetch({ query, params, perspective, stega });
}
