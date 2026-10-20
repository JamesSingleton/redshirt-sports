import { AdSlot } from "@/components/ad-slot";
import { MostReadCard } from "@/components/most-read-card";
import { RankingsWidget } from "@/components/rankings-widget";
import type { MostReadItem } from "@/lib/most-read-data";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export function NewsArchiveSidebar({
  mostRead,
  rankingsPolls,
}: {
  mostRead: MostReadItem[];
  rankingsPolls: RankingsWidgetPoll[];
}) {
  return (
    <aside className="grid content-start gap-6" aria-label="Sidebar">
      <MostReadCard items={mostRead} />
      {rankingsPolls.length > 0 ? (
        <RankingsWidget polls={rankingsPolls} />
      ) : null}
      <AdSlot width={300} height={250} className="mx-auto w-full max-w-[300px]" />
    </aside>
  );
}
