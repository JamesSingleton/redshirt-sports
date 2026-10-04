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
  const legal = data?.legal ?? [];

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
      url: `${baseUrl}/college/news`,
    },
    {
      url: `${baseUrl}/college/teams`,
    },
    ...authors.map((author: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
    })),
    ...legal.map((doc: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/legal/${doc.slug}`,
      lastModified: new Date(doc.lastModified),
    })),
  ];
}
