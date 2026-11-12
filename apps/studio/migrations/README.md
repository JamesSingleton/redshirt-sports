# Content migrations

Each folder is one `sanity migration`. Runs are dry by default and print the
patches they would make; add `--no-dry-run` to write.

```bash
cd apps/studio
pnpm exec sanity migration run <id> --project <projectId> --dataset <dataset>
```

The runner tests a migration's `filter` against one document at a time, so a
filter can only use that document's own fields. Subqueries, `references()`
and `length()` silently match nothing. Keep filters to `defined(...)` and do
the real check in `document()`, returning no patches for a clean document.

## Editorial rebuild (`editorial-01` to `editorial-11`)

Run in number order. Every one is safe to re-run. Counts are from a
production dry run on 2026-11-11.

| Step | What it does                                                                                                                                                                                                                      | Production dry run                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 01   | Re-points `division` references to the `classification` with the same slug                                                                                                                                                        | 2,258 documents                                                   |
| 02   | Merges a conference's two subdivision-by-sport fields into one                                                                                                                                                                    | 31 conferences                                                    |
| 03   | Marks each subdivision an NCAA designation (FBS, FCS) or common usage (Power Conferences, Mid-Major)                                                                                                                              | 4                                                                 |
| 04   | Moves article photo captions into alt text and removes the caption                                                                                                                                                                | 2,139 patches                                                     |
| 05   | Converts every old body link format to the one `link` annotation                                                                                                                                                                  | 1,619 blocks                                                      |
| 06   | Repairs heading order and removes retired text styles                                                                                                                                                                             | 40 blocks                                                         |
| 07   | Trims headlines; gives long headlines a cut-down SEO title                                                                                                                                                                        | 339                                                               |
| 08   | Removes retired fields (`author`, `featuredArticle`, `mainImage`, `conferenceAffiliationsBySport`, conference `description`, navbar `columns`), copying data over first where needed                                              | 780                                                               |
| 09   | Repairs article sport and subdivision where the answer is in the article; clears impossible "last updated" dates                                                                                                                  | 12                                                                |
| 10   | Deletes the `division` documents                                                                                                                                                                                                  | Run after 01                                                      |
| 11   | Gives each tag a kind (beat, series, topic), creates the Recruiting, Transfer Portal, and NIL beats, and moves News articles in a format series to that format (Game Preview, Top 25s → Rankings, Bowl Projections → Predictions) | 9 tags, 3 new beats, 67 Game Preview, 26 Rankings, 34 Predictions |

Order constraints:

- Step 01 changes fields the live site reads, so run it in the same window
  as the web and admin deploy, and apply the Postgres migration
  `0028_divisions_sanity_classification_ids` in that window too.
- Step 05 rewrites links in place. Until it runs, articles with old links
  can't be published from the new Studio (the old format is an error).
- Step 10 skips any division something still references.
- Step 11 is independent of the others. It creates three tag documents;
  re-running is safe because it checks tag names first.

Left for an editor (Studio → Newsroom → Needs attention): articles with no
sport or division (allowed for coverage that spans sports or divisions, but
worth a look), and the "Who counts" definition on each common-usage
subdivision.

## School conferences (not a migration)

Edit a school's conferences in the Studio when it changes conference.
Publishing syncs them to Postgres (`sync-school`); a new conference needs the
admin "Load conferences" action first.
