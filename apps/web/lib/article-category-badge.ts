import { getStoryTypeLabel } from "@/lib/story-type-labels";

export type ArticleCategoryBadge = {
  label: string;
  href?: string;
};

type ArticleSport = {
  title?: string | null;
  slug?: string | null;
} | null;

export function getArticleCategoryBadge(
  sport: ArticleSport,
  storyType?: string | null,
): ArticleCategoryBadge | null {
  if (sport?.title && sport.slug) {
    return {
      label: sport.title,
      href: `/college/${sport.slug}/news`,
    };
  }

  const storyLabel = getStoryTypeLabel(storyType);
  if (storyLabel) {
    return { label: storyLabel };
  }

  return null;
}
