import type { QueryMegaboardArticlesResult } from "@redshirt-sports/sanity/types";
import Link from "next/link";

import RelativePublishDate from "@/components/relative-publish-date";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { getStoryTypeLabel } from "@/lib/story-type-labels";

interface MegaboardProps {
  articles: QueryMegaboardArticlesResult;
}

export function Megaboard({ articles }: MegaboardProps) {
  if (articles.length === 0) return null;

  const featuredArticle = articles[0]!;
  const sideArticles = articles.slice(1, 5);
  const featuredCategory = getStoryTypeLabel(featuredArticle.storyType);

  return (
    <div className="py-4">
      <div className="container px-4">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="min-w-0 lg:flex-[7]">
            <Link
              href={`/${featuredArticle.slug}`}
              prefetch={false}
              className="group block h-full"
            >
              <div className="relative aspect-video h-full overflow-hidden rounded-lg lg:aspect-auto">
                <CustomImage
                  image={featuredArticle.image}
                  width={900}
                  height={506}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  priority
                  mode="cover"
                  quality={70}
                  sizes={IMAGE_SIZES.homeHero}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute right-0 bottom-0 left-0 p-4 md:p-6">
                  {featuredCategory ? (
                    <span className="mb-2 inline-block rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      {featuredCategory}
                    </span>
                  ) : null}
                  <h2 className="text-xl leading-tight font-bold text-white group-hover:underline md:text-2xl lg:text-3xl">
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.excerpt ? (
                    <p className="mt-2 hidden text-sm text-gray-300 md:block md:text-base">
                      {featuredArticle.excerpt}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex min-h-0 flex-col gap-3 lg:flex-[5]">
            {sideArticles.map((article, index) => (
              <Link
                key={article._id}
                href={`/${article.slug}`}
                prefetch={false}
                className="group flex min-h-0 flex-1 gap-4 rounded-lg bg-card p-3 shadow transition-shadow hover:shadow-md"
              >
                <div className="relative min-h-20 w-32 shrink-0 self-stretch overflow-hidden rounded-md sm:min-h-24 sm:w-36">
                  <CustomImage
                    image={article.image}
                    width={144}
                    height={112}
                    className="absolute inset-0 h-full w-full object-cover"
                    priority={index === 0}
                    mode="cover"
                    quality={65}
                    sizes="(max-width: 1024px) 128px, 144px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                  <h3 className="line-clamp-3 text-base leading-snug font-semibold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                    {article.title}
                  </h3>
                  {article.publishedAt ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      <RelativePublishDate dateString={article.publishedAt} />
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
