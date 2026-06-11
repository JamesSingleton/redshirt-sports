import { syncTagInvalidateEventHandler } from "@sanity/functions";

export const handler = syncTagInvalidateEventHandler(
  async ({ event, done }) => {
    const { syncTags } = event.data;

    const res = await fetch(
      "https://www.redshirtsports.xyz/api/revalidate-tags",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${process.env.SANITY_REVALIDATE_TAGS_SECRET}`,
        },
        body: JSON.stringify({ tags: syncTags }),
      },
    );
    console.log(`Revalidated ${syncTags.length} tags, HTTP ${res.status}`);

    const response = await done(syncTags);
    console.log(
      "Invalidation complete, Sanity responded with HTTP",
      response.status,
    );
  },
);
