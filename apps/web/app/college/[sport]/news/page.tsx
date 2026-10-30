import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import { sportInfoBySlug } from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import { sportNewsArchivePageFallback } from "@/lib/news-archive/page-loading";
import { renderNewsArchiveFromFilters } from "@/lib/news-archive/render-from-filters";
import { getSportFeed } from "@/lib/rss-feed-links";
import { sportNavLabel } from "@/lib/sport-nav";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport } = await params;
  const { page } = await searchParams;
  const pageIndex = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const { perspective } = await getDynamicFetchOptions();

  const { data: sportData } = await sanityFetchMetadata({
    query: sportInfoBySlug,
    params: { slug: sport },
    perspective,
  });

  if (!sportData?.title) {
    notFound();
  }

  const sportLabel = sportNavLabel(sport, sportData.title);
  let title: string;
  let description: string;
  let canonicalUrl = `/college/${sport}/news`;

  if (pageIndex > 1) {
    title = `${sportLabel} News - Page ${pageIndex}`;
    description = `Page ${pageIndex} of ${sportLabel} news and analysis from ${process.env.NEXT_PUBLIC_APP_NAME}.`;
    canonicalUrl = `${canonicalUrl}?page=${pageIndex}`;
  } else {
    title = `${sportLabel} News`;
    description = `Every ${sportLabel} story, newest first.`;
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
      rssFeeds: [getSportFeed({ slug: sport, title: sportData.title })],
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return draftAwareParamsPage(
    params,
    sportNewsArchivePageFallback(),
    async ({ sport }, options) => {
      const filters = await searchParams;
      return renderNewsArchiveFromFilters(
        { type: "sport", sport },
        filters,
        options,
      );
    },
  );
}
