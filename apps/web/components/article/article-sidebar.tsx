import { AdSlot } from "@/components/ad-slot";
import { MoreFromAuthorCard } from "@/components/article/more-from-author-card";
import { MostReadCard } from "@/components/most-read-card";
import { RankingsWidget } from "@/components/rankings-widget";
import type { MostReadItem } from "@/lib/most-read-data";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export function ArticleSidebar({
  mostRead,
  rankingsPolls,
  moreFromAuthor,
  authorName,
}: {
  mostRead: MostReadItem[];
  rankingsPolls: RankingsWidgetPoll[];
  moreFromAuthor: Array<{ _id: string; title: string; slug: string }>;
  authorName?: string | null;
}) {
  return (
    <aside className="hidden content-start gap-6 lg:grid" aria-label="Sidebar">
      <div className="sticky top-24 grid gap-6">
        <AdSlot width={300} height={250} className="mx-auto w-full max-w-[300px]" />
        <MostReadCard items={mostRead} />
        {rankingsPolls.length > 0 ? (
          <RankingsWidget polls={rankingsPolls} />
        ) : null}
        {authorName ? (
          <MoreFromAuthorCard authorName={authorName} posts={moreFromAuthor} />
        ) : null}
      </div>
    </aside>
  );
}
