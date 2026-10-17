# Convert `@sanity/table` data to built in Portable Text tables

This migration updates matching `post` and `legal` documents directly in the selected Sanity dataset. It replaces each document's `body` value, retaining every non-table block and converting legacy table rows from `_type: "tableRow"` with string cells to canonical `_type: "row"` objects with Portable Text cell values.

The migration preserves document IDs, drafts, table keys, and all non-table content. It adds `headerRows: 1` where the legacy table did not specify a header row.

## Find legacy tables

Run this GROQ query in Vision to find posts with the old table plugin data:

```groq
*[
  _type == "post" &&
  count(body[_type == "table" && count(rows[_type == "tableRow"]) > 0]) > 0
] | order(_updatedAt desc) [0...20] {
  _id,
  title,
  "slug": slug.current,
  _updatedAt
}
```

## Run the migration

Run a dry run first. It reads the dataset and prints the mutations without writing anything:

```sh
cd apps/studio
pnpm exec sanity migrations run convert-plugin-tables-to-portable-text
```

After reviewing the dry-run output, apply the migration to the configured dataset:

```sh
pnpm exec sanity migrations run convert-plugin-tables-to-portable-text --no-dry-run
```

### Run against one document

Set `SANITY_MIGRATION_DOCUMENT_ID` to the article's published ID. The migration will include its draft too, if it exists:

```sh
SANITY_MIGRATION_DOCUMENT_ID="eddb8988-5809-47cb-be2b-495938d60343" \
  pnpm exec sanity migrations run convert-plugin-tables-to-portable-text
```

After reviewing the dry-run result, apply the one-document migration:

```sh
SANITY_MIGRATION_DOCUMENT_ID="eddb8988-5809-47cb-be2b-495938d60343" \
  pnpm exec sanity migrations run convert-plugin-tables-to-portable-text --no-dry-run
```

To target a different dataset, pass both its project and dataset explicitly:

```sh
pnpm exec sanity migrations run convert-plugin-tables-to-portable-text \
  --project "$SANITY_STUDIO_PROJECT_ID" \
  --dataset development \
  --no-dry-run
```

Back up the dataset before applying the migration:

```sh
pnpm exec sanity datasets export "$SANITY_STUDIO_DATASET" tables-backup.tar.gz --types=post,legal
```
