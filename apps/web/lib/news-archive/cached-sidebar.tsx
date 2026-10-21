import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";
import { Suspense } from "react";

import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";
import { NewsArchiveSidebarSkeleton } from "@/components/news/news-archive-sidebar-skeleton";
import { getCachedMostReadPosts } from "@/lib/most-read-data";
import { getCachedRankingsWidgetPolls } from "@/lib/rankings-widget-data";
import { validateSport } from "@/lib/vote-ballot";

export async function CachedNewsArchiveSidebarInner({
  perspective,
  stega,
  sportSlug,
}: DynamicFetchOptions & { sportSlug: string | null }) {
  "use cache";
  const [mostRead, rankingsPolls] = await Promise.all([
    getCachedMostReadPosts(),
    sportSlug
      ? getCachedRankingsWidgetPolls(validateSport(sportSlug))
      : getCachedRankingsWidgetPolls(),
  ]);

  return (
    <NewsArchiveSidebar mostRead={mostRead} rankingsPolls={rankingsPolls} />
  );
}

export function NewsArchiveSidebarSlot({
  perspective,
  stega,
  sportSlug,
}: DynamicFetchOptions & { sportSlug: string | null }) {
  return (
    <Suspense fallback={<NewsArchiveSidebarSkeleton />}>
      <CachedNewsArchiveSidebarInner
        perspective={perspective}
        stega={stega}
        sportSlug={sportSlug}
      />
    </Suspense>
  );
}
