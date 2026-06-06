import type { SlugifierFn } from "sanity";
import slugify from "slugify";

export function createSchoolSlugSource(
  doc: Record<string, unknown> | undefined,
): string {
  const shortName = (doc?.shortName as string) || (doc?.name as string) || "";
  const nickname = doc?.nickname as string | undefined;

  if (!shortName) return "";
  if (!nickname) return shortName;

  return `${shortName} ${nickname}`;
}

export const createSchoolSlug: SlugifierFn = (input) => {
  return slugify(input, {
    lower: true,
    remove: /[^a-zA-Z0-9 ]/g,
    trim: true,
  });
};
