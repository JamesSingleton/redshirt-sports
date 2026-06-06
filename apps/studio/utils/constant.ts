import { ComposeIcon, InsertAboveIcon, SearchIcon } from "@sanity/icons";
import type { FieldGroupDefinition } from "sanity";

export const GROUP = {
  SEO: "seo",
  MAIN_CONTENT: "main-content",
  OG: "og",
};

export const GROUPS: FieldGroupDefinition[] = [
  {
    name: GROUP.MAIN_CONTENT,
    icon: ComposeIcon,
    title: "Content",
    default: true,
  },
  { name: GROUP.SEO, icon: SearchIcon, title: "SEO" },
  {
    name: GROUP.OG,
    icon: InsertAboveIcon,
    title: "Open Graph",
  },
];

export const STORY_TYPES = [
  { title: "News", value: "news" },
  { title: "Recruiting", value: "recruiting" },
  { title: "Transfer Portal", value: "transfer" },
  { title: "Analysis", value: "analysis" },
  { title: "Opinion", value: "opinion" },
  { title: "Game Recap", value: "game-recap" },
] as const;

export type StoryType = (typeof STORY_TYPES)[number]["value"];
