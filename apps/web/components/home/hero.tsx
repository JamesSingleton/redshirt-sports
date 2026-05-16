import type { QueryHomePageDataResult } from "@redshirt-sports/sanity/types";
import Link from "next/link";

import ArticleCard from "@/components/article-card";
import { DivisionBadge } from "@/components/division-badge";
import FormatDate from "@/components/format-date";
import CustomImage from "../sanity-image";

const Hero = ({ heroPosts }: { heroPosts: QueryHomePageDataResult }) => {
  const heroArticle = heroPosts[0]!;
  const recentArticles = heroPosts.slice(1);

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative aspect-[2/1] overflow-hidden rounded-lg shadow-lg">
              <CustomImage
                image={heroArticle.mainImage}
                className="h-full w-full object-cover object-top"
              />
              <div className="absolute top-4 left-4">
                <DivisionBadge division="fbs" size="md" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <h1 className="text-2xl font-extrabold leading-tight lg:text-4xl text-balance">
                <Link 
                  href={`/${heroArticle.slug}`} 
                  prefetch={false}
                  className="hover:text-primary transition-colors"
                >
                  {heroArticle.title}
                </Link>
              </h1>
              <p className="text-muted-foreground line-clamp-2 text-lg">
                {heroArticle.excerpt}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  href={`/authors/${heroArticle.authors[0]?.slug}`}
                  className="flex items-center gap-2"
                  prefetch={false}
                >
                  <CustomImage
                    image={heroArticle.authors[0]?.image}
                    width={32}
                    height={32}
                    className="size-8 rounded-full"
                  />
                  <span className="font-semibold text-primary hover:underline">
                    {heroArticle.authors[0]?.name}
                  </span>
                </Link>
                {heroArticle.publishedAt && (
                  <span className="text-muted-foreground">
                    <FormatDate dateString={heroArticle.publishedAt} />
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
            {recentArticles.map((article) => (
              <ArticleCard
                title={article.title}
                date={article.publishedAt}
                image={article.mainImage}
                imagePriority={true}
                slug={article.slug}
                author={article.authors[0]!.name}
                key={article._id}
                headingLevel="h2"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
