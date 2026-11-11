/**
 * An article's format: what kind of piece it is. Beats (Recruiting, Transfer
 * Portal, NIL) and series (Bowl Projections, FCS Top 25) are tags, not
 * formats; an analysis can be about the transfer portal.
 *
 * Shared by the Studio (field options, templates, validation) and the site
 * (labels, archive filter, structured data), so they can't drift apart.
 *
 * `schemaType` is the schema.org NewsArticle subtype that says what the piece
 * is to search engines: reporting, analysis, opinion, or background.
 */
export const STORY_TYPES = [
  { title: "News", value: "news", schemaType: "ReportageNewsArticle" },
  { title: "Analysis", value: "analysis", schemaType: "AnalysisNewsArticle" },
  { title: "Feature", value: "feature", schemaType: "NewsArticle" },
  { title: "Opinion", value: "opinion", schemaType: "OpinionNewsArticle" },
  {
    title: "Explainer",
    value: "explainer",
    schemaType: "BackgroundNewsArticle",
  },
  { title: "Q&A", value: "interview", schemaType: "NewsArticle" },
  { title: "Notebook", value: "notebook", schemaType: "ReportageNewsArticle" },
  { title: "Rankings", value: "rankings", schemaType: "AnalysisNewsArticle" },
  {
    title: "Predictions",
    value: "predictions",
    schemaType: "AnalysisNewsArticle",
  },
  {
    title: "Game Preview",
    value: "game-preview",
    schemaType: "AnalysisNewsArticle",
  },
  {
    title: "Game Recap",
    value: "game-recap",
    schemaType: "ReportageNewsArticle",
  },
] as const;

export type StoryType = (typeof STORY_TYPES)[number]["value"];
export type StorySchemaType = (typeof STORY_TYPES)[number]["schemaType"];

/** Formats that are about one game, and so should name it. */
export const GAME_STORY_TYPES: readonly StoryType[] = [
  "game-preview",
  "game-recap",
];

export function storyTypeTitle(
  value: string | null | undefined,
): string | undefined {
  return STORY_TYPES.find((type) => type.value === value)?.title;
}

/** The schema.org type for a format; plain NewsArticle when unknown. */
export function storySchemaType(
  value: string | null | undefined,
): StorySchemaType {
  return (
    STORY_TYPES.find((type) => type.value === value)?.schemaType ??
    "NewsArticle"
  );
}

export function isStoryType(value: unknown): value is StoryType {
  return STORY_TYPES.some((type) => type.value === value);
}
