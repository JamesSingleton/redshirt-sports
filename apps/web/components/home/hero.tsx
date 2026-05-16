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
    <section className="py-6 sm:py-10 lg:py-12">
      <div className="container">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Hero Article */}
          <div className="lg:col-span-8">
            <article className="group">
              <div className="relative aspect-[16/9] overflow-hidden">
                <CustomImage
                  image={heroArticle.mainImage}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <DivisionBadge division="fbs" size="md" className="mb-4" />
                  <h1 className="text-2xl font-extrabold leading-tight text-white md:text-3xl lg:text-4xl text-balance">
                    <Link 
                      href={`/${heroArticle.slug}`} 
                      prefetch={false}
                      className="hover:underline decoration-primary underline-offset-4"
                    >
                      {heroArticle.title}
                    </Link>
                  </h1>
                  <p className="mt-3 text-white/80 line-clamp-2 text-base md:text-lg max-w-3xl">
                    {heroArticle.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
                    <span className="font-bold text-white">
                      {heroArticle.authors[0]?.name}
                    </span>
                    <span className="text-primary">|</span>
                    {heroArticle.publishedAt && (
                      <FormatDate dateString={heroArticle.publishedAt} />
                    )}
                  </div>
                </div>
              </div>
            </article>
          </div>
          
          {/* Sidebar Articles */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {recentArticles.map((article, index) => (
              <article key={article._id} className="group flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden">
                  <CustomImage
                    image={article.mainImage}
                    width={112}
                    height={80}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <DivisionBadge 
                    division={index === 0 ? "fcs" : index === 1 ? "d2" : "d3"} 
                    size="sm" 
                    className="self-start mb-2" 
                  />
                  <h2 className="text-sm font-bold leading-tight line-clamp-2">
                    <Link
                      href={`/${article.slug}`}
                      className="hover:text-primary transition-colors"
                      prefetch={false}
                    >
                      {article.title}
                    </Link>
                  </h2>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
