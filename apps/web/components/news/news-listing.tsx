import type React from "react";

import ArticleCard, { ArticleOverlayCard } from "@/components/article-card";
import PaginationControls from "@/components/pagination-controls";
import type CustomImage from "@/components/sanity-image";
import { perPage } from "@/lib/constants";

type ListingPost = {
  _id: string;
  title: string;
  slug: string | null;
  publishedAt?: string | null;
  image: Parameters<typeof CustomImage>[0]["image"];
  excerpt?: string | null;
  authors?: unknown[] | null;
};

function authorName(article: ListingPost) {
  const [author] = article.authors ?? [];
  return author && typeof author === "object" && "name" in author
    ? (author.name as string | null)
    : null;
}

/** Lead story on the first page, then a card grid and pagination. */
function Feed({
  posts,
  totalPosts,
  pageIndex,
}: {
  posts: ListingPost[];
  totalPosts: number;
  pageIndex: number;
}) {
  const lead = pageIndex === 1 ? posts[0] : undefined;
  const gridPosts = lead ? posts.slice(1) : posts;

  return (
    <div className="@container flex flex-col gap-10">
      {lead ? (
        <ArticleOverlayCard
          id={lead._id}
          title={lead.title}
          excerpt={lead.excerpt}
          image={lead.image}
          imagePriority
          slug={lead.slug}
          author={authorName(lead)}
          date={lead.publishedAt}
          imageClassName="aspect-4/3 sm:aspect-video @5xl:aspect-21/9"
        />
      ) : null}
      <Grid
        posts={gridPosts}
        totalPosts={totalPosts}
        priorityCount={lead ? 0 : 2}
      />
    </div>
  );
}

/** Card grid plus pagination, for listings without a lead story. */
function Grid({
  posts,
  totalPosts,
  priorityCount = 2,
}: {
  posts: ListingPost[];
  totalPosts: number;
  priorityCount?: number;
}) {
  return (
    <div className="@container flex flex-col gap-10">
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 @xl:grid-cols-2 @5xl:grid-cols-3">
          {posts.map((article, index) => (
            <ArticleCard
              key={article._id}
              id={article._id}
              title={article.title}
              image={article.image}
              slug={article.slug}
              author={authorName(article)}
              date={article.publishedAt}
              headingLevel="h2"
              imagePriority={index < priorityCount}
            />
          ))}
        </div>
      ) : null}
      {Math.ceil(totalPosts / perPage) > 1 ? (
        <PaginationControls totalPosts={totalPosts} />
      ) : null}
    </div>
  );
}

/**
 * Main column with an optional sidebar. Sidebar widgets can resolve to nothing
 * (e.g. a division without a poll), so the main column widens whenever the
 * aside ends up empty.
 */
function Layout({
  aside,
  children,
}: {
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group/listing container grid grid-cols-1 gap-8 pb-12 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-8 lg:group-has-[>aside:empty]/listing:col-span-12">
        {children}
      </div>
      <aside className="flex flex-col gap-6 empty:hidden lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
        {aside}
      </aside>
    </div>
  );
}

export const NewsListing = { Layout, Feed, Grid };
