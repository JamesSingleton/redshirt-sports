import type { QueryPostSlugDataResult } from "@redshirt-sports/sanity/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { ArticleByline } from "@/components/article/article-byline";
import { ArticleRelatedPosts } from "@/components/article/article-related-posts";
import { ArticleSidebar } from "@/components/article/article-sidebar";
import { ArticleTaggedTeamsRow } from "@/components/article/article-tagged-teams-row";
import { RichText } from "@/components/rich-text";
import CustomImage, { IMAGE_SIZES } from "@/components/sanity-image";
import { ArticleHeroTransition } from "@/components/view-transitions/article-hero-transition";
import type { AdvertisementCreative } from "@/lib/advertisement";
import {
  articleKicker,
  articleTeamsInStory,
  buildArticleBreadcrumbs,
} from "@/lib/article-page";
import { getArticleRelatedPosts } from "@/lib/article-related";
import type { MostReadItem } from "@/lib/most-read-data";
import type { RankingsWidgetPoll } from "@/lib/rankings-widget-data";

type ArticlePost = NonNullable<QueryPostSlugDataResult>;

export function ArticlePageContent({
  post,
  slug,
  readingTimeMinutes,
  mostRead,
  rankingsPolls,
  advertisement,
}: {
  post: ArticlePost;
  slug: string;
  readingTimeMinutes: number;
  mostRead: MostReadItem[];
  rankingsPolls: RankingsWidgetPoll[];
  advertisement: AdvertisementCreative | null;
}) {
  const breadcrumbs = buildArticleBreadcrumbs(post);
  const teamsInStory = articleTeamsInStory(post);
  const primaryAuthor = post.authors?.[0];
  const relatedArticles = getArticleRelatedPosts(post);
  const moreFromAuthor =
    (
      post as ArticlePost & {
        moreFromAuthor?: Array<{ _id: string; title: string; slug: string }>;
      }
    ).moreFromAuthor ?? [];

  return (
    <div className="mx-auto max-w-site px-4 lg:px-6">
      {breadcrumbs.length > 0 ? (
        <nav
          className="flex flex-wrap items-center gap-1 pt-5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((item, index) => (
            <span
              key={`${index}-${item.title}`}
              className="inline-flex items-center gap-1"
            >
              {index > 0 ? (
                <ChevronRight className="size-3 shrink-0" aria-hidden />
              ) : null}
              {index === breadcrumbs.length - 1 ? (
                <span className="text-foreground">{item.title}</span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground"
                  prefetch={false}
                >
                  {item.title}
                </Link>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="grid gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <div className="kicker text-primary">{articleKicker(post)}</div>
          <h1
            id="article-title"
            className="mt-2 max-w-4xl font-display text-[2.4rem] font-extrabold uppercase leading-[0.98] lg:text-headline-lg"
          >
            {post.title}
          </h1>
          {post.excerpt ? (
            <p
              id="article-excerpt"
              className="mt-4 max-w-3xl font-serif text-xl text-muted-foreground"
            >
              {post.excerpt}
            </p>
          ) : null}

          <ArticleByline
            authors={post.authors ?? []}
            publishedAt={post.publishedAt}
            updatedAt={post._updatedAt}
            readingTimeMinutes={readingTimeMinutes}
            slug={slug}
            title={post.title}
          />

          {post.image ? (
            <figure className="mt-6">
              <ArticleHeroTransition slug={slug}>
                <CustomImage
                  image={post.image}
                  width={1200}
                  height={675}
                  className="aspect-video w-full rounded-xl object-cover"
                  priority
                  mode="cover"
                  sizes={IMAGE_SIZES.articleHero}
                />
              </ArticleHeroTransition>
              {post.image.credit ? (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {post.image.caption
                    ? `${post.image.caption} · Photo: ${post.image.credit}`
                    : `Photo: ${post.image.credit}`}
                </figcaption>
              ) : post.image.caption ? (
                <figcaption className="mt-2 text-sm text-muted-foreground">
                  {post.image.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          <ArticleTaggedTeamsRow teams={teamsInStory} />

          <RichText
            richText={post.body}
            className="prose-headings:font-display prose-headings:font-bold prose-headings:uppercase prose-headings:not-prose prose-a:text-primary prose-a:underline-offset-2 mx-auto mt-8 max-w-prose font-serif text-[1.15rem] leading-[1.7] prose-zinc dark:prose-invert [&_p]:mb-5"
          />

          <ArticleRelatedPosts posts={relatedArticles} />
        </article>

        <ArticleSidebar
          mostRead={mostRead}
          rankingsPolls={rankingsPolls}
          moreFromAuthor={moreFromAuthor}
          authorName={primaryAuthor?.archived ? null : primaryAuthor?.name}
          advertisement={advertisement}
        />
      </div>
    </div>
  );
}
