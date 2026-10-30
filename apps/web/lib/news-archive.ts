import { differenceInDays, format, parseISO } from "date-fns";

import type { HomePost } from "@/components/home/home-page-content";
import { formatRelativeTime } from "@/lib/format-relative-time";

export type NewsArchiveSearchParams = {
  page?: string;
  type?: string;
  sort?: string;
  q?: string;
};

export const STORY_TYPE_OPTIONS = [
  "News",
  "Analysis",
  "Feature",
  "Rankings",
  "Podcast",
  "Opinion",
] as const;

export function parseNewsArchiveFilters(
  searchParams: NewsArchiveSearchParams,
): {
  pageIndex: number;
  search: string;
  storyType: string;
  sort: "newest" | "oldest";
} {
  const pageIndex = Math.max(
    1,
    Number.parseInt(searchParams.page ?? "1", 10) || 1,
  );
  const search = (searchParams.q ?? "").trim();
  const storyType = (searchParams.type ?? "").trim();
  const sort = searchParams.sort === "oldest" ? "oldest" : "newest";

  return { pageIndex, search, storyType, sort };
}

export function postArchiveKicker(post: HomePost): string {
  const tag = post.tagNames?.[0];
  if (tag) return tag;
  if (post.divisionLabel) return post.divisionLabel;
  return "News";
}

/** Relative label for recent posts; calendar date for older ones. */
export function formatArchivePublishedAt(
  iso: string,
  now = new Date(),
): string {
  const date = parseISO(iso);
  if (differenceInDays(now, date) < 7) {
    return formatRelativeTime(date);
  }
  return format(date, "M/d/yyyy");
}
