import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: "vX",
    useCdn: false,
  });
  const { data } = event;
  const { local } = context;

  try {
    const result = await client.agent.action.generate({
      noWrite: local ? true : false,
      instructionParams: {
        content: {
          type: "field",
          path: "body",
        },
        tagsUsedInOtherPosts: {
          type: "groq",
          query:
            "array::unique(*[_type == 'post' && _id != $id && defined(tags)].tags[]->name)",
          params: {
            id: data._id,
          },
        },
      },
      instruction: `Based on the $content, create 3 relevant tags for the tags field. Attempt to use $tagsUsedInOtherPosts first when they fit the context. Prefer references to existing tag documents with matching names. Tags should be simple lowercase words with no brackets.`,
      target: {
        path: "tags",
      },
      documentId: data._id,
      schemaId: "_.schemas.default",
      forcePublishedWrite: true,
    });

    console.log(
      local
        ? "Generated tags (LOCAL TEST MODE - Content Lake not updated):"
        : "Generated tags:",
      result.tags,
    );
  } catch (error) {
    console.error("Error occurred during tag generation:", error);
  }
});
