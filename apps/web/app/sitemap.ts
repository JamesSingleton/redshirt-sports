import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { querySitemapData, sportInfoQuery } from "@redshirt-sports/sanity/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data }, { data: sports }] = await Promise.all([
    sanityFetchMetadata({
      query: querySitemapData,
      perspective: "published",
    }),
    sanityFetchMetadata({
      query: sportInfoQuery,
      perspective: "published",
    }),
  ]);
  const authors = data?.authors ?? [];
  const sportSlugs = (sports ?? []).map((sport) => sport.slug);

  return [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/about`,
    },
    {
      url: `${baseUrl}/contact`,
    },
    {
      url: `${baseUrl}/privacy-policy`,
    },
    {
      url: `${baseUrl}/college/news`,
    },
    {
      url: `${baseUrl}/college/transfer-portal`,
    },
    {
      url: `${baseUrl}/college/transfer-portal/news`,
    },
    {
      url: `${baseUrl}/recruiting`,
    },
    ...sportSlugs.flatMap((slug) => [
      { url: `${baseUrl}/recruiting/${slug}` },
      { url: `${baseUrl}/recruiting/${slug}/players` },
      { url: `${baseUrl}/college/${slug}/transfer-portal/news` },
      { url: `${baseUrl}/college/${slug}/transfer-portal/feed` },
    ]),
    ...authors.map((author: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
    })),
  ];
}
