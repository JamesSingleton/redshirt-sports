# Phase 1 audit — `phase1-reskin` (Step 0)

**Audited:** 2026-10-19  
**Git:** `phase1-reskin` @ `54f29f2` — **0 commits ahead of `main`**; `git diff main...HEAD` is empty for tracked files.  
**Untracked (not in audit rows as “changed” until committed):** `docs/blueprint/`, `docs/mockups/`, `scripts/`.

**Interpretation:** Phase 1 implementation has **not started on tracked code**; this branch matches `main`. The prompt’s “failed attempt” patterns describe **current `main` behavior** to replace, not bad commits on this branch. No `revert(phase1)` commits needed.

---

## Branch hygiene checks

| Check | Result | Action |
|---|---|---|
| Edits to `packages/ui/src/styles/globals.css` | `--spacing: 0.2rem` unchanged; no phase1 edits | **keep** shared file; add `apps/web/app/styles/redshirt.css` per plan |
| Raw mockup HTML in app | None found | **keep** discipline |
| `dangerouslySetInnerHTML` for mockups | Not audited file-by-file | verify on changed paths in PR |
| Hard-coded CDN logo in `logo.tsx` | `LOGO_URL` fallback present | **fix** — Sanity wordmarks + alt |
| Account UI in chrome | No `SignIn`/`UserButton` in navbar grep | **keep**; reskin must not add account UI |
| Rankings sub-routes (ballots, voters, …) | **Only** `[week]/page.tsx` exists on disk | **build new** routes (not redo) |
| `packages/ui` globals edited for web | No | **keep** |

---

## Audit table (current repo → Phase 1 target)

| # | Changed / target file | What it does now | Mockup + screenshot | Blueprint § | keep / fix / redo | Why |
|---|---|---|---|---|---|---|
| 1 | `apps/web/app/layout.tsx` | Imports `@redshirt-sports/ui/globals.css`, Geist fonts | `index.html` (typography baseline) | §32.2–32.4 | **fix** | Switch to `redshirt.css` + local Barlow/Inter/Source Serif |
| 2 | `apps/web/app/styles/redshirt.css` | *missing* | `docs/mockups/src/app.css` | §32.2–32.4 | **build** | Web-scoped tokens; `--spacing: 0.25rem`, ink/up/down/new/gold, utilities |
| 3 | `apps/web/app/fonts/*.woff2` | *missing* | `docs/mockups/fonts/` | §32.2–32.4 | **build** | Copy + `next/font/local` |
| 4 | `packages/ui/src/styles/globals.css` | Stock shadcn neutral, `--spacing: 0.2rem` | n/a (admin unchanged) | §32.4 | **keep** | Shared with admin |
| 5 | `apps/web/components/logo.tsx` | Uses `logo` mark; **drops `alt` prop** on `CustomImage`; hard-coded fallback URL | `phase1/index.html`, nav shots | §32.7, PHASE-1 logos | **fix** | Wordmark light/dark; pass alt; dimensions 169×28 |
| 6 | `apps/web/components/navbar.tsx` | Fetches Sanity + rankings; passes `logo` to client | `home-*`, `nav-mega-desktop`, `nav-sheet-mobile` | §32.7 | **fix** | Pass `footerLogo` / `footerLogoDarkMode` |
| 7 | `apps/web/components/navbar-client.tsx` | Sport trigger opens **conference grid only**; separate **Rankings** mega; mobile sheet; Geist-era layout | `nav-open-*`, `nav-mega-desktop`, `nav-sheet-mobile` | §32.7, §17 | **redo** | Per-sport panel: news, rankings, divisions, All teams A–Z; label **College Football**; no Bracket Challenge |
| 8 | `apps/web/components/footer.tsx` | Sanity columns + social; logo sizing/alt weak | `phase1/*` footer columns | §32.7 | **fix** | `footerLogoDarkMode` on ink surface; Sports/Redshirt/Company/Policies layout from mock |
| 9 | `apps/web/components/page-header.tsx` | Large hero-style h1, `py-12` | All content pages | §32.8 | **fix** | Mock kicker/h1/dek/border patterns |
| 10 | `apps/web/app/page.tsx` | Hero + division article sections; **no rail** (rankings widget, Most read, ad) | `index.html` → `home-*` | §32.8 | **redo** | Lead + top stories grid; river + rail order |
| 11 | `apps/web/app/college/[sport]/news/page.tsx` | `ArticleFeed` + `PageHeader`; pagination; **not archive UX** | `news.html` → `news-*` | §32.9, §17 | **redo** | Filter bar, date groups, compact lead p1, rail Most read → rankings → ad |
| 12 | `apps/web/app/college/[sport]/news/[division]/page.tsx` | Division feed (verify combobox) | `division-news.html` → `division-news-*`, `division-news-combobox-*` | §32.9 | **fix/redo** | Conference **Popover+Command** links; popular chips; filters Type/Sort/Search only |
| 13 | `apps/web/app/college/[sport]/news/[division]/[conference]/page.tsx` | Conference feed + `PageHeader` | `conference-news.html` → `conference-news-*` | §32.9 | **fix** | Picker with current conf; Big Sky teams rail card; Most read |
| 14 | `apps/web/app/college/[sport]/news/loading.tsx` | Basic skeleton | `news-loading.html` → `news-loading-*` | §32, loading rules | **fix** | Match archive layout; `aria-busy` |
| 15 | `apps/web/app/[slug]/page.tsx` (article) | Existing article layout | `article.html` → `article-*` | §32.10 | **fix** | Rail: ad → Most read → rankings (5) → More from author |
| 16 | `apps/web/app/college/teams/page.tsx` | *missing* | `teams.html` → `teams-*` | §32, §17 | **build** | A–Z index, filters, inclusion query |
| 17 | `apps/web/app/college/teams/[slug]/page.tsx` | Legacy team hub (tabs?) | `team.html` → `team-hub-*` | §32.10 | **redo** | Single page, anchor nav, sport sections, rank card + sparkline |
| 18 | `apps/web/app/college/[sport]/rankings/page.tsx` | *missing* | `rankings-index.html` → `rankings-index-*` | §17, §32.11 | **build** | Poll cards → latest week |
| 19 | `apps/web/app/college/[sport]/rankings/[division]/[year]/[week]/page.tsx` | Single `Card`; 4-col table; filters in card; inline voter breakdown; comma-separated “beyond top 25” | `rankings.html` → `rankings-*`, `rankings-desktop-dark` | §32.11, §13.9 | **redo** | 2-col grid, tabs, On X of N, rail CTA + movers, beyond cards; remove inline breakdown |
| 20 | `apps/web/app/college/[sport]/rankings/.../ballots/page.tsx` | *missing* (wrong orientation exists only in `voter-ballot-breakdown/*` on poll page) | `ballots.html` → `ballots-*`, `ballots-desktop-dark` | §32.11a | **build** | Team×voter matrix, stats, filters, segmented toggle |
| 21 | `apps/web/app/college/[sport]/rankings/.../ballots/by-voter/page.tsx` | *missing* | `ballots-by-voter.html` → `ballots-by-voter-*` | §32.11a | **build** | 6 cards/page, diff chips |
| 22 | `apps/web/app/college/[sport]/rankings/[division]/voters/page.tsx` | *missing* | `rankings-voters.html` → `rankings-voters-*` | §32.11b | **build** | Stats, callout, 7-col table / mobile cards |
| 23 | `apps/web/app/college/[sport]/rankings/[division]/history/page.tsx` | *missing* | `rankings-history.html` → `rankings-history-*` | §32.11c | **build** | Chart + week table |
| 24 | `apps/web/app/college/[sport]/rankings/methodology/page.tsx` | *missing* | `rankings-methodology.html` → `rankings-methodology-*` | §32.11d, §13.9 | **build** | Static per sport |
| 25 | `apps/web/components/rankings/filters.tsx` | Year/week controls | `rankings.html` header row | §32.11 | **fix** | Inline right of h1 + share |
| 26 | `apps/web/components/rankings/rank-movement.tsx` | Movement display | `rankings.html` legend | §32.11 | **fix** | ▲/▼/NEW/— + aria-labels |
| 27 | `apps/web/components/rankings/rankings-voter-breakdown.tsx` + `voter-ballot-breakdown/*` | **Voters as rows**, logos, Match %, pagination | `ballots.html` (opposite) | §32.11a | **redo** for ballots route; **remove** from poll tab | Wrong orientation for Phase 1 ballots |
| 28 | `apps/web/components/rankings/*` (new) | *missing* | rankings mockups | §32.11 | **build** | `rankings-header`, `rankings-tabs`, `team-mark`, `ballots-cta`, `beyond-top-25`, matrix, etc. |
| 29 | `packages/db/src/queries/voting.ts` | `countBallotsForPollWeek`, votes by voter | Poll + ballots | §13, PHASE-1 | **fix** | Add `getBallotsListedForPollWeek` (read-only) |
| 30 | `apps/web/lib/rankings-data.ts` | Cached rankings helpers | All rankings pages | §18, deadlock note | **fix** | Wrap new queries; same cache tags |
| 31 | `apps/web/components/most-read-card.tsx` (new) | *missing* | All rails per checklist | §32.9–32.10 | **build** | Numbered card; data TBD (see below) |
| 32 | `apps/web/components/rankings-widget.tsx` (new) | Logic partially in navbar | Home, news rails | `index.html`, `news.html` | **build** | Extract from navbar patterns |
| 33 | `apps/web/components/ad-slot.tsx` (new) | *missing* | Mock `ad-slot` utility | §32 | **build** | Placeholder 300×250 per mock |
| 34 | `apps/web/e2e/*` | *missing* | All `screenshots/` | Verification | **build** | Playwright screenshot + axe specs |
| 35 | `apps/web/app/**/loading.tsx` (many segments) | Only home, news, week rankings partial | `news-loading`, `rankings-loading` | Phase 1 loading rules | **build/fix** | CLS-safe skeletons per route |
| 36 | `apps/web/app/college/[sport]/rankings/sitemap.ts` | Week URLs only | Index + new tabs | §17 | **fix** | Add index, methodology, voters, history, ballots |
| 37 | `apps/web/__tests__/**` (navbar, footer, rankings) | Match current UI | — | tdd skill | **fix** | Update after each page commit |

---

## Per-page checklist status (tick during implementation)

| Page | Order | Checklist in prompt | Status |
|---|---|---|---|
| chrome | 1 | Shared header/footer/nav | ☐ |
| home | 2 | index | ☐ |
| news | 3 | news archive | ☐ |
| division-news | 4 | combobox | ☐ |
| conference-news | 5 | teams rail card | ☐ |
| article | 6 | rail order | ☐ |
| teams | 7 | A–Z index | ☐ |
| team | 8 | anchor sections | ☐ |
| rankings-index | 9 | **was skipped in prior attempt** | ☐ |
| poll tab | 10 | 2-col + beyond | ☐ |
| ballots | 11 | matrix | ☐ |
| by-voter | 12 | cards | ☐ |
| voters | 13 | full mock | ☐ |
| history | 14 | chart | ☐ |
| methodology | 15 | static | ☐ |
| loading skeletons | 16 | all segments | ☐ |

---

## Known data gaps (defaults → confirm with James)

| Data | Pages affected | Proposed fallback until answered |
|---|---|---|
| Most read (past 24h) | home, news, division, conference, article, team | **Ask:** PostHog query vs proxy. **Default:** 5 most recently published posts in scope (sport/division), labeled honestly in PR if not true 24h analytics |
| Team **Record** column | poll tab | **Default:** omit column (no DB field) |
| Voter slugs, outlets, disclosures, “Covers”, “On panel since” | voters | **Default:** name, org, role from `users_table`; ballot count; link to `by-voter#voter-{userId}`; **omit** empty columns and list in PR |
| Polls with no published week | rankings index | **Default:** hidden |
| Past seasons for history | history | **Default:** seasons present in `poll_rankings` / `getYearsThatHaveVotes` only |
| Teams index inclusion | `/college/teams` | New read query: ranked in FBS/FCS Top 25 (DB) ∪ school referenced in published Sanity post |
| Rank history sparkline | team page | Query `poll_rankings` for team by week in current season; empty → hide sparkline card |
| Conference list for combobox | division news | Existing Sanity `sportSubdivisionAffiliations` / grouping queries (read-only) |

---

## Revert queue

*None* — no phase1 commits on branch; nothing to revert.
