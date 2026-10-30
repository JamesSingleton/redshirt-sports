import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import { divisionNewsArchivePageFallback } from "@/lib/news-archive/page-loading";
import { renderNewsArchiveFromFilters } from "@/lib/news-archive/render-from-filters";
import { getDivisionFeed, getSportFeed } from "@/lib/rss-feed-links";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport, division } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = await getDynamicFetchOptions();
  const [sportInfoResponse, divisionDisplayName] = await Promise.all([
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
    sanityFetchMetadata({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
    }),
  ]);

  const sportTitle = sportInfoResponse?.data?.title;
  const divisionName = (divisionDisplayName.data as DivisionDisplayMeta)
    ?.displayName;

  if (!sportTitle || !divisionName) {
    notFound();
  }

  const baseTitle = `${divisionName} ${sportTitle} News, Updates & Analysis`;
  const baseDescription = `Complete ${divisionName} ${sportTitle} coverage including breaking news, game analysis, player spotlights, and coaching updates. Your go-to source for ${sportTitle} insights.`;

  const baseCanonical = `/college/${sport}/news/${division}`;

  const isFirstPage = !page || pageIndex <= 1;

  let title: string;
  let description: string;
  let canonical: string;

  if (isFirstPage) {
    title = baseTitle;
    description = baseDescription;
    canonical = baseCanonical;
  } else {
    title = `${baseTitle} - Page ${pageIndex}`;
    description = `More ${divisionName} ${sportTitle} stories on Page ${pageIndex}. Continued coverage of recruiting updates, game previews, injury reports, and in-depth team analysis.`;
    canonical = `${baseCanonical}?page=${pageIndex}`;
  }

  const sportFeedInput = { slug: sport, title: sportTitle };

  return getPageMetadata(
    {
      title,
      description,
      slug: canonical,
      rssFeeds: [
        getDivisionFeed({
          sport: sportFeedInput,
          division: { slug: division, name: divisionName },
        }),
        getSportFeed(sportFeedInput),
      ],
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return draftAwareParamsPage(
    params,
    divisionNewsArchivePageFallback(),
    async ({ sport, division }, options) => {
      const filters = await searchParams;
      return renderNewsArchiveFromFilters(
        { type: "division", sport, division },
        filters,
        options,
      );
    },
  );
}
