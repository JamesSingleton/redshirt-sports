import type { ReactNode } from "react";

import ArticleCard, {
  ArticleOverlayCard,
  ArticleRow,
} from "@/components/article-card";
import { LeadStory, type LeadStoryPost } from "@/components/news/lead-story";
import { SectionHeader } from "@/components/news/section-header";
import { IMAGE_SIZES } from "@/lib/image-sizes";

export type HomeArticle = LeadStoryPost & {
  conferences?: Array<{
    shortName?: string | null;
    name?: string | null;
  }> | null;
};

type SectionProps = {
  id: string;
  title: string;
  href: string;
  badge?: string;
  description?: string;
  articles: HomeArticle[];
};

function authorName(article: HomeArticle) {
  return article.authors?.[0]?.name ?? null;
}

function conferenceKicker(article: HomeArticle) {
  const conference = article.conferences?.[0];
  return conference?.shortName ?? conference?.name ?? null;
}

function SectionFrame({
  id,
  title,
  href,
  badge,
  description,
  children,
}: Omit<SectionProps, "articles"> & { children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <SectionHeader id={id} title={title} href={href} badge={badge} />
      {description ? (
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}

function MediumCard({ article }: { article: HomeArticle }) {
  return (
    <ArticleCard
      id={article._id}
      title={article.title}
      image={article.image}
      slug={article.slug}
      author={authorName(article)}
      date={article.publishedAt}
      kicker={conferenceKicker(article)}
    />
  );
}

function RowList({ articles }: { articles: HomeArticle[] }) {
  if (articles.length === 0) return null;
  return (
    <ul className="divide-border flex flex-col divide-y">
      {articles.map((article) => (
        <li key={article._id} className="py-3 first:pt-0 last:pb-0">
          <ArticleRow
            id={article._id}
            title={article.title}
            image={article.image}
            slug={article.slug}
            author={authorName(article)}
            date={article.publishedAt}
          />
        </li>
      ))}
    </ul>
  );
}

/** Two-up grid of image cards. */
export function GridSection({
  articles,
  columns = 2,
  ...frame
}: SectionProps & { columns?: 2 | 3 }) {
  if (articles.length === 0) return null;
  return (
    <SectionFrame {...frame}>
      <div
        className={
          columns === 3
            ? "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3"
            : "grid grid-cols-1 gap-6 sm:grid-cols-2"
        }
      >
        {articles.map((article) => (
          <MediumCard key={article._id} article={article} />
        ))}
      </div>
    </SectionFrame>
  );
}

/** Big overlay story, then two cards and a short list. */
export function FeatureSection({ articles, ...frame }: SectionProps) {
  const [lead, ...rest] = articles;
  if (!lead) return null;
  const cards = rest.slice(0, 2);
  const rows = rest.slice(2);

  return (
    <SectionFrame {...frame}>
      <ArticleOverlayCard
        id={lead._id}
        title={lead.title}
        excerpt={lead.excerpt}
        image={lead.image}
        slug={lead.slug}
        author={authorName(lead)}
        date={lead.publishedAt}
        kicker={conferenceKicker(lead)}
        headingLevel="h3"
        sizes={IMAGE_SIZES.articleHero}
      />
      {cards.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {cards.map((article) => (
            <MediumCard key={article._id} article={article} />
          ))}
        </div>
      ) : null}
      <RowList articles={rows} />
    </SectionFrame>
  );
}

/** Two cards over a compact list. */
export function SplitSection({ articles, ...frame }: SectionProps) {
  if (articles.length === 0) return null;
  const cards = articles.slice(0, 2);
  const rows = articles.slice(2);

  return (
    <SectionFrame {...frame}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cards.map((article) => (
          <MediumCard key={article._id} article={article} />
        ))}
      </div>
      <RowList articles={rows} />
    </SectionFrame>
  );
}

/** Lead story with excerpt beside a list of the rest. */
export function LeadListSection({ articles, ...frame }: SectionProps) {
  const [lead, ...rest] = articles;
  if (!lead) return null;

  return (
    <SectionFrame {...frame}>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <LeadStory
          post={lead}
          headingLevel="h3"
          sizes={IMAGE_SIZES.articleCard}
          headingClassName="text-2xl md:text-2xl"
        />
        <RowList articles={rest} />
      </div>
    </SectionFrame>
  );
}
