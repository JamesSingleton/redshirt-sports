import type { HomePost } from "@/components/home/home-page-content";

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

export type NewsDayGroup = {
  id: string;
  label: string;
  posts: HomePost[];
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatDayLabel(dayKeyStr: string, now = new Date()): string {
  const parts = dayKeyStr.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dayDate = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayOnly = new Date(
    dayDate.getFullYear(),
    dayDate.getMonth(),
    dayDate.getDate(),
  );

  const weekday = dayDate.toLocaleDateString("en-US", { weekday: "short" });
  const monthDay = dayDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (dayOnly.getTime() === today.getTime()) {
    return `Today · ${weekday}, ${monthDay}`;
  }
  if (dayOnly.getTime() === yesterday.getTime()) {
    return `Yesterday · ${weekday}, ${monthDay}`;
  }
  return `${weekday}, ${monthDay}`;
}

export function groupPostsByDay(posts: HomePost[]): NewsDayGroup[] {
  const groups = new Map<string, HomePost[]>();

  for (const post of posts) {
    const published = post.publishedAt;
    if (!published) continue;
    const key = dayKey(published);
    const list = groups.get(key) ?? [];
    list.push(post);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, dayPosts]) => ({
      id: key,
      label: formatDayLabel(key),
      posts: dayPosts,
    }));
}

export function formatRiverTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
