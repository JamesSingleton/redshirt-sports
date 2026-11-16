import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

import { LiveAdSlot } from "@/components/live-ad-slot";
import { RankingsWidgetSlot } from "@/components/rankings-widget-slot";
import { validateSport } from "@/lib/vote-ballot";

export function NewsArchiveSidebar({
  sportSlug,
  fetchOptions,
}: {
  sportSlug: string | null;
  fetchOptions: DynamicFetchOptions;
}) {
  return (
    <aside className="grid content-start gap-6" aria-label="Sidebar">
      <RankingsWidgetSlot
        sport={sportSlug ? validateSport(sportSlug) : undefined}
      />
      <LiveAdSlot
        placement="news-sidebar"
        sportSlugs={sportSlug ? [sportSlug] : []}
        fetchOptions={fetchOptions}
        className="w-full max-w-[300px]"
      />
    </aside>
  );
}
