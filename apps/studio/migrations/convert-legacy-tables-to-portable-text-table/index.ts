/**
 * Migrate legacy @sanity/table blocks to native Portable Text tables.
 *
 * Legacy shape:
 *   table.rows[] = { _type: "tableRow", cells: string[] }
 *
 * Native shape:
 *   table.headerRows + table.rows[] = { _type: "row", cells: [{ _type: "cell", value: block[] }] }
 *
 * Requires SANITY_API_WRITE_TOKEN (Editor) in apps/studio/.env.local.
 * Deploy the new web renderer BEFORE running the forward migration in production.
 *
 *   pnpm migration:tables:dry-run
 *   pnpm migration:tables:apply
 *
 * Roll back to legacy @sanity/table (if migrated too early):
 *   MIGRATION_SLUG=your-slug pnpm migration:tables:revert:dry-run
 *   MIGRATION_SLUG=your-slug pnpm migration:tables:revert
 *
 * Single article by slug (recommended first):
 *   MIGRATION_SLUG=did-texas-southern-pick-the-wrong-team-for-its-nrg-stadium-game pnpm migration:tables:dry-run
 *   MIGRATION_SLUG=did-texas-southern-pick-the-wrong-team-for-its-nrg-stadium-game pnpm migration:tables:apply
 *
 * Single document by _id:
 *   MIGRATION_ID=drafts.some-id pnpm migration:tables:apply
 */
import "../load-env.js";
import { createClient } from "@sanity/client";

import {
  convertPortableTextValue,
  type PortableTextValue,
  portableTextHasLegacyTables,
} from "./convert";

const token =
  process.env.SANITY_API_WRITE_TOKEN ??
  process.env.SANITY_AUTH_TOKEN ??
  process.env.SANITY_DEPLOY_TOKEN;

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  token,
  useCdn: false,
});

const dryRun = process.env.MIGRATION_DRY_RUN === "true";
const migrationSlug = process.env.MIGRATION_SLUG?.trim();
const migrationId = process.env.MIGRATION_ID?.trim();

type DocumentWithBody = {
  _id: string;
  _type: string;
  title?: string;
  slug?: string;
  body?: PortableTextValue;
};

function documentFilter(): string {
  if (migrationId) {
    return `_id == $migrationId`;
  }

  if (migrationSlug) {
    return `_type in ["post", "legal"] && slug.current == $migrationSlug`;
  }

  return `_type in ["post", "legal"] && defined(body) && count(body[_type == "table"]) > 0`;
}

async function migrate() {
  if (!token) {
    throw new Error(
      "Missing write token. Add SANITY_API_WRITE_TOKEN to apps/studio/.env.local (Editor permissions).",
    );
  }

  const documents = await client.fetch<DocumentWithBody[]>(
    /* groq */ `
    *[${documentFilter()}]{
      _id,
      _type,
      title,
      "slug": slug.current,
      body
    }
  `,
    { migrationId, migrationSlug },
  );

  if (!documents.length) {
    if (migrationSlug) {
      throw new Error(`No document found for slug "${migrationSlug}".`);
    }
    if (migrationId) {
      throw new Error(`No document found for id "${migrationId}".`);
    }
    console.log("No documents with tables found.");
    return;
  }

  let updated = 0;

  for (const document of documents) {
    if (!document.body) {
      console.log(`Skipping ${document._id}: no body field.`);
      continue;
    }

    if (!portableTextHasLegacyTables(document.body)) {
      console.log(
        `Skipping ${document.title ?? document._id}: no legacy table rows.`,
      );
      continue;
    }

    const nextBody = convertPortableTextValue(document.body);
    if (
      !nextBody ||
      JSON.stringify(nextBody) === JSON.stringify(document.body)
    ) {
      console.log(
        `Skipping ${document.title ?? document._id}: no changes needed.`,
      );
      continue;
    }

    updated += 1;
    const label = document.title ?? document.slug ?? document._id;
    console.log(
      `${dryRun ? "[dry run] Would update" : "Updating"} ${document._type}: ${label}`,
    );
    if (document.slug) {
      console.log(`  http://localhost:3000/${document.slug}`);
    }

    if (!dryRun) {
      await client.patch(document._id).set({ body: nextBody }).commit();
    }
  }

  console.log(
    `Migration complete. Checked ${documents.length} document(s); ${dryRun ? "would update" : "updated"} ${updated}.`,
  );
}

migrate().catch((error) => {
  if (error?.statusCode === 403) {
    console.error(
      "Write failed: your API token lacks update permission on this dataset.\n" +
        "Create an Editor token at https://sanity.io/manage → API → Tokens,\n" +
        "then set SANITY_API_WRITE_TOKEN in apps/studio/.env.local.\n" +
        "(SANITY_DEPLOY_TOKEN is for schema/studio deploy, not document edits.)",
    );
  }
  console.error(error);
  process.exit(1);
});
