import type { ReactNode } from "react";

import { MoreFromAuthorCard } from "@/components/article/more-from-author-card";

export function ArticleSidebar({
  adSlot,
  rankings,
  moreFromAuthor,
  authorName,
}: {
  /**
   * Sponsorship placement, last in the sidebar: it streams in after the page
   * paints, and nothing below it may move when it does.
   */
  adSlot?: ReactNode;
  rankings?: ReactNode;
  moreFromAuthor: Array<{ _id: string; title: string; slug: string }>;
  authorName?: string | null;
}) {
  return (
    <aside className="hidden content-start gap-6 lg:grid" aria-label="Sidebar">
      <div className="sticky top-24 grid gap-6">
        {rankings}
        {authorName ? (
          <MoreFromAuthorCard authorName={authorName} posts={moreFromAuthor} />
        ) : null}
        {adSlot}
      </div>
    </aside>
  );
}
