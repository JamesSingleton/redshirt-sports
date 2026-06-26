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

export function getStoryTypeHref(storyType?: string | null): string {
  switch (storyType) {
    case "recruiting":
      return "/recruiting";
    case "transfer":
      return "/transfer-portal/news";
    default:
      return "/college/news";
  }
}
