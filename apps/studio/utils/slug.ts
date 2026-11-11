import type { SlugifierFn } from "sanity";
import {
  defineField,
  type FieldDefinition,
  getDraftId,
  getPublishedId,
  type SlugValidationContext,
} from "sanity";
import slugify from "slugify";

import type { PathnameParams } from "./types";

export function defineSlug(
  schema: PathnameParams = { name: "slug" },
): FieldDefinition<"slug"> {
  const slugOptions = schema?.options;

  return defineField({
    ...schema,
    name: schema.name ?? "slug",
    title: schema?.title ?? "URL",
    type: "slug",
    components: {
      ...schema.components,
      // field: schema.components?.field ?? PathnameFieldComponent,
    },
    options: {
      ...(slugOptions ?? {}),
      isUnique: slugOptions?.isUnique ?? isUnique,
    },
  });
}

export async function isUnique(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context;
  const client = getClient({ apiVersion: "2025-02-10" });
  const id = getPublishedId(document?._id ?? "");
  const draftId = getDraftId(id);
  const params = {
    draft: draftId,
    published: id,
    slug,
  };
  const query = "*[!(_id in [$draft, $published]) && slug.current == $slug]";
  const result = await client.fetch(query, params);
  return result.length === 0;
}

export const createSlug: SlugifierFn = (input) => {
  const slug = slugify(input, {
    lower: true,
    remove: /[^a-zA-Z0-9 ]/g,
    trim: true,
  });

  return slug;
};

/**
 * Unique among documents of the same type. Taxonomy types share slugs with
 * each other on purpose (the "naia" classification and the "naia" governing
 * body), so their uniqueness can't be checked across the whole dataset.
 */
export async function isUniqueWithinType(
  slug: string,
  context: SlugValidationContext,
): Promise<boolean> {
  const { document, getClient } = context;
  if (!document) return true;
  const client = getClient({ apiVersion: "2025-02-10" });
  const id = getPublishedId(document._id);
  const count = await client.fetch<number>(
    "count(*[_type == $type && !(_id in [$draft, $published]) && slug.current == $slug])",
    { type: document._type, draft: getDraftId(id), published: id, slug },
  );
  return count === 0;
}
