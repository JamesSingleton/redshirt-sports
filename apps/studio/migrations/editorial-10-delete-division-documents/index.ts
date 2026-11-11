import { defineMigration, delete_ } from "sanity/migrate";

/**
 * Deletes the retired `division` documents. Run last, after
 * `editorial-01-division-to-classification` has been applied and the web and
 * admin apps that read classifications are deployed.
 *
 * A division that anything still references is left alone and reported.
 */
export default defineMigration({
  title: "Delete division documents",
  documentTypes: ["division"],
  migrate: {
    async document(doc, context) {
      const id = doc._id.replace(/^drafts\./, "");
      const referrers = await context.client.fetch<number>(
        "count(*[references($id)])",
        { id },
      );
      if (referrers > 0) {
        console.warn(
          `Skipping division ${doc._id}: ${referrers} document(s) still reference it. Run editorial-01-division-to-classification first.`,
        );
        return [];
      }
      return [delete_(doc._id)];
    },
  },
});
