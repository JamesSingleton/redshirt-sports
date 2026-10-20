# Phase 1: style reskin + missing rankings pages (`apps/web`)

**Status:** approved scope (blueprint v1.7). The agent prompt is `PHASE-1-CURSOR-PROMPT.md`.

**The transition is incremental.** Phase 1 changes look and rankings only:
- no route moves
- no data model changes
- no migrations
- no redirects
- **no user accounts**

## In scope
Mockups and screenshots are in `docs/mockups/phase1/`, the no-accounts build.

| # | Work | Follows | Mockup → `phase1/screenshots/` |
|---|---|---|---|
| 1 | Tokens, fonts, dark mode in web-scoped `apps/web/app/styles/redshirt.css` (`packages/ui` globals stay untouched; admin shares them) | §32.2–32.4 | `../src/app.css`, `../fonts/` |
| 2 | Header/mega nav, mobile sheet, footer, page header, with **Sanity logos** (below). Sanity nav and footer data unchanged | §32.7 | `index.html` → `home-*`, `nav-mega-desktop`, `nav-sheet-mobile` |
| 3 | Restyle the existing pages: home, news indexes, article, team, authors/about/contact/legal/search | §32.8–32.10 | `index`, `news`, `division-news`, `article`, `team` |
| 4 | Poll tab on the existing week URL: On X of N, See all N ballots, Biggest movers, Others receiving votes / Dropped out / No longer receiving votes | §32.11, §13.9 | `rankings` (+ `-desktop-dark`) |
| 5 | Ballots: all voters, unfiltered matrix, outliers, `?voters=` highlight | §32.11a | `ballots` (+ `-desktop-dark`) |
| 6 | Ballots by voter | §32.11a | `ballots-by-voter` |
| 7 | Voters tab | §32.11b | `rankings-voters` |
| 8 | History tab | §32.11c | `rankings-history` |
| 9 | Methodology | §32.11d | `rankings-methodology` |
| 10 | **Poll index**: every poll for the sport, linking to its latest week | §17 `rankingsLanding` | `rankings-index` |

Every page has screenshots at 1440 (`-desktop`), 820 (`-tablet`) and 390 (`-mobile`). These screenshots are the source of truth.

## Not in Phase 1
**No user accounts:**
- sign-in or sign-up UI
- Follow teams or Following
- Notify me, alerts
- saved or bookmarked items
- "For you" or other personalization
- newsletter signup
- any Clerk-gated UI

Existing `app/(auth)/**` routes stay exactly as they are.

**Also out:**
- route moves and the year-less "current" URL
- redirects
- the `vote.` subdomain
- people/teams model changes
- portal, recruiting, brackets
- the Sanity page builder, schema and content edits
- ticker and bottom nav
- CSV + hash downloads
- the single-voter ballot page
- migrations

## Routes (under `apps/web/app/college/[sport]/rankings/`)
- **Existing, restyled:** `[division]/[year]/[week]`. Week segments stay `preseason` | `1…n` | `final-rankings`.
- **New:**
  - `page.tsx` (index)
  - `methodology`
  - `[division]/voters`
  - `[division]/history` (`/history/[year]` only if past seasons exist)
  - `[division]/[year]/[week]/ballots`
  - `…/ballots/by-voter`

Static segments win over `[division]` and `[year]`, and `[year]` already 404s on anything that isn't 4 digits. There are no other new URLs.

## Logos (Sanity `settings`, existing `queryGlobalSeoSettings`, no new GROQ)
| Field | Asset (SVG, no alt text in Sanity) | Phase 1 use |
|---|---|---|
| `logo` | red "R" mark, 4347×2855 | Fallback |
| `footerLogo` | wordmark, red + black, 2931×485 | Header, light mode |
| `footerLogoDarkMode` | wordmark, red + white, 2931×485 | Header, dark mode, and the footer (dark surface) |

Render them through `CustomImage` (sanity-image):
- **Alt:** pass `alt={siteBrand ?? "Redshirt Sports"}` explicitly. Today `components/logo.tsx` drops `alt`, so the filename "Asset 3.svg" is what gets announced.
- **Header:** 169×28, `h-6 lg:h-7 w-auto`, `priority`, with the light and dark variants toggled by `dark:hidden` / `dark:block`.
- **Footer:** 193×32.

The `docs/mockups/brand/*.svg` files are copies for the static mockups only; the app never imports them.

## Data (no schema changes)
- **Poll:** `poll_rankings` via `getFinalRankingsForWeekAndYear`, plus `lib/rankings-movement.ts`.
- **On X of N:** a new read query counts `ballot_entries` per school; N comes from `countBallotsForPollWeek`.
- **Ballots and By voter:** `getVotesForWeekAndYearByVoter` → `processVoterBallots`.
- **Voters:** `listActivePollVoters` + `users_table`.
- **History:** `poll_rankings` by season.
- **Index:** `listPolls` + `getLatestFinalRankingsBySportSlug`.
- **Caching:** every read goes through the `"use cache"` wrappers in `lib/rankings-data.ts`, with the existing tags.

## Rules
- **Local only:** Supabase on port 54322, seeds, Clerk dev, Sanity dev. Nothing ever touches production.
- **Read before changing:** read the blueprint and mockups first.
- **Convert, don't paste:** mockups become typed React server components with shadcn. Never paste raw HTML.
- **Tokens verbatim:** port them unchanged. The only deviation allowed is mapping fonts to `next/font/local` variables.
- **Ask on conflict:** if a mockup conflicts with the repo, stop and ask.
- **Small commits:** each one cites its blueprint section and mockup.

## Acceptance
- Matches the screenshots at 1440, 820 and 390 in light and dark mode.
- `check:types`, `lint`, `test` and `build` all pass, and the admin build is unchanged.
- Existing URLs and APIs behave the same.
- No account UI appears anywhere.
- **0 axe violations.** Biome a11y and jsx-a11y also pass, which means:
  - one h1, with headings in order
  - landmarks
  - tables with a caption, `th scope` and `aria-sort`
  - labeled controls and icon buttons
  - alt text: `{School} logo`, `Redshirt Sports` for the site logo, and `alt=""` for decorative images
  - visible focus and keyboard-operable tabs
  - reduced motion respected
  - AA contrast
  - movement never shown by color alone

## Open questions for James
1. Polls with no published week: hide them, or show "Coming soon"?
2. Is there record data?
3. Are past seasons in `poll_rankings`?
4. Voter slugs, outlets, disclosures?
5. Should admin get the new tokens?
6. Header logo: the wordmark (as in the mockups) or the "R" mark (today)? Should the footer always use the dark wordmark?
7. Add alt text to the logo assets in Studio, and later rename `footerLogo*` to wordmark fields?
