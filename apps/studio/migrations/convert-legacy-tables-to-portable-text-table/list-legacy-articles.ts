/**
 * Print local article URLs that still contain legacy @sanity/table rows.
 *
 * Run from apps/studio:
 *   pnpm migration:tables:list
 */
import "../load-env.js";
import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  useCdn: false,
});

async function main() {
  const docs = await client.fetch<
    Array<{ title: string; slug: string }>
  >(/* groq */ `
    *[_type == "post" && defined(body) && count(body[_type == "table" && count(rows[_type == "tableRow"]) > 0]) > 0]{
      title,
      "slug": slug.current
    } | order(title asc)
  `);

  if (!docs.length) {
    console.log("No posts with legacy table rows found.");
    return;
  }

  console.log(`Found ${docs.length} posts with legacy tables:\n`);
  for (const doc of docs) {
    console.log(`http://localhost:3000/${doc.slug}`);
    console.log(`  ${doc.title}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
