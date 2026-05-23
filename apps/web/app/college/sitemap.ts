import { client } from "@redshirt-sports/sanity/client";
import {
  queryForCollegeSitemap,
  querySportUsesSubgroupings,
} from "@redshirt-sports/sanity/queries";
import type { MetadataRoute } from "next";

import {
  conferenceMatchesNewsSegment,
  resolveNewsRouteSegment,
  type NewsRouteSlugPost,
} from "@/lib/college-news-segments";
import { getBaseUrl } from "@/lib/get-base-url";

export const dynamic = "force-dynamic";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await client.fetch<
    Array<
      NewsRouteSlugPost & {
        sport: string | null;
        _updatedAt: string;
      }
    >
  >(queryForCollegeSitemap);

  const sports = [...new Set(posts.map((p) => p.sport).filter(Boolean))] as string[];
  const subgroupingBySport = new Map<string, boolean>();

  await Promise.all(
    sports.map(async (sport) => {
      const uses = await client.fetch(querySportUsesSubgroupings, { sport });
      subgroupingBySport.set(sport, Boolean(uses));
    }),
  );

  const urls = new Map<string, string>();

  for (const post of posts) {
    if (!post.sport) continue;

    const sportUsesSubgroupings =
      subgroupingBySport.get(post.sport) ?? false;

    const url1 = `${baseUrl}/college/${post.sport}/news`;
    const currentTimestamp1 = urls.get(url1);
    if (
      !currentTimestamp1 ||
      new Date(post._updatedAt) > new Date(currentTimestamp1)
    ) {
      urls.set(url1, post._updatedAt);
    }

    const segment = resolveNewsRouteSegment(
      post.sportSubgrouping,
      post.classification,
      sportUsesSubgroupings,
    );

    if (!segment) continue;

    const url2 = `${baseUrl}/college/${post.sport}/news/${segment}`;
    const currentTimestamp2 = urls.get(url2);
    if (
      !currentTimestamp2 ||
      new Date(post._updatedAt) > new Date(currentTimestamp2)
    ) {
      urls.set(url2, post._updatedAt);
    }

    for (const conference of post.conferences ?? []) {
      if (!conference?.slug) continue;
      if (!conferenceMatchesNewsSegment(conference, post.sport, segment)) {
        continue;
      }

      const url3 = `${baseUrl}/college/${post.sport}/news/${segment}/${conference.slug}`;
      const currentTimestamp3 = urls.get(url3);
      if (
        !currentTimestamp3 ||
        new Date(post._updatedAt) > new Date(currentTimestamp3)
      ) {
        urls.set(url3, post._updatedAt);
      }
    }
  }

  return Array.from(urls.entries()).map(([url, lastModified]) => ({
    url,
    lastModified: new Date(lastModified),
  }));
}
