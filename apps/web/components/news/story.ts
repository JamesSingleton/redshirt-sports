/**
 * Minimal structural shape shared by every Sanity post projection the
 * blueprint story components render (home, news lists, related posts).
 */
export type StoryAuthor = {
  name?: string | null;
  slug?: string | null;
  image?: unknown;
  archived?: boolean | null;
};

export type StoryLike = {
  _id: string;
  title: string;
  slug?: string | { current?: string | null } | null;
  excerpt?: string | null;
  image?: unknown;
  publishedAt?: string | null;
  authors?: ReadonlyArray<StoryAuthor> | null;
};

export function getStoryPath(story: Pick<StoryLike, "slug">): string | null {
  const { slug } = story;
  if (slug == null) return null;
  const value = typeof slug === "string" ? slug : slug.current;
  return value ? `/${value}` : null;
}

export function getPrimaryAuthor(
  story: Pick<StoryLike, "authors">,
): StoryAuthor | undefined {
  return story.authors?.[0] ?? undefined;
}
