import { client } from "@redshirt-sports/sanity/client";
import { querySitemapData } from "@redshirt-sports/sanity/queries";
import type { MetadataRoute } from "next";

import { getBaseUrl } from "@/lib/get-base-url";

const baseUrl = getBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { authors, schools, sports } = await client.fetch(querySitemapData);

  const recruitingUrls: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/recruiting`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/transfer-portal`,
      lastModified: new Date(),
    },
    ...(sports ?? []).flatMap((sport: { slug: string }) => [
      {
        url: `${baseUrl}/recruiting/${sport.slug}/news`,
        lastModified: new Date(),
      },
      {
        url: `${baseUrl}/transfer-portal/${sport.slug}/news`,
        lastModified: new Date(),
      },
    ]),
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
    },
    {
      url: `${baseUrl}/college/news`,
      lastModified: new Date(),
    },
    ...recruitingUrls,
    ...(schools ?? []).map((school: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/college/teams/${school.slug}`,
      lastModified: new Date(school.lastModified),
    })),
    ...authors.map((author: { slug: string; lastModified: string }) => ({
      url: `${baseUrl}/authors/${author.slug}`,
      lastModified: new Date(author.lastModified),
    })),
  ];
}
