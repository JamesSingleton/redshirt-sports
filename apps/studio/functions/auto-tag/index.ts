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
      },
      instruction: `Based on the $content, select up to 3 relevant tags that best fit the content.`,
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
