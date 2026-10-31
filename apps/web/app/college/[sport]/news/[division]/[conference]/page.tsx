import {
  getDynamicFetchOptions,
  sanityFetchMetadata,
} from "@redshirt-sports/sanity/live";
import {
  conferenceInfoBySlugQuery,
  queryDivisionOrSubgroupingDisplayName,
  sportInfoBySlug,
} from "@redshirt-sports/sanity/queries";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { DivisionDisplayMeta } from "@/lib/division-display-meta";
import { draftAwareParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import { conferenceNewsMetaDescription } from "@/lib/news-archive/meta-descriptions";
import { conferenceNewsArchivePageFallback } from "@/lib/news-archive/page-loading";
import { renderNewsArchiveFromFilters } from "@/lib/news-archive/render-from-filters";
import { validatePageIndex } from "@/utils/validate-page-index";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { sport, division, conference } = await params;
  const { page } = await searchParams;
  const pageIndex = validatePageIndex(page);

  const { perspective } = await getDynamicFetchOptions();
  const [divisionDisplayName, conferenceInfo, sportTitle] = await Promise.all([
    sanityFetchMetadata({
      query: queryDivisionOrSubgroupingDisplayName,
      params: { slugOrShortName: division },
      perspective,
    }),
    sanityFetchMetadata({
      query: conferenceInfoBySlugQuery,
      params: { slug: conference },
      perspective,
    }),
    sanityFetchMetadata({
      query: sportInfoBySlug,
      params: { slug: sport },
      perspective,
    }),
  ]);

  if (
    !conferenceInfo ||
    !sportTitle.data?.title ||
    !divisionDisplayName?.data
  ) {
    notFound();
  }

  const conferenceName =
    conferenceInfo.data?.shortName ?? conferenceInfo.data?.name;
  const divisionLabel = (divisionDisplayName?.data as DivisionDisplayMeta)
    ?.displayName;
  const baseTitle = `${conferenceName} ${divisionLabel} ${sportTitle.data.title} News, Updates & Analysis`;
  let canonical = `/college/${sport}/news/${division}/${conference}`;

  let finalTitle = baseTitle;
  const finalDescription = conferenceNewsMetaDescription(
    conferenceName ?? conference,
    divisionLabel ?? division,
    sportTitle.data.title,
    pageIndex > 1 ? pageIndex : 1,
  );

  if (pageIndex && pageIndex > 1) {
    finalTitle = `${baseTitle} - Page ${pageIndex}`;
    canonical = `/college/${sport}/news/${division}/${conference}?page=${pageIndex}`;
  }

  return getPageMetadata(
    {
      title: finalTitle,
      description: finalDescription,
      slug: canonical,
    },
    perspective,
  );
}

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ sport: string; division: string; conference: string }>;
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return draftAwareParamsPage(
    params,
    conferenceNewsArchivePageFallback(),
    async ({ sport, division, conference }, options) => {
      const filters = await searchParams;
      return renderNewsArchiveFromFilters(
        { type: "conference", sport, division, conference },
        filters,
        options,
      );
    },
  );
}
