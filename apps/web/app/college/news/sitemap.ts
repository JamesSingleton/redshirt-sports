import {
  PUBLISHED_FETCH_OPTIONS,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  countOfPostsQuery,
  postsForSitemapQuery,
} from "@redshirt-sports/sanity/queries";
import type {
  CountOfPostsQueryResult,
  PostsForSitemapQueryResult,
} from "@redshirt-sports/sanity/types";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();
const urlsPerSitemap = 50000;

async function fetchPostCountForSitemap() {
  const { data } = (await sanityFetchMetadata({
    query: countOfPostsQuery,
    perspective: PUBLISHED_FETCH_OPTIONS.perspective,
  })) as { data: CountOfPostsQueryResult | null };
  return data ?? 0;
}

async function fetchPostsForSitemap({
  start,
  end,
}: {
  start: number;
  end: number;
}) {
  const { data } = (await sanityFetchMetadata({
    query: postsForSitemapQuery,
    params: { start, end },
    perspective: PUBLISHED_FETCH_OPTIONS.perspective,
  })) as { data: PostsForSitemapQueryResult | null };
  return data ?? [];
}

export async function generateSitemaps() {
  const count = await fetchPostCountForSitemap();
  const totalPages = Math.ceil(count / urlsPerSitemap);
  return Array.from({ length: totalPages }, (_, id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  // Google's limit is 50,000 URLs per sitemap
  const start = id * urlsPerSitemap;
  const end = start + urlsPerSitemap;

  const posts = await fetchPostsForSitemap({ start, end });

  return posts.map((post) => ({
    url: `${baseUrl}/${post.slug}`,
    lastModified: post._updatedAt,
  }));
}
