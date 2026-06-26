import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import Link from "next/link";

import CustomImage from "@/components/sanity-image";
import { getStoryTypeHref, getStoryTypeLabel } from "@/lib/story-type-labels";

type PostData = NonNullable<QueryPostSlugDataResult>;
type RelatedPost = PostData["relatedPosts"][number];

interface RelatedArticlesSidebarProps {
  articles: RelatedPost[];
  storyType?: PostData["storyType"] | null;
}

export function RelatedArticlesSidebar({
  articles,
  storyType,
}: RelatedArticlesSidebarProps) {
  if (articles.length === 0) return null;

  const viewAllHref = getStoryTypeHref(storyType);

  return (
    <aside
      aria-label="Articles you may like"
      className="space-y-0 lg:sticky lg:top-24 lg:self-start"
    >
      <div className="mb-4 border-primary border-b-2 pb-3">
        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
          Articles You May Like
        </h2>
      </div>

      <div className="divide-y divide-border">
        {articles.map((article) => {
          const categoryLabel = getStoryTypeLabel(article.storyType);

          return (
            <Link
              key={article._id}
              href={article.slug ? `/${article.slug}` : "#"}
              prefetch={false}
              className="group block rounded px-2 py-4 transition-colors hover:bg-muted/50"
            >
              {categoryLabel ? (
                <p className="mb-2 text-[11px] font-semibold text-primary uppercase tracking-wide">
                  {categoryLabel}
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted sm:h-14 sm:w-20">
                  <CustomImage
                    image={article.image}
                    width={96}
                    height={64}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    mode="cover"
                    quality={60}
                    sizes="(max-width: 640px) 96px, 80px"
                  />
                </div>
                <h3 className="line-clamp-3 flex-1 text-sm font-bold text-foreground leading-snug transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-2 border-border border-t pt-4">
        <Link
          href={viewAllHref}
          prefetch={false}
          className="text-primary text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-75"
        >
          View All Articles &rarr;
        </Link>
      </div>
    </aside>
  );
}
