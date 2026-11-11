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
        title: {
          type: "field",
          path: "title",
        },
      },
      // Matches the Studio house rule for summaries (house-rules/limits.ts):
      // 120-160 characters reads best on cards and in search results.
      instruction: `Using $content, write a summary of 120 to 160 characters for the line under the headline $title on article cards and in search results. One or two sentences, plain language. Name the team or person and say what happened or why it matters. Do not repeat the headline word for word. No hashtags, emoji, or quotation marks.`,
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
