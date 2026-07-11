import { cn } from "@redshirt-sports/ui/lib/utils";

import ArticleCard from "@/components/article-card";
import { SectionHeader } from "@/components/home/section-header";
import { featuredArticleGridClass } from "@/lib/featured-article-grid";

type HomeArticle = {
  _id: string;
  title: string;
  excerpt?: string | null;
  slug: string | null;
  publishedAt?: string | null;
  storyType?: string | null;
  image: any;
  authors: Array<{ name: string }>;
};

interface HomeNewsSectionProps {
  title: string;
  href: string;
  badge?: string;
  description?: string;
  articles: HomeArticle[] | null | undefined;
  layout?: "grid-2" | "grid-3" | "grid-2-plus-horizontal";
  sectionId?: string;
  className?: string;
}

function toArticleProps(article: HomeArticle) {
  return {
    title: article.title,
    image: article.image,
    slug: article.slug,
    author: article.authors[0]?.name ?? "Redshirt Sports",
    date: article.publishedAt,
    category: article.storyType ?? undefined,
    relativeDate: true,
  };
}

export function HomeNewsSection({
  title,
  href,
  badge,
  description,
  articles,
  layout = "grid-2",
  sectionId,
  className,
}: HomeNewsSectionProps) {
  if (!articles?.length) return null;

  const sectionSlug =
    sectionId ?? `section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  if (layout === "grid-3") {
    return (
      <section className={cn("mb-8", className)} aria-labelledby={sectionSlug}>
        <SectionHeader
          title={title}
          href={href}
          badge={badge}
          id={sectionSlug}
        />
        {description ? (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className={featuredArticleGridClass(articles.length, 3)}>
          {articles.map((article) => (
            <ArticleCard
              key={article._id}
              variant="medium"
              {...toArticleProps(article)}
            />
          ))}
        </div>
      </section>
    );
  }

  if (layout === "grid-2-plus-horizontal") {
    const featured = articles.slice(0, 2);
    const listItems = articles.slice(2);

    return (
      <section className={cn("mb-8", className)} aria-labelledby={sectionSlug}>
        <SectionHeader
          title={title}
          href={href}
          badge={badge}
          id={sectionSlug}
        />
        {description ? (
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className={featuredArticleGridClass(featured.length, 2)}>
          {featured.map((article) => (
            <ArticleCard
              key={article._id}
              variant="medium"
              {...toArticleProps(article)}
            />
          ))}
        </div>
        {listItems.length > 0 ? (
          <div className="mt-6 space-y-4 divide-y divide-border">
            {listItems.map((article) => (
              <div key={article._id} className="pt-4 first:pt-0">
                <ArticleCard
                  variant="horizontal"
                  {...toArticleProps(article)}
                />
              </div>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={cn("mb-8", className)} aria-labelledby={sectionSlug}>
      <SectionHeader title={title} href={href} badge={badge} id={sectionSlug} />
      {description ? (
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className={featuredArticleGridClass(articles.length, 2)}>
        {articles.map((article) => (
          <ArticleCard
            key={article._id}
            variant="medium"
            {...toArticleProps(article)}
          />
        ))}
      </div>
    </section>
  );
}
