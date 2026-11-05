import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

type Tag = {
  _id: string;
  name: string;
};

function randomKey() {
  return Math.random().toString(36).slice(2, 14);
}

function parseTagNames(value: unknown): string[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function toTagReferences(tagIds: string[]) {
  return tagIds.map((_ref) => ({
    _type: "reference" as const,
    _ref,
    _key: randomKey(),
  }));
}

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: "vX",
    useCdn: false,
  });
  const { data } = event;
  const { local } = context;

  try {
    const [availableTags, tagsUsedInOtherPosts] = await Promise.all([
      client.fetch<Tag[]>(`*[_type == "tag"] | order(name asc) {_id, name}`),
      client.fetch<string[]>(
        `array::unique(*[_type == 'post' && _id != $id && defined(tags)].tags[]->name)`,
        { id: data._id },
      ),
    ]);

    if (availableTags.length === 0) {
      console.log("Skipping auto-tag: no tag documents exist");
      return;
    }

    const result = await client.agent.action.generate({
      noWrite: true,
      instructionParams: {
        content: {
          type: "field",
          path: "body",
        },
        availableTagNames: {
          type: "constant",
          value: availableTags.map((tag) => tag.name).join(", "),
        },
        tagsUsedInOtherPosts: {
          type: "constant",
          value: tagsUsedInOtherPosts.join(", "),
        },
      },
      instruction: `Based on $content, select up to 3 tag names from $availableTagNames that best fit the article. Prefer names from $tagsUsedInOtherPosts when they fit. Copy each name exactly as it appears in $availableTagNames. Return only a comma-separated list of tag names and nothing else.`,
      target: {
        path: "excerpt",
      },
      documentId: data._id,
      schemaId: "_.schemas.default",
    });

    const tagsByName = new Map(
      availableTags.map((tag) => [tag.name.toLowerCase(), tag._id]),
    );
    const selectedTagIds = [
      ...new Set(
        parseTagNames(result.excerpt)
          .map((name) => tagsByName.get(name.toLowerCase()))
          .filter((id): id is string => Boolean(id)),
      ),
    ].slice(0, 3);

    const tags = toTagReferences(selectedTagIds);

    console.log(
      local
        ? "Generated tags (LOCAL TEST MODE - Content Lake not updated):"
        : "Generated tags:",
      tags,
    );

    if (tags.length > 0) {
      await client.patch(data._id).set({ tags }).commit({ dryRun: local });
    }
  } catch (error) {
    console.error("Error occurred during tag generation:", error);
  }
});
