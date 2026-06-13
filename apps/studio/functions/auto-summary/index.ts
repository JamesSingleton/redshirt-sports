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
      noWrite: !!local,
      instructionParams: {
        content: {
          type: "field",
          path: "body",
        },
      },
      instruction: `Based on the $content, write a summary that is between 140 and 160 characters.`,
      target: {
        path: "excerpt",
      },
      documentId: data._id,
      schemaId: "_.schemas.default",
      forcePublishedWrite: true,
    });

    console.log(
      local
        ? "Generated summary (LOCAL TEST MODE - Content Lake not updated):"
        : "Generated summary:",
      result.excerpt,
    );
  } catch (error) {
    console.error("Error occurred during summary generation:", error);
  }
});
