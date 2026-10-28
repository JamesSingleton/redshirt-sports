import type { DynamicFetchOptions } from "@redshirt-sports/sanity/live";

import { AdSlot } from "@/components/ad-slot";
import { MostReadCard } from "@/components/most-read-card";
import { RankingsWidget } from "@/components/rankings-widget";
import { loadAdvertisement } from "@/lib/advertisement";
import type { MostReadItem } from "@/lib/most-read-data";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export async function NewsArchiveSidebar({
  mostRead,
  rankingsPolls,
  sportSlug,
  fetchOptions,
}: {
  mostRead: MostReadItem[];
  rankingsPolls: RankingsWidgetPoll[];
  sportSlug: string | null;
  fetchOptions: DynamicFetchOptions;
}) {
  const advertisement = await loadAdvertisement({
    placement: "news-sidebar",
    sportSlugs: sportSlug ? [sportSlug] : [],
    fetchOptions,
  });

  return (
    <aside className="grid content-start gap-6" aria-label="Sidebar">
      <MostReadCard items={mostRead} />
      {rankingsPolls.length > 0 ? (
        <RankingsWidget polls={rankingsPolls} />
      ) : null}
      <AdSlot
        placement="news-sidebar"
        creative={advertisement}
        className="w-full max-w-[300px]"
      />
    </aside>
  );
}
