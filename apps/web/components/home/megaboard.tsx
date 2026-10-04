import { cn } from "@redshirt-sports/ui/lib/utils";
import type { Route } from "next";
import Link from "next/link";

import { ArticleImage, ArticleOverlayCard } from "@/components/article-card";
import FormatDate from "@/components/format-date";
import type { HomeArticle } from "@/components/home/sections";

/**
 * Equal-height rows that stretch to the lead image's height on desktop. At
 * `lg` the lead is too short for six, so rows past the fourth only show from
 * `xl`.
 */
export const MEGABOARD_SIDE_LIST_CLASS = "grid auto-rows-fr gap-3 lg:gap-2";
export const MEGABOARD_SIDE_ITEM_CLASS = "lg:max-xl:nth-[n+5]:hidden";
export const MEGABOARD_SIDE_CARD_CLASS =
  "bg-card flex h-full gap-3 overflow-hidden rounded-md border";
/** Fills the card's full height so the thumbnail grows with the row. */
export const MEGABOARD_SIDE_IMAGE_CLASS =
  "aspect-auto min-h-16 w-28 shrink-0 rounded-none xl:w-32";
export const MEGABOARD_SIDE_BODY_CLASS =
  "flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pr-3";

/** Top-of-page lead story with the next few headlines beside it. */
export function Megaboard({
  articles,
  leadHeadingLevel = "h1",
}: {
  articles: HomeArticle[];
  leadHeadingLevel?: "h1" | "h2";
}) {
  const [lead, ...side] = articles;
  if (!lead) return null;
  const SideHeading = leadHeadingLevel === "h1" ? "h2" : "h3";

  return (
    <section
      aria-label="Top stories"
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <ArticleOverlayCard
        id={lead._id}
        title={lead.title}
        excerpt={lead.excerpt}
        image={lead.image}
        imagePriority
        slug={lead.slug}
        author={lead.authors?.[0]?.name}
        date={lead.publishedAt}
        headingLevel={leadHeadingLevel}
        className="lg:col-span-2"
      />
      <ul className={MEGABOARD_SIDE_LIST_CLASS}>
        {side.map((article) => (
          <li key={article._id} className={MEGABOARD_SIDE_ITEM_CLASS}>
            <Link
              href={`/${article.slug}` as Route}
              transitionTypes={["nav-forward"]}
              className={cn(
                "group transition-shadow hover:shadow-md",
                MEGABOARD_SIDE_CARD_CLASS,
              )}
            >
              <ArticleImage
                id={article._id}
                image={article.image}
                width={256}
                height={160}
                sizes="128px"
                className={MEGABOARD_SIDE_IMAGE_CLASS}
              />
              <div className={MEGABOARD_SIDE_BODY_CLASS}>
                <SideHeading className="group-hover:text-primary line-clamp-2 text-sm leading-snug font-semibold transition-colors">
                  {article.title}
                </SideHeading>
                {article.publishedAt ? (
                  <FormatDate
                    dateString={article.publishedAt}
                    className="text-muted-foreground text-xs"
                  />
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
