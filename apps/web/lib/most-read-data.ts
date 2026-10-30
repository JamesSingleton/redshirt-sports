import {
  type DynamicFetchOptions,
  sanityFetch,
} from "@redshirt-sports/sanity/live";
import {
  queryMostReadFallbackPosts,
  queryPostsBySlugs,
} from "@redshirt-sports/sanity/queries";
import { cacheLife, cacheTag } from "next/cache";

import {
  fetchMostReadPathnames,
  pathnameToArticleSlug,
} from "@/lib/posthog-most-read";

export const MOST_READ_CACHE_TAG = "most-read";

export type MostReadItem = {
  _id: string;
  title: string;
  slug: string;
};

async function getMostReadSlugs(): Promise<string[]> {
  const pathnames = await fetchMostReadPathnames(15);
  const slugs = pathnames
    .map(pathnameToArticleSlug)
    .filter((slug): slug is string => Boolean(slug));
  return [...new Set(slugs)].slice(0, 5);
}

export async function getCachedMostReadPosts({
  perspective,
  stega,
}: DynamicFetchOptions): Promise<MostReadItem[]> {
  "use cache";
  cacheTag(MOST_READ_CACHE_TAG);
  cacheLife("minutes");

  const slugs = await getMostReadSlugs();

  if (slugs.length > 0) {
    const { data: posts } = await sanityFetch({
      query: queryPostsBySlugs,
      params: { slugs },
      perspective,
      stega,
    });

    const postRows = (posts ?? []) as MostReadItem[];
    const bySlug = new Map(postRows.map((post) => [post.slug, post] as const));

    const ordered: MostReadItem[] = slugs.flatMap((slug) => {
      const post = bySlug.get(slug);
      return post ? [post as MostReadItem] : [];
    });

    if (ordered.length > 0) {
      return ordered;
    }
  }

  const { data: fallback } = await sanityFetch({
    query: queryMostReadFallbackPosts,
    perspective,
    stega,
  });

  return (fallback ?? []) as MostReadItem[];
}
