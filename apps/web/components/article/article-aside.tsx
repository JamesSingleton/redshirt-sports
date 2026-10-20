import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { getStoryPath, type StoryLike } from "@/components/news/story";
import { RankingsAside } from "@/components/sidebar/rankings-aside";
import type { SportParam } from "@/utils/espn";

/** Sticky article rail: ad, mini poll and related stories. */
export function ArticleAside({
  sport,
  rankingsDivision,
  relatedStories,
}: {
  sport?: string | null;
  rankingsDivision?: string | null;
  relatedStories: StoryLike[];
}) {
  return (
    <aside className="hidden content-start gap-6 lg:grid" aria-label="Sidebar">
      <div className="sticky top-24 grid gap-6">
        <AdSlot size="rectangle" />
        {sport && rankingsDivision ? (
          <RankingsAside
            sport={sport as SportParam}
            division={rankingsDivision}
            limit={5}
          />
        ) : null}
        {relatedStories.length > 0 ? (
          <Card className="gap-0 py-0 shadow-xs">
            <CardHeader className="px-5 pt-5">
              <CardTitle>
                <h2 className="font-display text-xl leading-none font-bold tracking-wide uppercase">
                  Related stories
                </h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-3">
              {relatedStories.map((story) => {
                const href = getStoryPath(story);
                return href ? (
                  <Link
                    key={story._id}
                    href={href}
                    prefetch={false}
                    className="block border-b py-2.5 text-sm font-semibold last:border-0 hover:underline"
                  >
                    {story.title}
                  </Link>
                ) : (
                  <span
                    key={story._id}
                    className="block border-b py-2.5 text-sm font-semibold last:border-0"
                  >
                    {story.title}
                  </span>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </aside>
  );
}
