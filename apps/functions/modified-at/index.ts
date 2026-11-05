import { createClient } from "@sanity/client";
import { documentEventHandler } from "@sanity/functions";

import { decideModifiedAt } from "./change-size";

type ModifiedAtEventData = {
  _id: string;
  publishedAt?: string | null;
  titleChanged?: boolean | null;
  beforeText?: string | null;
  afterText?: string | null;
};

/**
 * Stamps `modifiedAt` when a published post changes in substance: a new
 * title, or 10+ words of body text added or removed. Typo fixes and edits in
 * the first hour after publishing leave it alone. The blueprint filter only
 * watches `title` and `body`, so this function's own write can't re-trigger it.
 */
export const handler = documentEventHandler<ModifiedAtEventData>(
  async ({ context, event }) => {
    const { data } = event;
    const decision = decideModifiedAt(data);

    if (!decision.update) {
      console.log(`Skipped modifiedAt for ${data._id}: ${decision.reason}`);
      return;
    }

    const client = createClient({
      ...context.clientOptions,
      apiVersion: "2025-07-17",
      useCdn: false,
    });
    const modifiedAt = new Date().toISOString();

    try {
      await client
        .patch(data._id)
        .set({ modifiedAt })
        .commit({ dryRun: context.local });
      console.log(
        `${context.local ? "(LOCAL TEST MODE - Content Lake not updated) " : ""}Set modifiedAt for ${data._id} to ${modifiedAt} (${decision.reason})`,
      );
    } catch (error) {
      console.error("Error setting modifiedAt timestamp:", error);
    }
  },
);
