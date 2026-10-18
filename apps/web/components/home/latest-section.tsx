import { buttonVariants } from "@redshirt-sports/ui/components/button";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import type { StoryLike } from "@/components/news/story";
import { StoryRow } from "@/components/news/story-row";

const LATEST_TABS = [
  { label: "All", href: "/college/news" },
  { label: "FBS", href: "/college/football/news/fbs" },
  { label: "FCS", href: "/college/football/news/fcs" },
  { label: "D-II", href: "/college/football/news/d2" },
  { label: "D-III", href: "/college/football/news/d3" },
] as const;

const TAB_BASE =
  "inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition";
const TAB_ACTIVE =
  "bg-background text-foreground shadow-sm dark:bg-input/30 dark:border-input";
const TAB_INACTIVE = "text-muted-foreground hover:text-foreground";

/**
 * "Latest" feed with tab-styled filters. The tabs are plain links: "All"
 * stays on the latest feed, the divisions open their news feeds.
 */
export function LatestSection({ articles }: { articles: StoryLike[] }) {
  if (articles.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <h2 className="font-display text-2xl font-extrabold uppercase">
          Latest
        </h2>
        <nav
          aria-label="Latest stories by division"
          className="bg-muted text-muted-foreground hidden h-9 w-fit items-center justify-center rounded-lg p-[3px] sm:inline-flex"
        >
          {LATEST_TABS.map((tab, index) => (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={false}
              aria-current={index === 0 ? "page" : undefined}
              className={cn(TAB_BASE, index === 0 ? TAB_ACTIVE : TAB_INACTIVE)}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="divide-y">
        {articles.map((article) => (
          <StoryRow key={article._id} story={article} />
        ))}
      </div>
      <div className="pt-4">
        <Link
          href="/college/news"
          prefetch={false}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          View all stories
        </Link>
      </div>
    </div>
  );
}
