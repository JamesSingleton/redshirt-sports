import { ComposeIcon } from "@sanity/icons/Compose";
import { SearchIcon } from "@sanity/icons/Search";
import type { FieldGroupDefinition } from "sanity";

export { STORY_TYPES, type StoryType } from "@/house-rules/post";

export const GROUP = {
  MAIN_CONTENT: "main-content",
  SEO: "seo",
};

export const GROUPS: FieldGroupDefinition[] = [
  {
    name: GROUP.MAIN_CONTENT,
    icon: ComposeIcon,
    title: "Content",
    default: true,
  },
  { name: GROUP.SEO, icon: SearchIcon, title: "Search & social" },
];

/** GROQ API version for Studio-side queries. */
export const API_VERSION = "2025-06-11";
