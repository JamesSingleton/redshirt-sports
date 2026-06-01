import type { Template } from "sanity";

const articleType = (value: string) => ({ articleType: value });

/**
 * Initial value templates for posts. Registered in sanity.config.ts.
 */
export const postTemplates: Template[] = [
  {
    id: "post-by-sport",
    title: "Article by sport",
    schemaType: "post",
    parameters: [{ name: "sportId", type: "string" }],
    value: ({ sportId }: { sportId: string }) => ({
      ...articleType("news"),
      sport: { _type: "reference", _ref: sportId },
    }),
  },
  {
    id: "post-college-wide",
    title: "College-wide article",
    description: "No sport — appears on /college/news",
    schemaType: "post",
    value: () => articleType("news"),
  },
  {
    id: "post-recruiting",
    title: "Recruiting article",
    schemaType: "post",
    value: () => articleType("recruiting"),
  },
  {
    id: "post-transfer",
    title: "Transfer portal article",
    schemaType: "post",
    value: () => articleType("transfer"),
  },
  {
    id: "post-game-recap",
    title: "Game recap",
    schemaType: "post",
    parameters: [{ name: "sportId", type: "string" }],
    value: ({ sportId }: { sportId?: string }) => ({
      ...articleType("game-recap"),
      ...(sportId
        ? { sport: { _type: "reference", _ref: sportId } }
        : {}),
    }),
  },
  {
    id: "post-analysis",
    title: "Analysis article",
    schemaType: "post",
    value: () => articleType("analysis"),
  },
  {
    id: "post-opinion",
    title: "Opinion article",
    schemaType: "post",
    value: () => articleType("opinion"),
  },
  {
    id: "post-podcast-notes",
    title: "Podcast notes",
    schemaType: "post",
    value: () => articleType("podcast-notes"),
  },
];
