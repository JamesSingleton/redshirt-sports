import type { QueryLatestCollegeSportsArticlesResult } from "@redshirt-sports/sanity/types";
import { cn } from "@redshirt-sports/ui/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { StegaBranded } from "next-sanity";

import { StoryCompact } from "@/components/news/story-compact";
import { StoryLead } from "@/components/news/story-lead";

interface ArticleSectionProps {
  title: string;
  slug: string;
  articles: StegaBranded<QueryLatestCollegeSportsArticlesResult>;
  imageFirst?: boolean;
}

/** Division block on the home page: lead story beside compact stories. */
export default function ArticleSection({
  title,
  slug,
  articles,
  imageFirst = false,
}: ArticleSectionProps) {
  const [firstArticle, ...remainingArticles] = articles;
  if (!firstArticle) return null;

  return (
    <section className="mt-10 border-t pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold uppercase">
          {title}
        </h2>
        <Link
          href={slug}
          className="text-primary flex items-center gap-1 text-sm font-semibold hover:underline"
          prefetch={false}
        >
          <span>View All</span>
          <span className="sr-only">the {title}</span>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-8">
        <div className={cn(imageFirst && "lg:order-2")}>
          <StoryLead
            story={firstArticle}
            as="h3"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>
        {remainingArticles.length > 0 ? (
          <div
            className={cn(
              "grid content-start gap-4",
              imageFirst ? "lg:order-1" : "lg:border-l lg:pl-8",
            )}
          >
            {remainingArticles.map((article) => (
              <StoryCompact
                key={article._id}
                story={article}
                headingLevel="h3"
                thumbClassName="grid-cols-[7rem_1fr]"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
