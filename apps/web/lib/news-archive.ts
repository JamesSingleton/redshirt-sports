import { STORY_TYPES } from "@redshirt-sports/sanity/story-types";
import { differenceInDays, format, parseISO } from "date-fns";

import type { HomePost } from "@/components/home/home-page-content";
import { formatRelativeTime } from "@/lib/format-relative-time";

export type NewsArchiveSearchParams = {
  page?: string;
  type?: string;
  sort?: string;
  q?: string;
};

export type ArchiveSort = "newest" | "oldest";

/** Options for the archive "Type" filter: the article formats. */
export const STORY_TYPE_OPTIONS = STORY_TYPES.map((type) => ({
  value: type.value,
  label: type.title,
}));

/**
 * The format a `type` param names. Accepts the value ("game-recap") or, for
 * links made before the filter used formats, the label ("Game Recap").
 * Unknown values filter nothing.
 */
export function parseStoryTypeParam(value: string | undefined): string {
  const wanted = (value ?? "").trim().toLowerCase();
  if (!wanted) return "";
  const match = STORY_TYPES.find(
    (type) => type.value === wanted || type.title.toLowerCase() === wanted,
  );
  return match?.value ?? "";
}

export function parseNewsArchiveFilters(
  searchParams: NewsArchiveSearchParams,
): {
  pageIndex: number;
  search: string;
  storyType: string;
  sort: ArchiveSort;
} {
  const pageIndex = Math.max(
    1,
    Number.parseInt(searchParams.page ?? "1", 10) || 1,
  );
  const search = (searchParams.q ?? "").trim();
  const storyType = parseStoryTypeParam(searchParams.type);
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
