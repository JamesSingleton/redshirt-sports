const STORY_TYPE_LABELS: Record<string, string> = {
  news: "News",
  recruiting: "Recruiting",
  transfer: "Transfer Portal",
  analysis: "Analysis",
  opinion: "Opinion",
  "game-recap": "Game Recap",
};

export function getStoryTypeLabel(storyType?: string | null): string | null {
  if (!storyType) return null;
  return STORY_TYPE_LABELS[storyType] ?? null;
}

export function getStoryTypeHref(
  storyType?: string | null,
  sportSlug?: string | null,
): string {
  switch (storyType) {
    case "recruiting":
      return sportSlug ? `/recruiting/${sportSlug}` : "/recruiting";
    case "transfer":
      return sportSlug
        ? `/college/${sportSlug}/transfer-portal/news`
        : "/college/transfer-portal/news";
    default:
      return sportSlug ? `/college/${sportSlug}/news` : "/college/news";
  }
}
