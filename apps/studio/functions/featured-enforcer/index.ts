import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

export const handler = documentEventHandler(async ({ context, event }) => {
  const client = createClient({
    ...context.clientOptions,
    apiVersion: "2025-07-17",
    useCdn: false,
  });

  const { data } = event;
  const { local } = context;

  // Find all OTHER published posts currently marked as featured.
  // Explicitly exclude draft documents with the path() check so we only
  // touch published versions — avoids interfering with in-progress drafts.
  const otherFeaturedIds = await client.fetch<string[]>(
    `*[
      _type == "post"
      && featuredArticle == true
      && _id != $currentId
      && !(_id in path("drafts.**"))
    ]._id`,
    { currentId: data._id },
  );

  if (!otherFeaturedIds || otherFeaturedIds.length === 0) {
    console.log(
      `No other featured articles found. Document (${data._id}) is the sole featured article.`,
    );
    return;
  }

  console.log(
    `Found ${otherFeaturedIds.length} other featured article(s) to unfeature: ${otherFeaturedIds.join(", ")}`,
  );

  // Use a transaction so all patches succeed or fail together.
  const transaction = client.transaction();
  for (const id of otherFeaturedIds) {
    transaction.patch(id, { set: { featuredArticle: false } });
  }

  try {
    const result = await transaction.commit({ dryRun: local });
    console.log(
      local
        ? `(LOCAL TEST MODE - Content Lake not updated) Would have unfeatured ${otherFeaturedIds.length} article(s).`
        : `Successfully unfeatured ${otherFeaturedIds.length} article(s).`,
      result,
    );
  } catch (error) {
    console.error("Error unfeaturing other articles:", error);
  }
});
