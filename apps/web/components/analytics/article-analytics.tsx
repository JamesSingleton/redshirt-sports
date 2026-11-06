"use client";

import { analytics } from "@redshirt-sports/analytics";
import { useEffect, useRef } from "react";

export type ArticleAnalyticsProps = {
  slug: string;
  title: string;
  sport?: string | null;
  storyType?: string | null;
  authors: string[];
  tags: string[];
  publishedAt?: string | null;
};

/**
 * Fires `article_viewed` on mount and `article_read_complete` once the reader
 * scrolls to the end of the article body. Renders a 1px sentinel, so place it
 * directly after the article body.
 */
export function ArticleAnalytics({
  slug,
  title,
  sport,
  storyType,
  authors,
  tags,
  publishedAt,
}: ArticleAnalyticsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Props are only used to build the event payload; keeping them out of the
  // effect deps stops a re-render with new array identities from re-firing.
  const propsRef = useRef({
    title,
    sport,
    storyType,
    authors,
    tags,
    publishedAt,
  });
  propsRef.current = { title, sport, storyType, authors, tags, publishedAt };

  useEffect(() => {
    const { title, sport, storyType, authors, tags, publishedAt } =
      propsRef.current;
    const properties = {
      slug,
      title,
      sport: sport ?? undefined,
      story_type: storyType ?? undefined,
      authors,
      author: authors[0],
      tags,
      published_at: publishedAt ?? undefined,
    };

    analytics?.capture("article_viewed", properties);

    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const startedAt = Date.now();
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        analytics?.capture("article_read_complete", {
          ...properties,
          seconds_to_end: Math.round((Date.now() - startedAt) / 1000),
        });
        observer.disconnect();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [slug]);

  return <div ref={sentinelRef} aria-hidden className="h-px w-full" />;
}
