import { sanityFetchMetadata } from "@redshirt-sports/sanity/live";
import { querySitemapData } from "@redshirt-sports/sanity/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { data } = await sanityFetchMetadata({
    query: querySitemapData,
    perspective: "published",
  });
  const authors = data?.authors ?? [];

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
    ...authors.map((author: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
    })),
  ];
}
