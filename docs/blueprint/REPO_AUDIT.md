# Repo audit (Milestone 0)

Verified Oct 14, 2026 against `main` at `c862c65`, plus the guards and doc edits in this PR. Read-only on production: no Sanity production query, no remote SQL, no deploy.

Status: **✓** matches the blueprint or the recorded decision, **✗** still a gap (later PR), **n/a** not applicable.

## Already aligned

| Area | Repo today | Blueprint | Status |
|---|---|---|---|
| Monorepo | Turborepo + pnpm (`package.json` `packageManager` pnpm 12.8.1, `engines.node` ≥ 22.12), Biome, Vitest, catalog in `pnpm-workspace.yaml` | §6 | ✓ `package.json`, `pnpm-workspace.yaml` |
| Apps | `apps/web`, `apps/admin`, `apps/studio` | Same plus `apps/vote` | ✗ `apps/vote` is PR 2 |
| Packages | `@redshirt-sports/{ui,db,sanity,auth,analytics,observability,clients,next-config,typescript-config}` | `@rs/*` maps to these; add `seo`, `polls`, `brackets`, `emails` as needed | ✓ existing packages. ✗ new packages are PR 2 |
| Next.js | 16.x App Router, `cacheComponents: true` in `apps/web/next.config.ts` | Cache Components (§18) | ✓ |
| Styling | Tailwind v4, shadcn (`components.json` in web/admin/ui), tokens in `packages/ui/src/styles/globals.css`. No `tailwind.config.ts` in the tree | §32 CSS-first | ✓ `CLAUDE.md` now says there is no Tailwind config file |
| DB | Drizzle schema `packages/db/src/schema.ts`, migrations `apps/web/supabase/migrations/0000`–`0022`, local Supabase `apps/web/supabase/config.toml` (db 54322) | §10. Keep the repo's paths | ✓ config path. Local `supabase start` was not run here (no Docker) |
| Poll model | `polls`, ballots, rankings, voters; glossary in `CONTEXT.md` | §13. `CONTEXT.md` is authoritative for poll terms | ✓ `division` is now the canonical term |
| Images | `sanity-image` is a web dependency (`apps/web/package.json`) | §26 | ✓ dependency present. Featured-image size validation is PR 5 |
| Rewrites | No `rewrites()` and no `NextResponse.rewrite` in `apps/` or `packages/` code | Zero rewrites | ✓ see the search result below |
| Rankings tabs (v1.7) | One page: `apps/web/app/college/[sport]/rankings/[division]/[year]/[week]/page.tsx`. It embeds `RankingsVoterBreakdown`. No `ballots`, `ballots/by-voter`, `voters`, `history`, or `methodology` routes | §32.11–32.11d | ✗ new routes are PR 7. They need no legacy 301 |
| URL shape | `app/college/[sport]/…` serves `/college/football/…`, `/college/mens-basketball/…`, `/college/womens-basketball/…`. `app/college/news` serves `/college/news`. There is no `app/college/page.tsx` | Level → sport. `/college` is a 404 | ✓ shape. The dynamic-segment decision is below |
| Agent docs | Root `AGENTS.md` keeps the Turborepo block. `apps/web/AGENTS.md` keeps the Next.js block. `.cursor/rules/` is in this PR | Handoff rules | ✓ |

## Conflicts A1–A14

| # | Finding (file) | Decision | Status |
|---|---|---|---|
| A1 | `apps/web/next.config.ts` `redirects()` used `permanent: redirect.permanent === true`, so a Sanity doc could be a 307. Studio `redirect.permanent` had no validation (`apps/studio/schemaTypes/documents/redirect.ts`) | **Permanent only.** | ✓ This PR forces `permanent: true` and Studio rejects any other value |
| A2 | `apps/studio/functions/auto-redirect/index.ts` creates a redirect when a post, author, or school slug changes. It is still registered in `apps/studio/sanity.blueprint.ts` | **Keep auto-redirect. No slug lock.** Slug-change 301s are the one allowed exception besides legacy 301s. `toPublicPath` still emits today's URLs (`/authors/x`, `/college/teams/x`, root `/x`) until each #18 move | ✓ Function kept. Chain collapse added (`chain.ts`). No `readOnly` on slugs in `apps/studio/schemaTypes/common.ts` |
| A3 | `apps/web/proxy.ts` sends signed-in users without `onboardingComplete` to `/onboarding` | **Voters only.** Later moves to `apps/vote` | ✗ behavior change is PR 4 |
| A4 | Voting is `apps/web/app/(auth)/(vote)/vote/college/[sport]/[division]/` | **`apps/vote` at `vote.redshirtsports.com` (#19)** | ✗ shell is PR 2. www `/vote/*` stays until the move plus its 301 |
| A5 | Current public URLs are listed in the route inventory below | **Match the blueprint (#18).** Each move ships with its 301 | ✓ inventory written. Routes themselves are later PRs |
| A6 | `apps/web/.env.example` and `apps/web/.env.local.example` document `PROD_DATABASE_URL=""`. No `db:dump-prod` script in `apps/web/package.json` or `packages/db/package.json` | **Keep the variable, always empty, James only.** | ✓ `scripts/assert-local-env.mjs` refuses a non-empty `PROD_DATABASE_URL` |
| A7 | `apps/studio/functions/sync-school/index.ts` defaulted to `https://www.redshirtsports.com/api/webhooks/sanity/school` | **Only an explicit `SCHOOL_SYNC_URL`. Mock when unset or local.** James sets the URL before any Functions deploy | ✓ this PR |
| A8 | Studio `package.json` scripts `build`, `deploy`, and `deploy:schema` deploy schema or Studio. `CLAUDE.md` used to tell agents to build | **Agents run dev, lint, typecheck, and test only.** James deploys | ✓ `.cursor/rules/01-local-only.mdc`, `AGENTS.md`. Scripts are unchanged so James can still run them |
| A9 | ESPN client in `packages/clients/src/espn/api.ts` and `apps/web/utils/espn.ts` | **Poll week calendar only** | ✓ comment on `ESPN_BASE_SITE_URL` |
| A10 | Drizzle Kit config is `apps/web/drizzle.config.ts`. `CLAUDE.md` used to say `packages/db/drizzle.config.ts` | **Doc fix** | ✓ `CLAUDE.md` |
| A11 | `apps/web` env requires Upstash Redis URL and token | **Local `serverless-redis-http` shim** | ✓ documented in `LOCAL_DEVELOPMENT.md`. The shim was not started here (no Docker) |
| A12 | `CONTEXT.md` called Division a legacy label and used Browse Scope | **`division` is canonical. Browse Scope is retired** | ✓ `CONTEXT.md` rewritten |
| A13 | `auto-redirect` `toPublicPath` still builds `/college/teams/{slug}`. Postgres slug column is `apps/web/supabase/migrations` `0017` (schools slug). No `hollins` row is hard-coded in app code | **`hollins` keeps its single-token slug.** `{school}-{nickname}` only when a nickname exists | ✓ decision recorded. The path change to `/teams/{slug}` is the #18 team-hub PR |
| A14 | No `portalEntry` type and no `/transfer-portal` route | **Build the tracker UI now (#17). Story optional (#16)** | ✗ implementation is PR 7. Mockups and `.portal-grid` are in `docs/mockups/` |

## `college/[sport]` dynamic segment

**Keep** `apps/web/app/college/[sport]` as a dynamic segment. Do not generate static `college/football`, `college/mens-basketball`, and `college/womens-basketball` folders.

When the newsroom routes land (PR 7), add `generateStaticParams` for `football`, `mens-basketball`, and `womens-basketball`, and set `dynamicParams = false`, so an unknown sport 404s. That is the accepted alternative in §17.3.

Today there is no `dynamicParams` export under `app/college`. Unknown sports 404 only when `sportInfoBySlug` returns nothing (`apps/web/app/college/[sport]/news/page.tsx`). There is no `app/college/[sport]/page.tsx`, so `/college/football` itself 404s until a sport hub is added under the same dynamic segment.

## `/college` and `/high-school`

| Path | Today | Decision |
|---|---|---|
| `/college` | No `apps/web/app/college/page.tsx`. The App Router 404s | **Stay a 404.** Not a legacy URL. Do not add a page and do not 301 it |
| `/college/news` | `apps/web/app/college/news/page.tsx` | Stays. No redirect |
| `/high-school` | No `app/high-school` directory, so it 404s | **Reserved.** Do not build it. A `RESERVED_ROOT_SEGMENTS` list does not exist in code yet; add `high-school` when the page-builder catch-all lands |

## Rewrite search

```text
rg -n "rewrites|NextResponse.rewrite" apps packages --glob '!*.md'
```

No matches in code (Oct 14, 2026). `apps/web/next.config.ts` has `redirects()` and no `rewrites()` key.

The only hit under `apps/` or `packages/` in Markdown is `apps/web/posthog-setup-report.md` line 13, a historical note that reverse-proxy rewrites were added. Those rewrites are not in `next.config.ts` now.

## Route inventory

Sports below are `football`, `mens-basketball`, and `womens-basketball` (`packages/db/src/queries/sports.ts`). Week segments today come from `packages/clients/src/espn/week-url.ts`: numeric `0` and `N` are emitted; `preseason` and `final-rankings` are accepted; `999` formats as `final-rankings`.

| Current public URL | File | New URL | 301 |
|---|---|---|---|
| `/` | `apps/web/app/page.tsx` | same | none |
| `/about`, `/contact`, `/search` | `app/about/page.tsx`, `app/contact/page.tsx`, `app/search/page.tsx` | same | none |
| `/legal/{slug}` | `app/legal/[slug]/page.tsx` | same | none |
| `/sign-in`, `/sign-up`, `/onboarding` | `app/(auth)/…` | same on www until voting moves. Onboarding becomes voters-only (A3) | none for these paths |
| `/college` | no page | **404** | none |
| `/college/news` | `app/college/news/page.tsx` | same | none |
| `/college/{sport}/news` | `app/college/[sport]/news/page.tsx` | same | none |
| `/college/{sport}` | no page (404 today) | sport hub under the same dynamic segment | none (never a live URL) |
| `/college/{sport}/news/{division}` | `app/college/[sport]/news/[division]/page.tsx` | `/college/{sport}/{division}/news` | one pattern, `:division` constrained to known division slugs, same PR as the new route |
| `/college/{sport}/news/{division}/{conference}` | `…/news/[division]/[conference]/page.tsx` | `/college/{sport}/conferences/{conference}` | one pattern, same constraint, same PR |
| `/college/{sport}/rankings/{division}/{year}/7` (any numeric week except the preseason `0`) | `…/rankings/[division]/[year]/[week]/page.tsx` | `…/{year}/week-7` | pattern, same PR as the new week segment |
| `…/{year}/0` | same page (`formatWeekSegment` emits `0`) | `…/{year}/preseason` | pattern, same PR |
| `…/{year}/final-rankings` | same page | `…/{year}/final` | pattern, same PR |
| `/college/teams/{slug}` | `app/college/teams/[slug]/page.tsx` | `/teams/{slug}` (`hollins` stays `hollins`) | per-school rows or one pattern, same PR as team hubs |
| `/{slug}` articles | `app/[slug]/page.tsx` | `/college/{primarySport}/news/{slug}` | redirect rows, same PR as the article route. Page-builder pages that share the root stay |
| `/authors/{slug}` | `app/authors/[slug]/page.tsx` | `/people/{slug}` | one pattern, same PR |
| `/vote/college/{sport}/{division}` and `…/confirmation` | `app/(auth)/(vote)/vote/…` | `vote.redshirtsports.com` (ballot path from §17 when `apps/vote` ships) | one pattern when ballot editing moves. Leave www `/vote/*` in place until then |
| `/api/rss/feed.xml`, `/api/rss/{sport}/feed.xml`, `/api/rss/{sport}/{division}/feed.xml` | `app/api/rss/…` | same | none |
| `/api/v1/college/{sport}/rankings/…` | `app/api/v1/…` | same until a later API decision | none in this map |
| `/sitemap.xml`, `app/college/sitemap.ts`, `app/college/news/sitemap.ts`, `app/college/teams/sitemap.ts`, `app/college/[sport]/rankings/sitemap.ts` | those files | drop `/college` if it is ever added; point author and team URLs at the new paths in the same PR as each move | none |

`/high-school` is not in this table as a move. It 404s and stays reserved.

## Development-dataset redirects

Not reviewed. This environment has no `apps/*/.env.local`, no Sanity token, and no Docker. Querying the production dataset was out of scope. James (or a machine with the `development` dataset) should list `*[_type == "redirect"]{ "source": source.current, "destination": destination.current, permanent }` and fix any doc with `permanent != true`. Slug-change rows are allowed.

## Transfer Portal

- **#16** story optional. Studio warns. The row shows "No story yet".
- **#17** build the tracker UI from `docs/mockups/portal-tracker.html`, `transfer-portal.html`, `portal-row-variants.html`, and `docs/mockups/src/app.css` (the v1.7 `.portal-grid` block). Newer portal screenshots from the Oct 14 mockup zip are in `docs/mockups/screenshots/`.

## Follow-up PRs (ordered)

One milestone per PR, into `main`. Do not push to `main`.

| PR | Milestone | Scope |
|---|---|---|
| 2 | 0b | `apps/vote` shell on port 3002, `packages/seo` `urls` (no `level()` helper), Clerk `authorizedParties`, package stubs that are actually missing. Do not add `app/college/page.tsx` |
| 3 | 1 | Drizzle schema for core tables, `bracket_*`, invites, RLS, `adminDb` / `withRls`, seed, pgTAP. Regenerate migrations with drizzle-kit so the journal and snapshots match. Use `division`, not Browse Scope. No `schools.slug` lock trigger |
| 4 | 2 | Clerk webhook upsert and soft delete, `requireRole`, admin 403 (enable `authInterrupts` before `forbidden()`), voters-only onboarding (A3) |
| 5 | 3 | Sanity content model, Studio structure, Presentation, `SanityImage`, revalidate webhook. Featured image ≥ 1920×1080. No slug `readOnly`. Keep `auto-redirect` |
| 6 | 3b | §32 tokens, fonts, shadcn, custom components, `/design` |
| 7 | 4 | Public newsroom routes, including the portal tracker UI (#17) and a test that `/college` returns 404. Each moved URL from the inventory ships with its 301. Update `auto-redirect` `toPublicPath` in the same PR as each move, and collapse chains (already in the function). Add `generateStaticParams` + `dynamicParams = false` on `college/[sport]` |
| 8 | 5 | Polls and the vote app: invites, ballot editor, poll tick, transparency, CSV, MFA |
| 9 | 6 | `@redshirt-sports/brackets`, FCS event, picks, groups, lock, manual results, leaderboards. Paths are `/college/football/bracket-challenge/{division}/{year}` |
| 10 | 7 | Other bracket formats, newsletters, ads, Sentry crons, PostHog, PWA, full legacy-redirect import |
| 11 | 7b | Follows, saved items, For you, push, OG cards, dashboards |
| 12 | 8 | Basketball polls (mbb/wbb). Optional later: `ncaab68` if time remains |

## Local checks

Ran on this branch (Oct 14, 2026): `pnpm lint`, `pnpm check:types` (11/11), and `pnpm test` (studio, clients, ui, admin, web). `node scripts/assert-local-env.mjs` accepts the three `.env.local.example` files and exits 1 on a remote `DATABASE_URL` and a non-empty `PROD_DATABASE_URL`.

Not run: `pnpm dev:setup`, `supabase start`, and `supabase db reset --local` (no Docker and no Supabase CLI in this environment). No Clerk `pk_test_` key and no Sanity `development` dataset were configured, so Studio, sign-in, and the development-dataset redirect inventory were not exercised.
