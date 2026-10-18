import type { ReactNode } from "react";

import type { StoryLike } from "./story";
import { StoryRow } from "./story-row";

/**
 * "Latest" list of story rows with a heading and optional pagination slot.
 * Rows are headline-left / thumb-right (news.html).
 */
export function NewsFeed({
  stories,
  heading = "Latest",
  meta,
  kicker,
  pagination,
  leadingPriorityCount = 2,
}: {
  stories: StoryLike[];
  heading?: string;
  meta?: ReactNode;
  kicker?: string | null;
  pagination?: ReactNode;
  leadingPriorityCount?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="font-display text-2xl font-extrabold uppercase">
          {heading}
        </h2>
        {meta ? (
          <span className="text-muted-foreground text-xs">{meta}</span>
        ) : null}
      </div>
      <div className="divide-y">
        {stories.map((story, index) => (
          <StoryRow
            key={story._id}
            story={story}
            kicker={kicker}
            priority={index < leadingPriorityCount}
          />
        ))}
      </div>
      {pagination ? <div className="pt-4">{pagination}</div> : null}
    </div>
  );
}
