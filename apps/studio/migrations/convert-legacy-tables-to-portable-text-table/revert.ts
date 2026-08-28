/**
 * Revert native PT tables back to legacy @sanity/table (for prod rollback).
 *
 * Use when data was migrated before the new web code was deployed.
 * Deploy the new renderer first, then run the forward migration again.
 *
 *   MIGRATION_SLUG=how-notre-dame-miami-benefits-the-black-college-football-hall-of-fame-classic pnpm migration:tables:revert:dry-run
 *   MIGRATION_SLUG=how-notre-dame-miami-benefits-the-black-college-football-hall-of-fame-classic pnpm migration:tables:revert
 */
import "../load-env.js";
import { createClient } from "@sanity/client";

import {
  type PortableTextValue,
  portableTextHasNativeTables,
  revertPortableTextValue,
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

async function revert() {
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

    if (!portableTextHasNativeTables(document.body)) {
      console.log(
        `Skipping ${document.title ?? document._id}: no native table rows.`,
      );
      continue;
    }

    const nextBody = revertPortableTextValue(document.body);
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
      `${dryRun ? "[dry run] Would revert" : "Reverting"} ${document._type}: ${label}`,
    );
    if (document.slug) {
      console.log(`  http://localhost:3000/${document.slug}`);
    }

    if (!dryRun) {
      await client.patch(document._id).set({ body: nextBody }).commit();
    }
  }

  console.log(
    `Revert complete. Checked ${documents.length} document(s); ${dryRun ? "would revert" : "reverted"} ${updated}.`,
  );
}

revert().catch((error) => {
  if (error?.statusCode === 403) {
    console.error(
      "Write failed: your API token lacks update permission on this dataset.\n" +
        "Create an Editor token at https://sanity.io/manage → API → Tokens,\n" +
        "then set SANITY_API_WRITE_TOKEN in apps/studio/.env.local.",
    );
  }
  console.error(error);
  process.exit(1);
});
