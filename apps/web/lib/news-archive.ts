import { STORY_TYPES } from "@redshirt-sports/sanity/story-types";
import { differenceInDays, format, parseISO } from "date-fns";

import type { HomePost } from "@/components/home/home-page-content";
import { formatRelativeTime } from "@/lib/format-relative-time";

export type NewsArchiveSearchParams = {
  page?: string;
  type?: string;
  sort?: string;
  q?: string;
  /** Cursor from the previous page's "Next" link; see `archiveCursor`. */
  after?: string;
};

export type ArchiveSort = "newest" | "oldest";

/** Where the next page starts: just past this article in the current sort. */
export type ArchiveCursor = { at: string; id: string };

const SORT_PREFIX: Record<ArchiveSort, string> = { newest: "n", oldest: "o" };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const DOCUMENT_ID = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * The `after` value for the link to the page following `lastPost`. It names
 * the sort it was made for, so a cursor carried into the other sort order is
 * ignored instead of skipping the wrong articles.
 */
export function archiveCursor(
  lastPost: { publishedAt?: string | null; _id: string } | undefined,
  sort: ArchiveSort,
): string | undefined {
  if (!lastPost?.publishedAt) return undefined;
  return `${SORT_PREFIX[sort]}~${lastPost.publishedAt}~${lastPost._id}`;
}

/** Parse an `after` value; anything malformed or for another sort is ignored. */
export function parseArchiveCursor(
  value: string | undefined,
  sort: ArchiveSort,
): ArchiveCursor | null {
  const [prefix, at, id, ...rest] = (value ?? "").split("~");
  if (rest.length > 0 || prefix !== SORT_PREFIX[sort]) return null;
  if (!at || !ISO_DATE.test(at) || !id || !DOCUMENT_ID.test(id)) return null;
  return { at, id };
}

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
  cursor: ArchiveCursor | null;
} {
  const pageIndex = Math.max(
    1,
    Number.parseInt(searchParams.page ?? "1", 10) || 1,
  );
  const search = (searchParams.q ?? "").trim();
  const storyType = parseStoryTypeParam(searchParams.type);
  const sort = searchParams.sort === "oldest" ? "oldest" : "newest";
  // Page 1 never needs a cursor.
  const cursor =
    pageIndex > 1 ? parseArchiveCursor(searchParams.after, sort) : null;

  return { pageIndex, search, storyType, sort, cursor };
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
