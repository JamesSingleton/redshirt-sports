import { AdSlot } from "@/components/ad-slot";
import { MoreFromAuthorCard } from "@/components/article/more-from-author-card";
import { RankingsWidget } from "@/components/rankings-widget";
import type { AdvertisementCreative } from "@/lib/advertisement";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

export function ArticleSidebar({
  rankingsPolls,
  moreFromAuthor,
  authorName,
  advertisement,
}: {
  rankingsPolls: RankingsWidgetPoll[];
  moreFromAuthor: Array<{ _id: string; title: string; slug: string }>;
  authorName?: string | null;
  advertisement: AdvertisementCreative | null;
}) {
  return (
    <aside className="hidden content-start gap-6 lg:grid" aria-label="Sidebar">
      <div className="sticky top-24 grid gap-6">
        <AdSlot
          placement="article-sidebar"
          creative={advertisement}
          className="w-full max-w-[300px]"
        />
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
