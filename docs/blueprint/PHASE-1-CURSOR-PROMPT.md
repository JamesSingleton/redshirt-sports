# Phase 1 for Cursor: style reskin + missing rankings pages (redshirt-sports)

You are working in the local clone of `JamesSingleton/redshirt-sports` (pnpm + Turborepo, Next.js App Router in `apps/web`, shared shadcn in `packages/ui`, Drizzle in `packages/db`, local Supabase Postgres on `127.0.0.1:54322`). **Phase 1 only.** You've already started on this branch, so begin with Step 0. Do not start over.

## Goal
Phase 1 has two parts:
1. **A style reskin of the current routes.** Apply the mockup design system (Tailwind v4 CSS-first tokens, fonts, header and nav, footer, cards, typography) to the existing `apps/web` pages. URLs, data and queries stay the same. Only the look changes.
2. **A few pages the site doesn't have yet:**
   - the poll index at `/college/[sport]/rankings`, listing every poll for the sport, each card linking into its latest published week;
   - the rankings tabs: Ballots (unfiltered all-voters grid), By voter, Voters, History, Methodology;
   - the updated Poll tab on the existing week URL: the "On X of N" column, the "See all N ballots" card, and Others receiving votes / Dropped out / No longer receiving votes.

**No user accounts in Phase 1.** Don't add or restyle any of these:
- sign-in or sign-up
- "Follow teams" or Following badges
- Notify me, poll-release or push alerts
- saved or bookmarked items
- "For you" or other personalization
- newsletter signup
- any Clerk-gated UI

Leave the existing `app/(auth)/**` routes (sign-in, onboarding, `(vote)`) and the Clerk wiring exactly as they are. The Phase 1 mockups (`docs/mockups/phase1/`) already have all account UI removed.

**Also out of scope:**
- route moves, the year-less "current" URL (`/rankings/fcs`), and redirects
- the `vote.` subdomain
- people and teams model changes, `/people/*`
- portal, recruiting, brackets
- the Sanity page builder, Sanity schema and content edits
- the ticker and mobile bottom nav
- CSV + hash downloads
- the single-voter page `…/ballots/[voter]`
- DB migrations

## Hard rules
1. **Read these first:**
   - `docs/blueprint/PHASE-1.md`
   - `32-ui-ux-direction-and-design-system.md`
   - `13-top-25-polls-full-lifecycle.md` (§13.9, §13.11, §13.15)
   - `17-route-map-and-url-structure-designed.md`
   - `LOCAL_DEVELOPMENT.md`
   - `REPO_AUDIT.md`
   - `docs/mockups/phase1/README.md`

   **Every commit and the PR must cite the blueprint section and mockup each change follows**, e.g. `feat(rankings): poll table — §32.11, phase1/rankings.html`.
2. **Screenshots are the source of truth.** `docs/mockups/phase1/screenshots/<page>-{desktop,tablet,mobile}.png` are taken at 1440×900, 820×1180 and 390×844. Match them pixel-close. If the HTML and a screenshot disagree, the screenshot wins.
3. **Mockup HTML is a visual and structural reference only. NEVER paste it in raw.** That means no `dangerouslySetInnerHTML`, no copied `<svg>` blobs, no inline `style` hues, and no `<img src="../brand/…">`. Convert it to idiomatic React server components:
   - typed props and real data
   - shadcn primitives from `@redshirt-sports/ui/components/*`
   - `lucide-react` icons
   - `next/link`
   - `CustomImage` (`@/components/sanity-image`) for every Sanity image

   Keep the mockup's **class lists and DOM structure**; that's what makes it match. Use `"use client"` only for real interactivity: filters, search, the matrix highlight, chart hover.
4. **shadcn first.** Use what's already in `packages/ui`: card, table, tabs, badge, avatar, select, input, switch, chart, tooltip, scroll-area, breadcrumb, pagination, sheet, navigation-menu, separator, skeleton. Add missing ones with the shadcn CLI. Never hand-roll a primitive.
5. **Don't invent styles.** Every class must trace back to a mockup or a token in `docs/mockups/src/app.css`. If something isn't in the mockups, use the closest existing pattern and note it in the PR.
6. **Stop and ask James** when a mockup conflicts with the repo (missing data, URL shape, logo variant, scope). Write the conflict down and don't guess.
7. **No new URLs except `/college/teams`, `/college/[sport]/news/[division]/[conference]`, and these under `/college/[sport]/rankings`:**
   - the index itself
   - `/methodology`
   - `/[division]/voters`
   - `/[division]/history` (plus `/history/[year]` only if past seasons exist)
   - `/[division]/[year]/[week]/ballots`
   - `…/ballots/by-voter`

   The existing `/[division]/[year]/[week]` keeps the repo's week segments (`preseason`, `1…n`, `final-rankings`, via `formatWeekSegment` in `packages/clients/src/espn/week-url.ts`). The mockups' `week-7` is only illustrative.
8. **Local only.**
   - Use local Supabase (`supabase start` in `apps/web`, DB 54322), the seeds (`apps/web/supabase/seed.sql`, `packages/db/seeds/users-with-ballots.ts`), Clerk dev keys and the Sanity dev dataset.
   - Never run `db:push`, `db:migrate`, SQL, or Sanity or other MCP tools against a remote or prod Supabase, Neon, Vercel or Sanity. No deploys, and no `vercel env pull`.
   - No migrations. New read-only queries go in `packages/db/src/queries/*`.
9. **Small commits:** one page or component each, each one green. Never mix reskin and rankings work in one commit.
10. **Keep the caching patterns.** Use `"use cache"`, `cacheTag` and `cacheLife(RANKINGS_CACHE_LIFE)` via `apps/web/lib/rankings-data.ts`. All DB I/O must run inside a cached function (see the deadlock note in `components/rankings/rankings-voter-breakdown.tsx`). Reuse the existing tags so publish invalidation (`apps/admin/lib/revalidate-web-rankings.ts`) keeps working.
11. **Repo skills and typing:**
    - Apply the repo skills in `.claude/skills`: `shadcn`, `vercel-react-best-practices`, `vercel-composition-patterns`, `turborepo` and `tdd`.
    - Strict TypeScript: no `any`.
    - Props come from `@redshirt-sports/db` types (`packages/db/src/types/rankings.ts`) and `@redshirt-sports/sanity/types`.

## READ THIS FIRST: the last attempt failed, and how it failed
James compared your builds with the mockups. Three pages didn't match and one was never built. **Don't repeat any of these mistakes:**

1. **Ballots (`…/[week]/ballots`).** You built a "Voter Breakdown" table: voters as rows, team **logos** as cells, a "Match %" column, a Name select, "10 per page" and voter pagination.
   - **The mock is the opposite orientation:** **teams are rows** (Rk, team mark + name, Pts, 1st), **every voter is a column** (rotated "Voter 01…22" headers), and the cells are **numeric ranks on a red heat scale**, with **On** and **Range** columns on the right. RV rows sit below a divider. There's an outlier ring, the header and team column are sticky, and there's **no pagination**: all voters are visible at once.
   - **You also left out:** the All ballots / By voter segmented toggle (you shipped a "Browse by voter" button); the 4 stat cards (Ballots counted, On every ballot, First-place votes, Outlier picks); the filter card (Find a team, "All 22 voters" highlight, Columns: voter name, Outliers only switch, Show RV switch, and the helper text about `?voters=`); and the year/week selects and share button in the header row.
   - **No Match % and no logo grid.**
2. **Poll tab (`…/[week]`).** You built a full-width table with no rail.
   - **The mock is a 2-column grid** (`lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`):
     - **Table columns:** Rk, ±, team mark + Team (first-place votes), Record (only if data exists), Conf, Pts, Prev, On ballots ("On X of 22" plus a bar). Below the table go the caption/legend line and the movement legend (▲ moved up, ▼ moved down, NEW newly ranked, — unchanged).
     - **The rail holds:** the **"Ballot transparency · See all 22 ballots" card** (voter chips, "Open the full ballot breakdown" button, "Browse by voter" link), then the **Biggest movers card**, then the 300×250 ad.
   - **Header:** your year and week selects were stacked on the left. In the mock they sit **inline at the right of the h1 row**, next to the share button. The h1 is "FCS Top 25 · Week 7" with the week part muted, and a meta line below it ("Released … · N voters · N ballots counted · Methodology").
   - **Missing team marks:** every row needs the logo with an initials fallback.
   - **Biggest movers:** you made it a full-width Up/Down section. It's a **rail card**.
   - **Beyond the Top 25:** each Dropped out and No longer receiving votes row needs the mark, name, a "This week: …" sub-line, and the **LAST WEEK No. N / RV · N pts block on the right**. Others receiving votes rows show "on X of 22" and points. Don't use inline "(21)" text.
3. **Voters (`…/[division]/voters`).** You built a plain 4-column table (Name, Organization, Role, Ballots). **The mock needs all of this, in order:**
   - header with kicker, h1, meta line, and the **2026 panel** select at the right;
   - the route tabs;
   - **4 stat cards** (Voters, Outlets, Ballots submitted, Disclosures);
   - the **"How voters are chosen" callout** (tinted `bg-primary/5`-style box with an icon);
   - filter row: search voters or outlets, All coverage areas, Sort: name A–Z, and "Season roster: 2025 panel" on the right;
   - a table with these columns: Voter (initials avatar + name + role under it), Outlet / affiliation (with an external-link icon), Covers, On panel since, 2026 ballots ("8/8"), Disclosures, Links ("Week 7 ballot" outline button + "Profile" link);
   - a "Show all 22 voters" button.

   If a column has no data, leave it out **and list it in the PR**. Don't silently simplify the table.
4. **Poll index (`/college/[sport]/rankings`).** **You skipped it.** It must exist at `apps/web/app/college/[sport]/rankings/page.tsx`. See the checklist below.
5. **Most Read.** Your builds dropped the "Most read · Past 24 hours" numbered card. **It's required on every page whose mock has it** (see the checklists).
6. **Chrome:**
   - The nav label is "**College Football**", not "Football".
   - Each sport trigger opens **its own** panel, with only that sport's links (news, rankings, divisions, All teams A–Z). A trigger must never open a combined panel.
   - **No Bracket Challenge anywhere** in Phase 1.
   - The footer must match `phase1/*` (Sports / Redshirt / Company / Policies columns), not the old footer.

## Strict per-page workflow (no exceptions)
- **Build one page at a time,** in this order:
  1. chrome
  2. home
  3. news
  4. division news
  5. conference news
  6. article
  7. teams
  8. team
  9. rankings index
  10. poll tab
  11. ballots
  12. by voter
  13. voters
  14. history
  15. methodology
  16. loading skeletons

  Don't start page N+1 until page N is **done**.
- **For every page:**
  1. **Open the mock and your build side by side** with Playwright at **1440×900 @1x, 820×1180 @2x and 390×844 @2x**. Use `docs/mockups/phase1/<page>.html` against `http://localhost:3000/<route>`.
  2. Save your screenshots to `apps/web/e2e/__screens__/<page>-<width>.png`.
  3. **Diff them against `docs/mockups/phase1/screenshots/<page>-{desktop,tablet,mobile}.png`** with `pixelmatch` or Playwright `toHaveScreenshot` and a generous threshold. Commit the diff summary to the PR.
  4. **Walk the checklist below top to bottom.** Every item must be present, **in the listed order**. Tick it in `docs/blueprint/PHASE-1-AUDIT.md`.
  5. Run **axe at all 3 widths, in light and dark: 0 violations.**
- **A page is "done" only when:**
  - every checklist item is ticked;
  - the diffs show no structural differences (missing or reordered sections, wrong orientation, missing columns or cards);
  - axe passes;
  - types, lint and tests are green.

  Report each page as `DONE: <page>` with the screenshot paths. **Never report a page done that you haven't screenshotted and diffed.**
- **If you can't match an item** (missing data), stop on that item. Write it under "Known differences / questions" and move on. Don't silently drop it.

## Per-page acceptance checklists (sections in order, with key specs)
Shared on every page:
- the header from the Sanity logos;
- the per-sport mega panels on desktop, and the sheet accordion at 820 and 390;
- the `phase1` footer;
- **no** account, bracket, portal, star or NIL UI.

**home (`phase1/index.html`)**
1. Lead and top-stories grid.
2. River with a rail: rankings widget, then **Most read (past 24h)**, then the ad.
3. Footer.

**news.html: `/college/[sport]/news` (archive, NOT a home clone)**
1. Breadcrumb College › Football › News.
2. "Archive" kicker, h1 "College Football News" and a one-line dek, with a bottom border.
3. **Filter bar.** A rounded `bg-muted/40` card in a `role="search"` form. Its labeled selects are Division, Conference, Type and Sort, then a headline search input and an Apply button. Below it, the helper line: division and conference **navigate to folder routes**; type, sort and search are query params.
4. Two-column grid:
   - **Main column:**
     - **One compact lead only** (bordered card, 14rem image + headline), on page 1 only.
     - The count line ("1,142 stories") with "Page 1 of 48".
     - **Chronological groups** with sticky date headings (Today · Mon, Oct 19 / Yesterday / Sat, Oct 17).
     - Each row is a 3-column grid: time, kicker + headline + author, then a 4:3 thumbnail.
     - shadcn Pagination using `?page=n` (page 1 has no parameter), then the canonical note.
   - **Rail:** **Most read (past 24h)** numbered card, then the rankings widget, then the ad.

**division-news: `/college/[sport]/news/[division]` (example: FCS, page 2)**
1. Breadcrumb ending in FCS.
2. Kicker, h1 "FCS Football News".
3. **Conference picker.** A shadcn **Popover + Command** combobox ("All conferences (15)"), followed by "Popular:" chips for the 5 conferences with the most posts.
   - **Every option and every chip is a link** to `/college/[sport]/news/[division]/[conference-slug]`. It's not a query filter.
   - The list is searchable, Esc closes it, and focus returns to the trigger.
   - The conference names and slugs come from Sanity `conference` docs (`sportSubdivisionAffiliations` for the sport).
   - **No conference tabs.** Screenshot: `division-news-combobox-*`.
4. Filter bar with Type, Sort and Search only.
5. Archive list as on news, with `?page=2` (no lead on pages after 1).
6. Rail: **Most read**, then the rankings widget, then the ad.

**conference-news: `/college/[sport]/news/[division]/[conference]` (new route; example: FCS/Big Sky)**
1. Breadcrumb … › FCS › Big Sky.
2. Kicker "FCS · Big Sky Conference", h1 "Big Sky Football News".
3. Conference picker, with the current conference selected or with `aria-current` on its chip.
4. Filter bar.
5. Compact lead.
6. Chronological archive and pagination.
7. Rail: **Most read**, then the "Big Sky teams" card (real school logos + names linking to the team page), then the ad.

**article (`phase1/article.html`)**
1. Article header, body and existing elements as in the mock.
2. Desktop rail, inside the sticky stack: ad, then **Most read**, then the rankings widget (5), then "More from {author}".

**teams.html: `/college/teams` (new route)**
1. Breadcrumb Home › College › Teams.
2. h1 "College Teams" and dek.
3. **Sticky filter bar:**
   - a labeled search input;
   - division chip buttons with `aria-pressed` and counts (All, FBS, FCS, D-I no football, D-II, D-III, NAIA, No conference set);
   - a live count ("337 schools", `aria-live`);
   - the A–Z jump nav (letters with no schools are disabled).
4. Letter sections, each with a sticky `h2`. The grid uses `repeat(auto-fill, minmax(min(100%,17rem),1fr))`.
5. Card: logo (48px, `alt=""`) or initials, **short name + muted nickname**, "Conf · Division". The whole card links to the team page. **No article counts.**
6. Empty state.
7. **Inclusion rule:** a school has ever been ranked in our FBS or FCS Top 25 (app DB) **or** is referenced by a published Sanity post.

**team.html: the team page, ONE page with no tabs and no per-sport sub-menu**
- **Route (decided by James): team pages stay at `/college/teams/[slug]`** (the existing repo route). The mocks, `teams.html` cards, nav, articles and breadcrumbs all link to `/college/teams/{slug}`. Do not create `/teams/*`.
1. Header band:
   - breadcrumb;
   - logo (80px);
   - kicker "Big Sky · FCS football · D-I basketball";
   - h1 "{Short} {Nickname}";
   - the rank badge;
   - a **"Jump to" anchor nav** (Latest, Football, Men's Basketball, Women's Basketball, Info & links). These are plain anchor links, not tabs.
2. Main column, sections with `h2` anchors (`scroll-mt-24`, top border):
   - **Latest:** a lead plus 4 items across sports.
   - **Football:** the rank card ("No. 2", movement, "from No. 4 · pts · on X of Y ballots", a "Full FCS Top 25" link) next to the **rank-history sparkline** card (Best and Low), then the Football news list.
   - **Men's Basketball** news.
   - **Women's Basketball** news.
   - **Info & links:** a `dl` of facts and outbound links with sr-only "(opens school site)".

   **Render sport sections only for sports the school has.** The poll card appears only if the team has rankings.
3. Rail: **Most read**, then the ad, sticky.
4. **No rosters, scores or schedules.**

**rankings-index: `/college/[sport]/rankings` (MUST exist; it was skipped)**
1. Breadcrumb College › Football › Rankings.
2. Kicker "College Football", h1 "Rankings", dek, and a "How our polls work" outline button on the right linking to methodology.
3. Grid of poll cards (2 columns plus the ad rail on desktop). Each card has:
   - kicker "Redshirt Sports Poll · FCS";
   - h2 "FCS Top 25" with a **Live** badge;
   - meta "Week 7 · Released … · 22 voters";
   - the **top 5** rows (rank, mark, team, movement, pts);
   - a footer with "Full Top 25 ›" plus Ballots · Voters · History links.
4. Polls with no published week are hidden (default), or shown as the dashed "Coming soon" card if James says so.
5. Ad rail.

**rankings.html: the Poll tab** (see the failure list above)
1. Breadcrumb.
2. Kicker.
3. h1 "FCS Top 25 · Week 7" with the meta line, and the **year and week selects plus share button inline on the right**.
4. Route tabs: Poll, Ballots, Voters, History, Methodology (links with `aria-current`).
5. Two-column grid:
   - **Main:** the `<table>` with a caption and columns Rk, ±, mark + Team (fpv), [Record], Conf, Pts, Prev, On ballots (text + bar), followed by the legend.
   - **Rail:** the Ballot transparency card, then the **Biggest movers** card, then the ad.
6. "Beyond the Top 25" h2 with 3 cards: Others receiving votes, Dropped out of the Top 25, No longer receiving votes, using the row specs above.
7. Dark mode matches `rankings-desktop-dark`.

**ballots.html: All ballots** (see the failure list above)
1. Breadcrumb.
2. Kicker.
3. h1 "FCS Week 7 Ballots", the meta line, and the year/week selects plus share.
4. Route tabs, with Ballots active.
5. **Segmented toggle All ballots | By voter.**
6. 4 stat cards.
7. Filter card: team search, voter highlight, Columns select, Outliers only switch, Show RV switch, and the `?voters=` helper text.
8. **The matrix `<table>`:**
   - teams are rows; the columns are Rk, Team (mark), Pts, 1st;
   - one column per voter, with rotated headers;
   - numeric heat cells (darkest red is rank 1);
   - On, Range;
   - a divider, then the RV rows;
   - an outlier ring with sr-only text;
   - sticky header and first columns, with horizontal scroll only inside the matrix at 390.
9. Dark mode matches `ballots-desktop-dark`.

**rankings-voters.html: Voters** (see the failure list above). Header with the panel select, then tabs, then 4 stat cards, then the "How voters are chosen" callout, then the filter row, then the 7-column table, then "Show all". On mobile, the table becomes stacked cards, as in `rankings-voters-mobile`.

**Most Read is required on:** home, news, division news, conference news, article and team. It uses the same numbered card everywhere ("Most read" / "Past 24 hours", 5 items, big red numerals marked `aria-hidden`, linked headlines).

## loading.tsx skeletons (required)
- **Every Phase 1 route segment gets a `loading.tsx`** that mirrors its page layout using the shadcn **`Skeleton`**. It must use the same grid, column widths, card sizes and row counts, so there's **no layout shift (CLS ≈ 0)** when content streams in. The segments are:
  - home
  - news
  - division news
  - conference news
  - article
  - teams
  - team
  - rankings index
  - poll tab and each rankings tab (ballots, by voter, voters, history, methodology)
- **Accessibility:**
  - The skeleton region is `<main aria-busy="true">` and contains `<span role="status" class="sr-only">Loading…</span>`.
  - The skeleton blocks themselves are `aria-hidden`.
  - Use `motion-reduce:animate-none` (respect `prefers-reduced-motion`).
  - The header and footer stay real; they're not skeletons.
- **References:** `phase1/news-loading.html` and `phase1/rankings-loading.html` (screenshots `news-loading-*`, `rankings-loading-*`). Pages without a skeleton mock follow the same pattern from their page mock.
- **Acceptance, at 3 widths:**
  - the skeleton screenshot lines up with the page screenshot (same section boxes);
  - axe passes;
  - a Playwright test with a throttled network shows the skeleton and then the page with no layout jump.

## Repo facts (verified on `main`)
- **Root layout and chrome.** `apps/web/app/layout.tsx` imports `@redshirt-sports/ui/globals.css` and uses Geist via `next/font/google`. Pages are wrapped by `DraftAwareNavbar`/`DraftAwareFooter` (`components/root-layout-chrome`). The chrome components are `navbar.tsx`, `navbar-client.tsx`, `footer.tsx` and `page-header.tsx`, and they get their data from Sanity.
- **Tokens.** `packages/ui/src/styles/globals.css` is the stock shadcn neutral theme with **`--spacing: 0.2rem`**, while the mockups assume **0.25rem**. It is **shared with `apps/admin`**, so don't edit it; see Step 2.
- **Rankings routes.** Only `apps/web/app/college/[sport]/rankings/[division]/[year]/[week]/page.tsx` exists, plus `loading.tsx` and `rankings/sitemap.ts`. It already computes the Top 25, others receiving votes, dropped out and no longer receiving votes (`lib/rankings-movement.ts`), and renders `RankingsVoterBreakdown` inline. There's no index page.
- **Rankings components.** `apps/web/components/rankings/*`: `filters`, `rank-movement`, `team-page-link`, `rankings-voter-breakdown`, `voter-ballot-breakdown/{desktop,mobile,synced-scroll,match-badge,team-logo}`, plus skeletons.
- **Data.**
  - Tables: `polls`, `poll_voters`, `ballots`, `ballot_entries`, `poll_rankings` (rank null means receiving votes only), `weeks`/`season_types`/`seasons`, `schools`, `users_table`.
  - Queries in `packages/db/src/queries/{rankings,voting,polls}.ts`: `getFinalRankingsForWeekAndYear`, `getVotesForWeekAndYearByVoter`, `countBallotsForPollWeek`, `getYearsThatHaveVotes`, `getWeeksThatHaveVotes`, `listPolls`, `getPollBySportSlugAndPollSlug`, `getLatestFinalRankingsBySportSlug`, `listActivePollVoters`.
  - The poll slug equals `[division]`.
- **Tests and scripts.**
  - Vitest specs are in `apps/web/__tests__/**`; update `rankings-week`, `flows/rankings-display`, `components/rankings/*`, `navbar*` and `footer` and keep their data assertions.
  - `apps/web` scripts: `dev` (port 3000), `check:types`, `lint` (Biome), `test`, `build`.
  - Root: `pnpm ci`.

## Logos (Sanity Global Settings: reuse the existing query)
**Where the logos live.** The `settings` document (`_id: "settings"`, project `8pbt9f8w`, dataset `production`, schema `apps/studio/schemaTypes/documents/settings.ts`) has three image fields. All are SVG, and none has `altText` or a caption.

| Field | Asset | Use in Phase 1 |
|---|---|---|
| `logo` | red "R" mark, 4347×2855 (single color `#e80022`, works on light and dark) | Fallback only, plus the current mobile-sheet mark |
| `footerLogo` | wordmark "R REDSHIRT SPORTS", red + black, 2931×485 | **Header in light mode** |
| `footerLogoDarkMode` | same wordmark, red + white, 2931×485 | **Header in dark mode** and the **footer** (the footer surface is `bg-ink`, dark in both themes) |

**The query already exists.** `queryGlobalSeoSettings` in `packages/sanity/src/queries.ts` projects `logo`, `footerLogo` and `footerLogoDarkMode` through `coreImageMetadataProjection` (id, alt, width, height, hotspot, crop, lqip). `navbar.tsx` fetches it in `getCachedNavbarSanity`, and `footer.tsx` receives `settingsData`. **Don't add GROQ.** Reuse that result and the `QueryGlobalSeoSettingsResult` type.

**Bugs to fix:**
- `components/logo.tsx` accepts `alt` but never passes it to `CustomImage` when `image` is set. Because the assets have no alt text, the projection falls back to `originalFilename`, so the header currently announces "Asset 3.svg".
- The footer's two `CustomImage`s have no alt, width or height.

**What to build:**
- **Header** (`navbar.tsx`, also used in the `navbar-client.tsx` sheet). Use a `<Link href="/">` around two `CustomImage`s:
  - `footerLogo` with `className="h-6 w-auto lg:h-7 dark:hidden"`;
  - `footerLogoDarkMode` with `className="hidden h-6 w-auto lg:h-7 dark:block"`.

  Give both `alt={settings.siteBrand ?? "Redshirt Sports"}` (it resolves to "Redshirt Sports"), `width={169} height={28}` (2931:485 at 28px), and `priority` (each SVG is about 7 KB). If a wordmark is missing, fall back to `logo` (`h-10 w-auto`).
- **Footer** (`footer.tsx`). Use `footerLogoDarkMode` with the same alt, `width={193} height={32}` and `className="h-8 w-auto"`, not priority. Only if James wants a light footer, use `footerLogo` with `dark:hidden` and swap.
- Check in DevTools that the logo requests return SVG, or a sharp 2× raster. If `sanity-image` adds parameters that degrade it, say so and ask; don't hard-code CDN URLs. The mockups show the result: `docs/mockups/brand/*.svg` are local copies used only by the static HTML. **Never import them in the app.**

## Step 0: audit this branch first (before any new code)
1. Run `git fetch && git status && git log --oneline main..HEAD && git diff --stat main...HEAD`.
2. Write `docs/blueprint/PHASE-1-AUDIT.md` with these columns: **changed file** | what it does now | **mockup + screenshot** it should match | **blueprint §** | **keep / fix / redo** | why.
3. Common problems to check for:
   - edits to the shared `packages/ui` globals (they break admin)
   - `--spacing` still at 0.2rem (everything about 20% tight)
   - raw pasted HTML or SVG
   - hand-rolled tables or tabs
   - invented colors
   - fake or hard-coded data
   - changed URLs
   - any account UI (sign-in, follow, notify, saved): delete it
   - a text "Redshirt Sports" logo instead of the Sanity logos
4. Revert anything marked redo in its own commit (`revert(phase1): … — audit row N`).

## Gate: before you start, reply with your plan and wait for approval
Reply with:
- the Step 0 table;
- for **each mockup, the exact files** you'll create or edit (route, components, queries, tests);
- the data that's missing for each page and your proposed fallback.

Don't write feature code until James approves.

## Tactics that keep this from stalling
- **Work one page at a time** in the order below: finish it, screenshot it, commit, then move on.
- For each page, open `docs/mockups/phase1/<page>.html` next to `localhost:3000`. Copy its **class lists and DOM structure** element by element into JSX, swapping fake text for real data and helper markup for shadcn.
- **Port the tokens verbatim** from `docs/mockups/src/app.css`: `:root`, `.dark`, `@theme inline`, and the `kicker`, `tabular` and `ad-slot` utilities. Leave out `portal-*` and `ph-photo`.
- After each page, compare screenshots at 1440, 820 and 390 with the PNGs (Playwright, like `docs/mockups/shoot_phase1.py`), and fix differences before committing.
- If one visual detail takes more than about 20 minutes, log it as a known difference and move on.

## Plan (steps, files, acceptance)
**1. Local environment.** Follow `LOCAL_DEVELOPMENT.md`: `supabase start`, seed, and render `/college/football/rankings/fcs/<year>/<week>`.
*Done when:* the page renders from local data and `DATABASE_URL` points at port 54322.

**2. Tokens and fonts** (§32.2–32.4).
- Add `apps/web/app/styles/redshirt.css`. It imports `@redshirt-sports/ui/globals.css`, then overrides `:root`, `.dark` and `@theme inline` with the mockup tokens: `--spacing: 0.25rem`, `up`/`down`/`new`/`gold`, `ink`, and `container-site`/`prose`.
- `app/layout.tsx` imports this file instead of the shared globals.
- Copy `docs/mockups/fonts/*.woff2` into `apps/web/app/fonts/` and load them with `next/font/local` as `--font-display` (Barlow Condensed 500–800), `--font-sans` (Inter Variable) and `--font-serif` (Source Serif 4). Mapping font families to these variables is the **only** permitted deviation from the token file.
- Keep `lang="en"` and `themeColor`.

*Done when:* admin is visually unchanged, web text renders in Inter and display headings in Barlow, and dark mode works.

**3. Chrome** (§32.7; `phase1/index.html`, screenshots `home-*`, `nav-mega-desktop`, `nav-sheet-mobile`).
- Reskin `navbar.tsx`, `navbar-client.tsx`, `footer.tsx` and `page-header.tsx` with the **Sanity logos** described in the Logos section.
- Desktop gets the mega nav (`navigation-menu`), mobile gets a `sheet`.
- The right side of the header has only Search and the theme toggle.
- Keep the Sanity nav and footer data and `getCachedNavbarLatestRankings`.

*Done when:* the header and footer match at all three widths in light and dark mode, logos have the right alt text and no layout shift, and the navbar and footer tests pass.

**4. Reskin the existing pages, one per commit.**
- home `app/page.tsx` (`phase1/index.html`)
- `college/[sport]/news` (`news`: **archive redesign**), `college/[sport]/news/[division]` (`division-news`: conference combobox), and the **new** `college/[sport]/news/[division]/[conference]` (`conference-news`)
- the article route (`article`)
- the **new** `college/teams` index (`teams`) and the team page (`team`: **single page, restructured**; route question above)
- then authors, about, contact, legal, search and not-found, using the card and typography patterns

*Done when:* each matches its screenshots, and URLs, metadata and JSON-LD are unchanged.

**5. Shared rankings components** (`apps/web/components/rankings/`):
- `rankings-header` (kicker, h1, meta, `RankingsFilters` as `select`)
- `rankings-tabs` (a `<nav aria-label="Rankings">` of links with `aria-current="page"`)
- `team-mark` (logo with an initials fallback)
- `rank-movement` (▲/▼/NEW/— shape plus text)
- `ballots-cta` (full and compact versions)
- `beyond-top-25`

Use shadcn `Tabs` only for switches inside a page.

**6. Poll tab** on the existing `[week]/page.tsx` (§32.11; `phase1/rankings.html`).
- Columns: Rk, ±, Team (first-place votes), Conf, Pts, Prev, and **On ballots** ("On X of N"). For the counts, add one cached query, `getBallotsListedForPollWeek` (X = ballots listing the team), and use `countBallotsForPollWeek` for N.
- Show **Record** only if data exists.
- Add the Biggest movers card.
- Add the "See all N ballots" card in the rail on desktop, and compact above the table on mobile.
- Add the three Beyond-the-Top-25 cards.
- Replace the inline breakdown with a link to `/ballots`.

*Done when:* the page matches `rankings-*` (plus `rankings-desktop-dark`), the counts match SQL on local data, and the tests pass.

**7. Ballots, all voters** (`[week]/ballots/page.tsx`, §32.11a; `phase1/ballots.html`).
- Unfiltered: every voter is a column.
- Sticky header and team column.
- RV rows below a divider.
- On and Range columns.
- The outlier ring, with configurable thresholds.
- Team search, and `?voters=` that only highlights (the canonical URL stays the base).
- Rebuild from `voter-ballot-breakdown/*`.

**8. By voter** (`ballots/by-voter/page.tsx`; `phase1/ballots-by-voter.html`).
- One card per voter with the full 25 in two columns.
- Diff chips: +n, −n, =, RV.
- `?q=` and `?sort=` (noindex when set).
- `?page=n` with six cards per page.

**9. Voters** (`[division]/voters/page.tsx`, §32.11b; `phase1/rankings-voters.html`).
- `listActivePollVoters` + `users_table`: name, organization and role, ballots this season, and a link to the voter's by-voter card.
- Leave out columns with no data and list them for James.

**10. History** (`[division]/history/page.tsx`, §32.11c; `phase1/rankings-history.html`).
- Rank-by-week chart (shadcn `chart`, inverted y axis) and the week-by-week table from `poll_rankings`.
- No. 1 history.
- Past seasons only if they're in the DB.

**11. Methodology** (`rankings/methodology/page.tsx`, §32.11d, §13.9; `phase1/rankings-methodology.html`). A static server component, one per sport.

**12. Poll index** (`college/[sport]/rankings/page.tsx`; `phase1/rankings-index.html`).
- One card per active poll (`listPolls` filtered by sport), each with the latest week's top 5, linking to `/[division]/[year]/[formatWeekSegment(week)]`.
- Polls with no published week are hidden, or shown as "Coming soon" if James says so.
- Add the new routes to `rankings/sitemap.ts`.

## Accessibility checklist (mandatory on every page, zero violations)
- [ ] `<html lang="en">`, exactly **one `h1`**, and headings in order with no skipped levels.
- [ ] Landmarks: `header`, `nav` (each one labeled), `main`, `aside`, `footer`.
- [ ] Alt text comes from data:
  - Team logos: `alt="{School} logo"`.
  - Site logo: `alt="Redshirt Sports"` (only the visible variant is exposed; the hidden one is `display:none`).
  - Decorative images, and avatars next to a visible name: `alt=""`.
- [ ] The rankings table and ballot matrix are real `<table>` elements with a `<caption>`, `th scope="col"` / `scope="row"`, and `aria-sort` on sortable headers.
- [ ] Icon-only buttons and links have an `aria-label`. Movement shows a shape plus text and an `aria-label` ("Up 2"), never color alone. Outlier cells get `sr-only` text.
- [ ] Every input, select and switch has a `<Label>`; filters sit in `role="search"` or a labeled group.
- [ ] Visible focus rings and full keyboard use: route tabs are links with `aria-current`, in-page tabs use shadcn `Tabs` (arrow keys).
- [ ] `prefers-reduced-motion` is respected (`motion-safe:` / `motion-reduce:`).
- [ ] WCAG AA contrast in light and dark mode, especially `text-up`, `text-down`, `text-new` and muted text on `muted`/`accent` backgrounds.
- [ ] **Biome a11y** passes: `pnpm --filter @redshirt-sports/web exec biome lint --only=a11y <paths>`.
- [ ] **jsx-a11y** passes, using a throwaway config that is not committed. Run `npx -y -p eslint@9 -p eslint-plugin-jsx-a11y -p typescript-eslint eslint -c /tmp/a11y.config.mjs <paths>` with this config:

  ```js
  import a11y from "eslint-plugin-jsx-a11y";
  import ts from "typescript-eslint";
  export default [{ files: ["**/*.tsx"], languageOptions: { parser: ts.parser }, ...a11y.flatConfigs.strict }];
  ```
- [ ] **axe** passes with **0 violations**. Add `@axe-core/playwright` and `@playwright/test` as apps/web devDependencies in their own commit, plus `apps/web/e2e/a11y.spec.ts`, which checks every Phase 1 URL at 1440, 820 and 390 in light and dark mode.

## Verification checklist (each page, then the whole branch)
- [ ] Screenshots at 1440×900, 820×1180 and 390×844 (and dark for rankings and ballots) compared with `docs/mockups/phase1/screenshots/`. No horizontal scroll at 390 except inside the ballot matrix.
- [ ] `pnpm check:types`, `lint`, `test` and `build` pass in `apps/web`, then `pnpm ci`, then `pnpm --filter admin build` (admin unchanged).
- [ ] Existing URLs return the same status and data: `preseason`, a numbered week and `final-rankings` for FBS and FCS, plus the `/api/v1/...rankings` routes. New routes render, and unknown divisions or weeks 404.
- [ ] No account UI anywhere: grep for `SignIn|UserButton|Follow|Notify|bookmark` in the changed files.
- [ ] The PR lists commit → § → mockup, known visual differences, and questions.

## Open questions (defaults until James answers)
1. Polls with no published week: hide them, or show "Coming soon"? *Default: hidden.*
2. Record data: it isn't in the DB. *Default: no Record column.*
3. History: are past seasons in `poll_rankings`, or only in the legacy tables? *Default: current DB seasons only.*
4. Voters have no slugs, outlets or disclosures. *Default: name, org and role, ballot count, anchor `#voter-{userId}`.*
5. Should admin adopt the new tokens? *Default: no.*
6. Header logo: wordmark (`footerLogo`/`footerLogoDarkMode`, as in the mockups) or the "R" mark (`logo`, today's site)? Footer: always the dark wordmark? *Default: wordmark, with the dark wordmark in the footer.*
7. Should James add alt text to the three logo assets in Studio, and later rename the fields (e.g. `wordmark`/`wordmarkDark`)? Phase 1 doesn't touch the schema.
