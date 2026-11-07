import { documentEventHandler } from "@sanity/functions";

import { type PostCacheTagsEventData, postCacheTags } from "./tags";

/**
 * Expires the web app's post-list cache tags when a post is created, edited,
 * or deleted (unpublishing deletes the published document). Post lists skip
 * Sanity's type-wide sync tag, so the `cache-invalidate` function never
 * reaches them; see `packages/sanity/src/cache-tags.ts`.
 *
 * The blueprint projection sends school and author refs from both before and
 * after the change, so a school or author removed from a post drops it too.
 */
export const handler = documentEventHandler<PostCacheTagsEventData>(
  async ({ context, event }) => {
    if (!event.data?._id) {
      console.error("Post event without an _id; nothing to expire", event.data);
      return;
    }
    const cacheTags = postCacheTags(event.data);
    const target = new URL(
      "https://www.redshirtsports.com/api/revalidate-tags",
    );

    if (context.local) {
      console.log("(LOCAL TEST MODE - not sent) Would expire", cacheTags);
      return;
    }

    const secret = process.env.CACHE_REVALIDATE_SECRET;
    if (!secret) {
      console.error(
        "CACHE_REVALIDATE_SECRET is not set; post list tags not expired",
        cacheTags,
      );
      return;
    }

    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, cacheTags }),
      });
      if (res.ok) {
        console.info(`Expired ${cacheTags.length} post list tags`, cacheTags);
      } else {
        console.error(
          `Non-OK response from ${target}`,
          res.status,
          await res.text(),
        );
      }
    } catch (error) {
      console.error(`Error expiring post list tags via ${target}`, error);
    }
  },
);
