# Transfer portal baselines (Phase 0)

Measured 2026-11-24, before any portal changes. Later phases report against these numbers.

## What production holds

Production Postgres has **no portal data**. Every portal table is empty: `players`, `recruitments`, `recruitment_events`, `published_players`, `published_wire_events`, `player_submissions`, `player_duplicate_dismissals`, `player_external_ids`, `player_audit_log` and `portal_pushes`.

Sanity production has 1,065 published posts:

- 0 have anything in `players[]` (neither `redshirt:` nor `espn:` tags).
- 0 carry the `transfer-portal` tag.

So these baselines can't be measured yet:

- **Broken `story_slug` links: 0 of 0.** There are no events.
- **Articles lost to merged ids: 0.** There are no merges and no tags.
- **Time per player entry:** the audit log has no `players/create` rows.
- **Labeled data for scoring:** there are no merges or dismissed pairs to score duplicate matching against, and no tagged posts to score tag suggestions against.

Two consequences:

1. The tag migration in Phase 1 has nothing to backfill today. The link model can change now at no migration cost. That window closes as soon as editors start entering players.
2. Phases 2 and 3 have no labeled data. Scoring needs either a hand-labeled sample or a first portal window of real use.

`pg_stat_statements` isn't readable from the Supabase connector's role, so production query stats come from the synthetic run below.

## Sanity: GROQ cost on the real dataset (1,065 posts)

Each figure is server time (`ms` from the query API), 10 uncached runs against `api.sanity.io`, perspective `published`.

| Query                              | Filter                                                                                                 | ms (typical) |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------ |
| `queryPlayerStories` today         | `count(players[string::startsWith(@, $ref)]) > 0`                                                      | **160–230**  |
| Candidate: bare-id field           | `$id in playerIds`                                                                                     | **2–4**      |
| Baseline: no filter                | `_type == "post"`                                                                                      | 2–5          |
| `queryPortalNews` today            | `count(tags[@._ref in *[_type == "tag" && slug.current == "transfer-portal"]._id]) > 0` (page + count) | **270–320**  |
| Candidate: `references()`          | `references(*[_type == "tag" && slug.current == "transfer-portal"]._id)` (page + count)                | **8–16**     |
| Candidate: tag id in `tags[]._ref` | `*[...][0]._id in tags[]._ref`                                                                         | 140–180      |

The current player-stories filter costs about 170 ms per player page with zero tagged posts. It scans every post, so the cost grows with the archive, not with how many posts are tagged. Matching a bare id makes it about 50x cheaper. The portal news filter has the same problem, and `references()` makes it about 25x cheaper.

Reproduce with `packages/db/perf/groq-time.sh`.

## Postgres: synthetic portal season

Production is empty, so the read path was measured in a separate local database (`redshirt_perf`), cloned from the local schema and seeded by `packages/db/perf/portal-seed.sql`:

- 20,000 players across 3 sports and 3 cycles.
- 20,000 recruitments: 40% entered, 35% committed, 15% enrolled, 10% withdrawn.
- 77,000 events, with 77,000 published wire rows and 20,000 published player docs.

That is roughly 3,300 football transfers per cycle, close to a real D1-and-below portal year. Times are wall time through the app's own query functions (`packages/db/perf/portal-bench.mts`), 20 runs each on a local machine.

| Function                                                    | p50 ms    | p95 ms    | Result                   |
| ----------------------------------------------------------- | --------- | --------- | ------------------------ |
| `listDuplicateCandidates()` (admin duplicates queue)        | **1,479** | **1,672** | 2.5 KB                   |
| `getPublishedWire("football", 2025)`                        | **103**   | 126       | **4.3 MB** (~12.8k rows) |
| `getPublishedWire("womens-basketball", 2024)`               | 55        | 67        | 1.9 MB                   |
| `listIndexablePlayers()` (sitemap, unbounded)               | 26        | 31        | 1.5 MB                   |
| `findSimilarPlayers(name)` (new-player form)                | 6         | 7         | 1.4 KB                   |
| `searchPublishedPlayers(name)` (Studio picker, site search) | 6         | 8         | 1.2 KB                   |
| `listPublishedWireCycles("football")`                       | 6         | 6         | —                        |
| `listPortalPlayers()` (admin list, keyset)                  | 5         | 12        | 34 KB                    |
| `getPortalPlayer(id)`                                       | 4         | 9         | 1.6 KB                   |
| `listPlayerSubmissions("new")`                              | 1         | 5         | —                        |
| `getPublishedPlayer(id)`                                    | 1         | 2         | see caveat               |

`pg_stat_statements` deltas for the same run, by total time:

1. The duplicate-candidates CTE: 1,490 ms mean, about 92k buffer reads per call. The other 14 statements together are under 10% of its total.
2. The wire `select "row" ... where sport_id, kind, cycle_year`: 38 ms mean in the database, but 9,170 rows per call on average. The remaining wall time and the 4.3 MB are spent shipping and parsing rows.
3. `listIndexablePlayers`: 15 ms mean, 20,000 rows per call.
4. Everything else: under 5 ms mean.

### What this says

- **The admin duplicates page is the one slow query.** Each of the 500 recent players runs a trigram `%` lookup. Each lookup matched about 490 rows, sorted by similarity, to keep the top 10, about 3 ms each. The GIN index can find matches but can't return them nearest-first, so every match gets sorted. This seed is a worst case: 4,710 distinct names over 20,000 players. Real rosters have more varied names, so real fan-out per lookup will be lower, though common surnames still cluster. It is the first Phase 4 target, and a GiST trigram index ordered by `<->` distance is the obvious experiment.
- **The wire's problem is payload size, not the database.** The index scan is fine. A full football cycle is 4.3 MB of JSON before the page renders anything. Keyset pagination (Phase 4) addresses the size, not the plan.
- **The sitemap reads every indexable player in one query.** It's fine at 20k but grows without limit.
- **Name lookups on the intake path are already fast** (about 6 ms). Making intake easier is a UI and workflow problem, not a query-speed problem.

### Caveats

- `getPublishedPlayer` is a primary-key read. The synthetic docs don't match `publishedPlayerDocSchema` (no `offers` array), so the timed path stops at the parse step. The lookup itself is the 1 ms read. The schools and levels dictionary reads after it were measured on the wire path, at about 4–5 ms each.
- Synthetic wire rows carry fewer fields than real ones (no `path`, origin division or conference), so the 4.3 MB is a floor, not a ceiling.

## Production route timings (Sentry, last 30 days)

Too few samples to use as percentiles: 1–2 sampled requests per route, all against empty tables.

| Route                                         | Samples | Duration     |
| --------------------------------------------- | ------- | ------------ |
| `GET /transfer-portal`                        | 1       | 5,593 ms     |
| `GET /college/[sport]/transfer-portal`        | 1       | 2,118 ms     |
| `GET /college/[sport]/transfer-portal/[year]` | 2       | p50 1,752 ms |
| `GET /api/v1/players/search`                  | 1       | 457 ms       |

These are likely cold, uncached renders. They show only that nothing here is fast yet even with no data. Get real p95 numbers once the portal has traffic, or by sampling these routes at a higher rate.

## Re-running

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "create database redshirt_perf"
```

Load the local `public` schema into `redshirt_perf`, with `pg_trgm` and `pg_stat_statements` in an `extensions` schema. Then, from `packages/db`:

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d redshirt_perf -v n=20000 -f perf/portal-seed.sql
```

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/redshirt_perf pnpm exec tsx perf/portal-bench.mts
```

Use `-v n=200000` for the 10x run in Phase 4. The bench refuses any `DATABASE_URL` that isn't `redshirt_perf` on the local stack.


## Phase 1 results: article-to-player links

Measured on the same 1,065 posts, server `ms`, 10 uncached runs. Fair comparisons use `tags[]._ref`, an array every post has, because no post has `players` yet.

| Filter shape                                                                         | ms      |
| ------------------------------------------------------------------------------------ | ------- |
| `$x in arr[]._ref`                                                                   | 3–6     |
| `array::intersects(arr[]._ref, $xs)`                                                 | 3–5     |
| `references($x)` / `references($xs)`                                                 | 3–7     |
| `count(arr[_ref == $x]) > 0`                                                         | 24–29   |
| `count(arr[string::startsWith(_ref, $p)]) > 0`                                       | 24–28   |
| `$x in arr[]{"r": <function of _ref>}.r` (key derived inside the filter)             | 27–39   |
| `count(players[string::startsWith(@, $ref)]) > 0` (old player stories, field absent) | 160–230 |

Decisions these settled:

- **Store an exact key on each player tag.** `playerRef` is now `{ ref, key }`, where `key` is `"redshirt:412"`. Deriving the key inside the filter costs as much as the prefix test, so it has to be stored. `match` is fast too, but it tokenizes values and can return false matches.
- **One query covers the player and every id merged into them.** `array::intersects(players[].key, $keys)` costs the same with several keys as with one.
- **The player page reads its articles live; they are not copied into the projection at push time.** The live query costs about 3 ms on the Content Lake, is cached, and Sanity Live refreshes it when an article is published. Copying into `published_players.doc` would save at most that on a cache miss, and would need a Sanity-to-Postgres sync plus a stale window after every publish.
- **The portal news filter** now uses `array::intersects(tags[]._ref, <tag id subquery>)`: 300 ms down to 11 ms for page plus total. `references()` was as fast but would also match a body link to the tag page.

Not changed yet: `relatedPosts`, on every article page, uses the same slow `count(arr[@._ref in $ids]) > 0` shape for conferences, tags and teams. That belongs to Phase 4.

## Phase 2 results: player tag suggestions

No post had a player tag, so there was no hand-made answer key. The key is built mechanically instead: a **headline subject** is a name in both an article's title and its body that ESPN's player search resolves to a college player on one of the article's teams. ESPN's player search returns no coaches or authors. It does return a coach who has an old player record, so the key holds one coach (Kevin Giltner, below).

Over the 200 newest posts, 8 posts have headline subjects (9 names, 8 of them real players). Run `packages/db/perf/score-player-suggestions.py` to reproduce.

| Approach                                                           | Headline subjects in top 3 | Ranked first | Wrong person or not a person                                                                                                                                |
| ------------------------------------------------------------------ | -------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A: names from the body, exact-name ESPN match                      | 9/9                        | 8/8          | about 1 in 6 (51 of 322 in the first run): Wheaton's Caleb Ryan matched to a Liberty player; "Sam Houston" and "James Madison" (schools) matched to players |
| **B: A, plus the player must play for one of the article's teams** | **9/9**                    | **8/8**      | **8 found among about 310** (below)                                                                                                                         |
| C: B, plus the player's school must appear in the text             | 7/8 (first run)            |              | Removed 13 suggestions, 11 of them right (teams written as "ETSU", "UMass", "Southern Miss")                                                                |

**Shipped: B plus two filters, each measured to remove only wrong suggestions:**

- **Skip a school's name:** removes "Sam Houston" (2 suggestions).
- **Skip a name the article writes as staff:** a role word (coach, commissioner, director, ...) within a few words before it, or "is/was/as ... commissioner" after it. Removes head coaches Cody Worley, Dan Jackson and Jeff Gallo, and commissioner Michael Cross.

**Known misses after the filters:** Wofford coach Kevin Giltner. ESPN has a Wofford player record under his name, and his article never puts a role word next to it.

Other findings:

- **Title case breaks name finding.** "James Jones Becomes" reads as one name, so names come from the body only, and the ones the headline also contains rank first.
- **Sentence openers and positions stick to names.** "So Ty Pennington" hid the headline player of his own article until openers ("So", "But", "Receiver") and possessives were dropped.
- **ESPN doesn't know small-college players.** Nigel Jennings (Rowan, D-III), Rob Footman Jr. (Lock Haven, D-II) and Jadin Booth return nothing. Only Redshirt's own players can cover them. The suggester searches those first, but `/api/v1/players/search` returns 404 until `PORTAL_PUBLIC` is on.
- **Unmeasured: precision beyond the known errors.** Suggestions were checked for wrong teams, non-people and staff, not for whether each article is really _about_ that player. A box-score name can be on the right team without being the subject. Only an editor judging a sample can measure this.
- **Not tried: an LLM suggester.** It would run on Sanity AI credits, like `auto-tag`.

Checked in Studio against production content: "Trap Johnson Scores 16" suggests Trap Johnson only; the Wheaton article suggests nobody (the Liberty Caleb Ryan is rejected); "Ty Pennington throws, runs and catches" leads with Ty Pennington, then two teammates.

## Phase 3 results: faster player intake

### Duplicate warnings on the new-player form

Production has no merges or dismissed pairs to learn from, so the test set is built:

- **Existing players:** 20,000, with first and last names drawn separately from the real college player names in the Phase 2 ESPN cache (443 first names, 511 last names, at their real frequencies).
- **Re-entries:** 400 known duplicates, entered again with a typo (192), an added or dropped suffix (102), no change (88), a nickname (10), initials (3), a hyphen (3) or an apostrophe (2).
- **New players:** 400 who aren't on file.

Scripts are in `packages/db/perf/duplicates/` (`generate.py`, then `score.sql`, `candidates.sql` and `tiers.py` against `redshirt_perf`).

| Check (8 names max, like the form)       | Re-entries listed                     | Ranked first | New players stopped by the warning | Names shown to a new player |
| ---------------------------------------- | ------------------------------------- | ------------ | ---------------------------------- | --------------------------- |
| Before: trigram on the name, every match | 400/400                               | 351          | **400/400**                        | 8.0                         |
| Plus nickname lookup                     | 400/400                               | 352          | 400/400                            | 8.0                         |
| Last-name trigram plus first initial     | 388/400                               | 345          | 356/400                            | 4.7                         |
| **Shipped: shown vs. likely tiers**      | **399/400 listed, 386 marked likely** | 360          | **133/400**                        | 4.5                         |

**Before**, every new player at this size set off the warning with a full list of 8 names, so "None of these" had to be ticked on every entry.

**Shipped (`packages/db/src/portal/duplicates.ts`):**

- **Shown:** a name with similarity ≥ 0.5, or ≥ 0.3 when the sport matches and the school or high-school class matches too.
- **Likely, which blocks the save until "None of these":** similarity ≥ 0.8, or ≥ 0.5 with that same shared context.

Re-entries that aren't marked likely are still listed, and the admin duplicates queue catches them later.

About 20% of new players will always be warned: at this size, real namesakes (several "Jalen Williams") exist. That warning is correct.

### ESPN link fill-in

Pasting an ESPN college player link fills in:

- name, suffix and hometown;
- sport, position, height, weight and class;
- the origin school, through `school_external_ids`.

Only empty fields are filled. The ESPN id is recorded on the new player.

An ESPN id already on file blocks the save and links to that player. That is a certain duplicate, which name matching can only guess at.

### Several moves in one save

Offers, contacts and visits take any number of schools ("+ Another school"). They are written in one transaction, all or none (`recordRecruitmentEvents`).

Offers from four schools went from four saves to one. Time per entry can't be compared yet, because production's audit log is empty (Phase 0).

## Phase 4 results: read path and 10x

### Duplicate queue (`listDuplicateCandidates`)

With realistic names in the perf data (17,924 distinct names over 20,000 players, so each trigram lookup matches about 127 rows), the queue took 769 ms. Two experiments:

| Experiment                                                       | Time           | Pairs found                                                                                                |
| ---------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| Baseline: GIN `%` at pg_trgm's default 0.3, top 10 by similarity | 750 ms         | 4,967                                                                                                      |
| GiST trigram index, ordered nearest-first (`<->`)                | 1,600–1,730 ms | different on ties (475 pairs swapped). The planner also picks it for the baseline query, slowing that down |
| **Threshold 0.4**                                                | **455 ms**     | drops only pairs below 0.4                                                                                 |
| Threshold 0.5                                                    | 300 ms         | drops pairs below 0.5                                                                                      |

Against the 400 labeled re-entries from Phase 3: **none scores below 0.4**, 3 score below 0.45, and 7 below 0.5.

Shipped: **0.4**, set with `set_config(..., true)` inside the query's own transaction, which is safe through the transaction pooler. Through the real function the queue went from 769 ms to 487 ms. The GiST index was rejected.

**At 10x (200,000 players), the 0.4 threshold still left the queue at 6.8 s** (9.8 s at 0.3). Each lookup finds more namesakes as the table grows.

**Then fixed by storing the pairs.** `player_duplicate_pairs` (migration 0037) holds each player's 10 closest names at similarity ≥ 0.4. They're written when the player is added or renamed (`refreshDuplicatePairs`), and cleared when the player is merged away. The queue reads stored pairs for the 500 most recent players instead of running 500 searches.

- Same answers: for all 500 recent players, the stored top 10 has the same scores as the live search. Only the choice among equal scores can differ.
- Queue at 10x: **6,837 ms → 133 ms**.
- Cost per write at 10x: about 18 ms added to adding or renaming a player.
- One known gap: two near-identical players saved at the same instant can each miss the other, because neither sees the other's uncommitted row. Renaming either one, or adding a third look-alike, repairs it.

### Article lists and archives (GROQ)

Same results, measured on real posts (server ms, median of 8):

| Filter                                       | Before  | `array::intersects` |
| -------------------------------------------- | ------- | ------------------- |
| `relatedPosts`, article with sport and ids   | 29      | 10                  |
| `relatedPosts`, article with no sport or ids | **250** | **0**               |
| `moreFromAuthor`                             | 23      | 7                   |
| Conference archive (page + total)            | 188     | 12.5                |

`relatedPosts` and `moreFromAuthor` run on every article page.

Typegen can't evaluate `array::intersects` against a parameter, so `moreFromAuthor` is typed `never[]`. `post-lists.ts` types it itself.

The two `count(...)` filters left in `queries.ts` test two conditions on each array item, which `intersects` can't express.

### The wire

Keyset pagination doesn't fit. The page server-renders the first 25 players, and the whole cycle loads once, from a cached JSON endpoint, when a reader filters or pages. Filters and counts run in the browser, so paging on the server would break them without saving work.

A full football cycle (12,669 rows, 3,334 players) is 5.9 MB raw, 870 KB gzipped and **243 KB with brotli**. If that needs to shrink, the lever is one row per player instead of one per event.

### At 10x (200,000 players, 770,000 events)

| Function                                                                              | p50 ms | p95 ms | Result | Notes                                                                                                    |
| ------------------------------------------------------------------------------------- | ------ | ------ | ------ | -------------------------------------------------------------------------------------------------------- |
| `listDuplicateCandidates()`                                                           | 6,837  | 7,032  | 2.6 KB | see above                                                                                                |
| `getPublishedWire(football, 2025)`                                                    | 923    | 1,042  | 40 MB  | one cycle 10x its real size; cached                                                                      |
| `listIndexablePlayers()`                                                              | 263    | 317    | 15 MB  | over the 50,000-URL sitemap limit; the sitemap's own comment says to split with `generateSitemaps` first |
| `listPublishedWireCycles(football)`                                                   | 81     | 106    |        | reads every event for distinct seasons; cached                                                           |
| `findSimilarPlayers(name)`                                                            | 65     | 171    |        | new-player form, 250 ms debounce                                                                         |
| `searchPublishedPlayers(name)`                                                        | 50     | 168    |        |                                                                                                          |
| `getPublishedPlayer`, `getPortalPlayer`, `listPortalPlayers`, `listPlayerSubmissions` | ≤ 5    | ≤ 9    |        | index reads; flat at 10x                                                                                 |

Realistic growth is about 10,000–20,000 players a year, so the 10x figures describe a table about a decade old.
