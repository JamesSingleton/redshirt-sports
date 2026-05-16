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
    <section className="pb-16 lg:pb-20">
      <div className="container">
        <SectionHeader title={title} viewAllHref={slug} />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Featured Article */}
          <div className={cn(
            "lg:col-span-7",
            imageFirst && "lg:order-2"
          )}>
            <article className="group">
              <div className="relative overflow-hidden">
                <CustomImage
                  image={firstArticle.mainImage}
                  width={860}
                  height={573}
                  className="aspect-[3/2] w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                {division && (
                  <div className="absolute top-0 left-0">
                    <DivisionBadge division={division} size="md" />
                  </div>
                )}
              </div>
              <div className="pt-5">
                <h3 className="text-xl font-extrabold leading-tight lg:text-2xl">
                  <Link
                    href={`/${firstArticle.slug}`}
                    className="hover:text-primary transition-colors"
                    prefetch={false}
                  >
                    {firstArticle.title}
                  </Link>
                </h3>
                <p className="mt-3 text-muted-foreground line-clamp-2">{firstArticle.excerpt}</p>
                <div className="mt-3 flex items-center gap-3 text-sm">
                  <span className="font-bold">{firstArticle.authors[0]?.name}</span>
                  {firstArticle.publishedAt && (
                    <>
                      <span className="text-primary">|</span>
                      <span className="text-muted-foreground">
                        <FormatDate dateString={firstArticle.publishedAt} />
                      </span>
                    </>
                  )}
                </div>
              </div>
            </article>
          </div>
          
          {/* Secondary Articles */}
          <div className={cn(
            "lg:col-span-5",
            imageFirst && "lg:order-1"
          )}>
            <div className="flex flex-col divide-y divide-border">
              {remainingArticles.map((article) => (
                <article key={article._id} className="group flex gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="relative w-32 h-24 flex-shrink-0 overflow-hidden">
                    <CustomImage
                      image={article.mainImage}
                      width={128}
                      height={96}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {division && (
                      <div className="absolute top-0 left-0">
                        <DivisionBadge division={division} size="sm" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h4 className="text-sm font-bold leading-snug line-clamp-2">
                      <Link
                        href={`/${article.slug}`}
                        className="hover:text-primary transition-colors"
                        prefetch={false}
                      >
                        {article.title}
                      </Link>
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(article.authors[0] as unknown as Author)?.name}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
