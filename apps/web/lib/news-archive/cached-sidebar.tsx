import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

import { NewsArchiveSidebar } from "@/components/news/news-archive-sidebar";

/**
 * The archive sidebar. Its rankings card and sponsorship each stream in behind
 * their own Suspense boundary, so this needs none of its own.
 */
export function NewsArchiveSidebarSlot({
  perspective,
  stega,
  sportSlug,
}: DynamicFetchOptions & { sportSlug: string | null }) {
  return (
    <NewsArchiveSidebar
      sportSlug={sportSlug}
      fetchOptions={{ perspective, stega }}
    />
  );
}
