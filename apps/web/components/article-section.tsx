import type {
  Author,
  QueryLatestCollegeSportsArticlesResult,
} from "@redshirt-sports/sanity/types";
import { cn } from "@redshirt-sports/ui/lib/utils";
import Link from "next/link";

import ArticleCard from "@/components/article-card";
import { DivisionBadge, type DivisionSlug } from "@/components/division-badge";
import FormatDate from "@/components/format-date";
import CustomImage from "@/components/sanity-image";
import { SectionHeader } from "@/components/section-header";

interface ArticleSectionProps {
  title: string;
  slug: string;
  articles: QueryLatestCollegeSportsArticlesResult;
  imageFirst?: boolean;
  division?: DivisionSlug | string;
}

export default function ArticleSection({
  title,
  slug,
  articles,
  imageFirst = false,
  division,
}: ArticleSectionProps) {
  const firstArticle = articles[0]!;
  const remainingArticles = articles.slice(1)!;

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 xl:pb-24">
      <div className="container">
        <SectionHeader title={title} viewAllHref={slug} />
        <div className="flex flex-col gap-6 md:flex-row">
          <div
            className={cn(
              "order-1 md:flex md:w-1/2 md:items-center xl:w-1/3",
              imageFirst ? "md:order-2" : "md:order-1",
            )}
          >
            <div className="space-y-3 md:flex-1">
              {division && <DivisionBadge division={division} size="md" />}
              <h3 className="text-2xl font-bold lg:text-3xl leading-tight">
                <Link
                  href={`/${firstArticle.slug}`}
                  className="hover:text-primary transition-colors"
                  prefetch={false}
                >
                  {firstArticle.title}
                </Link>
              </h3>
              <p className="text-muted-foreground line-clamp-3">{firstArticle.excerpt}</p>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href={`/authors/${firstArticle.authors[0]?.slug}`}
                  className="flex items-center gap-2"
                  prefetch={false}
                >
                  <CustomImage
                    image={firstArticle.authors[0]?.image}
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                  <span className="font-semibold text-primary hover:underline">
                    {firstArticle.authors[0]?.name}
                  </span>
                </Link>
                {firstArticle.publishedAt && (
                  <span className="text-muted-foreground">
                    <FormatDate dateString={firstArticle.publishedAt} />
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            className={cn(
              "md:w-1/2 xl:w-2/3",
              imageFirst ? "md:order-1" : "md:order-2",
            )}
          >
            <div className="relative overflow-hidden rounded-lg">
              <CustomImage
                image={firstArticle.mainImage}
                width={860}
                height={573}
                className="w-full overflow-hidden rounded-lg shadow-md"
              />
              {division && (
                <div className="absolute top-4 left-4">
                  <DivisionBadge division={division} size="md" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {remainingArticles.map((article) => (
            <ArticleCard
              title={article.title}
              date={article.publishedAt}
              image={article.mainImage}
              slug={article.slug}
              author={(article.authors[0] as unknown as Author)?.name}
              key={article._id}
              division={division}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
