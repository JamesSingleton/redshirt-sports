import { getDynamicFetchOptions } from "@redshirt-sports/sanity/live";
import type { Metadata } from "next";

import { draftAwareSearchParamsPage } from "@/lib/draft-cache";
import { getPageMetadata } from "@/lib/global-seo-settings";
import type { NewsArchiveSearchParams } from "@/lib/news-archive";
import { collegeNewsMetaDescription } from "@/lib/news-archive/meta-descriptions";
import { collegeNewsArchivePageFallback } from "@/lib/news-archive/page-loading";
import { renderNewsArchiveFromFilters } from "@/lib/news-archive/render-from-filters";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<NewsArchiveSearchParams>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const pageIndex = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const { perspective } = await getDynamicFetchOptions();

  let title: string;
  const description = collegeNewsMetaDescription(pageIndex);
  let canonicalUrl = "/college/news";

  if (pageIndex > 1) {
    title = `College News - Page ${pageIndex}`;
    canonicalUrl = `${canonicalUrl}?page=${pageIndex}`;
  } else {
    title = "College News";
  }

  return getPageMetadata(
    {
      title,
      description,
      slug: canonicalUrl,
    },
    perspective,
  );
}

export default function CollegeNewsPage({
  searchParams,
}: {
  searchParams: Promise<NewsArchiveSearchParams>;
}) {
  return draftAwareSearchParamsPage(
    searchParams,
    collegeNewsArchivePageFallback(),
    (filters, options) =>
      renderNewsArchiveFromFilters({ type: "college" }, filters, options),
  );
}
