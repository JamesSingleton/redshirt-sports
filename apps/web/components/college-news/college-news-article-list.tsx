import Link from "next/link";

import RelativePublishDate from "@/components/relative-publish-date";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { getStoryTypeLabel } from "@/lib/story-type-labels";
import type { ArticleFeedItem } from "@/types/article";

interface CollegeNewsArticleListProps {
  articles: ArticleFeedItem[];
}

export function CollegeNewsArticleList({
  articles,
}: CollegeNewsArticleListProps) {
  return (
    <div className="divide-y divide-border">
      {articles.map((article, index) => {
        const href = article.slug ? `/${article.slug}` : null;
        const author = article.authors[0];
        const categoryLabel = getStoryTypeLabel(
          "storyType" in article ? article.storyType : null,
        );

        return (
          <article key={article._id} className="py-4 first:pt-0">
            {href ? (
              <Link href={href} prefetch={false} className="group flex items-start gap-4 sm:gap-5">
                <div className="relative h-20 w-[120px] shrink-0 overflow-hidden rounded bg-muted sm:h-[100px] sm:w-40 lg:h-[110px] lg:w-44">
                  <CustomImage
                    image={article.image}
                    width={176}
                    height={110}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    priority={index < 2}
                    mode="cover"
                    quality={65}
                    sizes={IMAGE_SIZES.teamThumbnail}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {categoryLabel ? (
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {categoryLabel}
                    </span>
                  ) : null}
                  <h2 className="mt-1 line-clamp-2 text-base leading-snug font-bold text-foreground transition-colors group-hover:text-primary lg:line-clamp-3 lg:text-[17px]">
                    {article.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {author?.name ? <span>{author.name}</span> : null}
                    {author?.name && article.publishedAt ? (
                      <span aria-hidden="true">·</span>
                    ) : null}
                    {article.publishedAt ? (
                      <RelativePublishDate dateString={article.publishedAt} />
                    ) : null}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex gap-4">
                <div className="h-20 w-[120px] shrink-0 rounded bg-muted sm:h-[100px] sm:w-40" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-foreground">
                    {article.title}
                  </h2>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
