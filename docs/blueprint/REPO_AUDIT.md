# Repo audit (existing repo vs. blueprint v1.5)

Verified locally on 14 Oct 2026 against tree `c862c65` plus the uncommitted handoff files. The **Decision** column is left blank for James. Questions are in the last column.

`rg -n "rewrites|NextResponse.rewrite" apps packages` returns **no matches**.

## Already aligned with the blueprint

| Area | Repo today | Blueprint | Verified |
|---|---|---|---|
| Monorepo | Turborepo + pnpm (`pnpm@12.8.1`, Node ≥ 22.12), Biome, Vitest, catalog in `pnpm-workspace.yaml` | Same (§6) | ✓ `package.json`, `pnpm-workspace.yaml` |
| Apps | `apps/web`, `apps/admin`, `apps/studio` | Same plus `apps/vote` | ✓ directories exist. `apps/vote` does not |
| Packages | `@redshirt-sports/{ui,db,sanity,auth,analytics,observability,clients,next-config,typescript-config}` | `@rs/*` maps to these; add `seo`/`urls`, `polls`, `brackets`, `emails` as needed | ✓ `packages/*/package.json`. Those four packages are absent |
| Next.js | 16.x App Router, `cacheComponents: true`, `cacheLife` from next-sanity | Cache Components (§18) | ✓ `apps/web/next.config.ts` (`cacheComponents`, `cacheLife`), `apps/admin/next.config.ts` |
| Styling | Tailwind v4.3, shadcn `components.json` in web/admin/ui, tokens in `packages/ui/src/styles/globals.css`. No `tailwind.config.*` file on disk | Tailwind v4 CSS-first (§32) | ✓ catalog `tailwindcss: ^4.3.3`. `packages/ui/package.json` still exports `./tailwind.config` → `./tailwind.config.ts`, and that file is not in the tree. `CLAUDE.md` line that named it is corrected in this PR |
| DB | Drizzle 0.45, schema `packages/db/src/schema.ts`, migrations `apps/web/supabase/migrations/0000`…`0022`, `config.toml` db port 54322 | Same tooling (§10). Keep the repo paths | ✓ `pnpm-workspace.yaml` `drizzle-orm: ^0.45.3`. Local reset applied `0000`–`0022`. See the stack note below: do not follow reset with `drizzle-kit migrate` |
| Poll model | `polls`, `ballots` / `ballot_entries`, `poll_rankings`, `poll_voters`, weeks | §13. `CONTEXT.md` is authoritative | ✓ `packages/db/src/schema.ts`. Retired tables `voter_ballot`, `weekly_final_rankings`, and `weekly_team_rankings` are still defined in that file |
| Images | `sanity-image` is a web dependency | `sanity-image` (§26) | ✓ `apps/web/package.json`, `apps/web/components/sanity-image.tsx` |
| Rewrites | No `rewrites()` | Zero rewrites | ✓ search above |
| Agent docs | Committed `AGENTS.md` at `c862c65` is only the Turborepo-managed block. `apps/web/AGENTS.md` is the Next.js-managed block. `CLAUDE.md`, `CONTEXT.md`, skills under `.agents/skills` and `.claude/skills` | Handoff adds `.cursor/rules/` and a root `AGENTS.md` that keeps the managed block | ✓ working tree has `.cursor/rules/00`–`50` and the handoff `AGENTS.md` with the managed block still at the bottom |

## Gaps and conflicts to decide

| # | Finding | Blueprint rule | Suggested action | Verified | Decision | Question for James |
|---|---|---|---|---|---|---|
| A1 | `apps/web/next.config.ts` `redirects()` sets `permanent: redirect.permanent === true`, so a Sanity doc can publish a 307 | Legacy one-time **301/308 only** | Force `permanent: true`, and validate `redirect` docs as legacy-only | ✓ `next.config.ts` redirect mapper. Studio field `permanent` is a plain boolean (`apps/studio/schemaTypes/documents/redirect.ts`) with `initialValue: true` only. Development dataset currently has 0 non-permanent docs (see inventory) | | Force `permanent: true` in `next.config.ts` and refuse `permanent != true` in Studio? |
| A2 | `apps/studio/functions/auto-redirect` creates a redirect on every post/author/school slug change (`permanent: true`) | No slug-change redirects. Published slugs are immutable (§12) | Make published slugs read-only, then retire the function. Keep redirects it already created | ✓ `apps/studio/functions/auto-redirect/index.ts`. Four of the five development redirects are slug edits (typos or a shorter school slug) | | Retire `auto-redirect` after slugs are read-only, and keep the five existing docs as legacy? |
| A3 | `apps/web/proxy.ts` sends a signed-in user with `onboardingComplete !== true` to `/onboarding` | No role-based redirects. Onboarding is an optional picker (§31) | Keep as an auth-flow exception, or render an inline prompt | ✓ `apps/web/proxy.ts` lines 35–38. Matcher is `/admin`, `/vote`, `/onboarding`, `/api/vote` | | Keep this redirect, or replace it with an inline picker? |
| A4 | Voting is `/vote/college/[sport]/[division]` in `apps/web` | `apps/vote` on `vote.redshirtsports.com` | Open Decision #19. Later, one legacy 301 for `/vote/*` | ✓ `apps/web/app/(auth)/(vote)/vote/college/[sport]/[division]/page.tsx` | | When should `/vote` move to `vote.`? No new www voting surfaces until then |
| A5 | Public URLs are `/college/[sport]/…`, `/college/teams/[slug]`, root `/[slug]`, `/authors/[slug]` | §17 static sport folders, `/teams/{school-nickname}`, `/{sport}/news/{slug}`, `/people/{slug}` | Open Decision #18. New route, verify, legacy 301, same PR | ✓ route inventory below | | Approve the first section to move, or hold all URL moves? |
| A6 | `apps/web/.env.example` documents `PROD_DATABASE_URL` and a comment about `pnpm db:dump-prod`. That script is not in `apps/web/package.json` or `packages/db/package.json` | Local-only for agents | Keep it James-only. Guard rejects a non-empty value | ✓ `.env.example` lines 27–29. `PROD_DATABASE_URL` is empty in the local env files. Guard list includes it | | Confirm it stays James-only and out of agent sessions |
| A7 | `SCHOOL_SYNC_URL` falls back to `https://www.redshirtsports.com/api/webhooks/sanity/school` | Local-only | Default to `http://localhost:3000/...` in development | ✓ `apps/studio/functions/sync-school/index.ts`. `apps/studio/.env.local` now sets `SCHOOL_SYNC_URL` to `http://localhost:3000/api/webhooks/sanity/school`, which overrides the fallback for local runs | | Change the code fallback, or keep production as the default and rely on the local env override? |
| A8 | Studio scripts: `build` is `sanity build`; `deploy` and `deploy:schema` exist. Functions are wired in `sanity.blueprint.ts`. `CLAUDE.md` says `build` also deploys the schema; the script itself is only `sanity build` | No deploys from agents | Agents use `dev`, `type`, `check:types` only | ✓ `apps/studio/package.json` scripts | | Leave `deploy` / `deploy:schema` in package.json for you to run by hand? |
| A9 | ESPN client in `packages/clients/src/espn/` and re-exported by `apps/web/utils/espn.ts` | No game/score product (§15). Calendar only | Document that limit on the client | ✓ comment added at the top of `packages/clients/src/espn/api.ts`. Week helpers live in `week-url.ts` | | Is the comment enough, or should score-shaped ESPN calls be deleted in a later PR if any remain? |
| A10 | Drizzle config is `apps/web/drizzle.config.ts`. `CLAUDE.md` said `packages/db/drizzle.config.ts` | n/a | Fix `CLAUDE.md`. Guard migrate/push | ✓ `CLAUDE.md` path corrected. `apps/web/drizzle.local-guard.ts` runs `scripts/assert-local-env.mjs` before migrate/push. `db:migrate` / `db:push` in `apps/web/package.json` call the guard first. A dummy `DATABASE_URL` on `203.0.113.10` made `drizzle-kit migrate` exit before applying SQL | | None. Done in this PR |
| A11 | `apps/web/env.ts` requires `UPSTASH_REDIS_REST_URL` and token | Local Redis via serverless-redis-http | Point env at `127.0.0.1:8079` | ✓ `apps/web/env.ts`. Local `rs-redis` (`:6379`) and `rs-srh` (`:8079`) are running, and the web env URL is `http://127.0.0.1:8079` | | None for the local URL. PostHog and Sentry keys in `.env.local` are still cloud endpoints |
| A12 | `CONTEXT.md` calls "Division" legacy (Browse Scope / Sport Subgrouping). Blueprint and DB columns still say division | n/a | New code uses CONTEXT.md terms. Map blueprint "division" to Browse Scope | ✓ `CONTEXT.md` "Division (legacy)". Schema still has `divisions`, `division_sports`, and poll `slug` values such as `fcs` | | Keep SQL column names, and use Browse Scope only in new product copy and types? |
| A13 | Sanity `school.slug` is documented as `{school}-{nickname}` (`apps/studio/schemaTypes/documents/school.ts`). Postgres `schools.slug` added in `0017_schools_slug.sql` | Hubs are `/teams/{school-nickname}` | Confirm slugs are nickname-style before hub URLs | ✓ development dataset: 1107 school slugs, 1106 have at least two hyphen segments, one does not (`hollins`). Example seed uses `{school}-{nickname}` | | Is `hollins` an exception to fix before `/teams/` hubs, or is a single-token slug allowed? |
| A14 | No Transfer Portal Tracker in the repo (`CONTEXT.md` names the product). No `portalEntry` schema | §16.1. UI redesign pending (#17). Story link optional (#16) | Data and route plumbing only, after you want that PR. No `PortalRow`, filters, or summary cards from the v1.5 mockups | ✓ no `portalEntry` type under `apps/studio/schemaTypes`. No `/transfer-portal` route | | Hold the plumbing PR until you want it. Do not build tracker UI |

## Local stack (what actually ran)

All of this was against Docker on `127.0.0.1`. No `vercel env pull`, no remote SQL, no `drizzle-kit push`.

| Check | Result |
|---|---|
| `supabase start --workdir apps/web` | Up. Postgres `127.0.0.1:54322`, API `:54321`, Studio `:54323`, Inbucket `:54324` |
| `node scripts/assert-local-env.mjs` | Prints ✓ for `apps/web`, `apps/admin`, and `apps/studio` `.env.local` |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` in web and admin. Studio does not set it |
| `supabase db reset --local` | Applied migrations `0000` through `0022` and empty `seed.sql` |
| `drizzle-kit migrate` after that reset | **Does not** report "nothing pending". Supabase applied the SQL; Drizzle's `drizzle.__drizzle_migrations` stays empty, so migrate tries to run the same files again and exits 1. `scripts/dev-setup.sh` does not call migrate/push after reset |
| `pnpm --filter @redshirt-sports/db db:seed:example` | Fake data only: 30 schools, 12 users, 12 ballots (football regular week 7), 30 `poll_rankings` rows (week 6 published, including 5 others receiving votes) |
| Rankings page | Not opened in the browser in this pass. Seed row is `/college/football/rankings/fcs/2026/6` |
| Non-local `drizzle-kit migrate` | Refused by the guard (`203.0.113.10`) before SQL |
| Sanity dataset | `development` in web, admin, and studio env. Studio process was not started. Web app was not started |
| Clerk | Keys are `pk_test_` / `sk_test_`. Sign-in was not exercised |
| Email | `EMAIL_TRANSPORT=preview` is set on web and admin. No message was sent |
| `pnpm lint` / `check:types` / `test` / `pnpm dev` | Not run as the acceptance trio in this pass |
| Still not local | Sanity `development` is hosted. Clerk dev instance is hosted. `NEXT_PUBLIC_POSTHOG_HOST` is `us.i.posthog.com`. `NEXT_PUBLIC_SENTRY_DSN` is Sentry ingest. Web `NEXT_PUBLIC_SITE_URL` is `www.redshirtsports.com`. Studio presentation URL is `www.redshirtsports.com`. `PROD_DATABASE_URL` is empty |

## Route inventory (current public URL → §17)

Open Decision #18: do not move any of these until you pick a section. "301?" means a legacy 301 belongs in the same PR as the new route. Admin and vote hosts are separate apps today, not www paths.

| Current URL | §17 target | 301? |
|---|---|---|
| `/` | keep `/` | no |
| `/about` | keep (page builder) | no |
| `/contact` | no §17 path; keep until a page-builder page replaces it | no, until you say otherwise |
| `/search` | keep `/search` | no |
| `/legal/[slug]` | keep as a page, or fold into `/{page-slug}` | no |
| `/authors/[slug]` | `/people/{slug}` | yes, #18 |
| `/[slug]` (root article) | `/{sport}/news/{slug}` | yes, #18. Root catch-all also 301s mapped legacy slugs |
| `/college/news` | no single §17 equivalent (news is per sport) | yes, once a destination exists |
| `/college/[sport]/news` | `/college-football/news`, `/mens-college-basketball/news`, `/womens-college-basketball/news` | yes |
| `/college/[sport]/news/[division]` | `/{sport}/{division}/news` | yes |
| `/college/[sport]/news/[division]/[conference]` | `/{sport}/conferences/{conf}` | yes |
| `/college/[sport]/rankings/[division]/[year]/[week]` | `/{sport}/rankings/{division}/{year}/week-{n}` (week segment changes) | yes |
| `/college/teams/[slug]` | `/teams/{school-nickname}` | yes |
| `/sign-in`, `/sign-up` | keep | no |
| `/onboarding` | keep `/onboarding` | no |
| `/vote/college/[sport]/[division]` | `apps/vote` `/ballot/{poll}/{year}/{week}` | yes, when #19 moves voting |
| `/vote/college/[sport]/[division]/confirmation` | vote app, no §17 twin | yes, with the `/vote` move |
| `/sitemap.xml`, `/robots.txt`, `/college/sitemap.xml`, `/college/news/sitemap/0.xml`, `/college/teams/sitemap.xml`, `/college/football/rankings/sitemap/0.xml` | §17 sitemap index under `app/sitemaps/` and `news-sitemap.xml` | yes, when those routes move |
| `/api/rss/feed.xml`, `/api/rss/[sport]/feed.xml`, `/api/rss/[sport]/[division]/feed.xml` | §17 `/{sport}/feed.xml` | yes, when sport feeds move. Keep the rankings API working the whole time |
| `/api/v1/college/[sport]/rankings/[division]` and `…/[year]/[week]` | keep the rankings API behavior; path can stay until a versioned successor is explicit | not in this audit |
| `/api/health`, `/api/health/ready` | keep `/api/health` | no |
| `/api/webhooks/auth`, `/api/webhooks/sanity/school`, `/api/draft-mode/enable`, `/api/draft-mode/disable`, `/api/revalidate-tags`, `/api/vote`, `/api/vote/college/…`, `/api/cron/…`, `/api/link-check` | §17 renames some webhook paths (`/api/webhooks/clerk`, `/api/webhooks/sanity`). Ship a legacy path or accept the webhook URL change with the provider | decide with the webhook PR |
| Admin `/`, `/polls`, `/rankings`, `/voters`, `/development`, `/sign-in`, `/sign-up` | §17 `admin.` `/ops/…` | no www 301. Staff gate today redirects non-admins to the public site (`apps/admin/lib/require-admin.ts`) instead of a 403 page |

There is no `/transfer-portal`, `/teams/…` hub, `/college-football/…`, bracket, podcast, or video route yet.

## Redirect inventory

**Config search.** No `rewrites()` and no `NextResponse.rewrite` under `apps/` or `packages/`.

**App redirects that are not legacy 301s** (left as-is; A3 and #18 decide them):

| Where | What it does |
|---|---|
| `apps/web/next.config.ts` `redirects()` | Loads published Sanity `redirect` docs. `permanent` follows the doc |
| `apps/web/proxy.ts` | Signed-in, onboarding incomplete → `/onboarding` |
| `apps/web/app/authors/[slug]/page.tsx` | `?page=1` redirects to the bare author URL |
| `apps/web/app/(auth)/(vote)/…/page.tsx` | In-flow redirects to `/` or the confirmation URL |
| `apps/web/app/api/draft-mode/disable/route.ts` | Disabling draft mode redirects to `/` |
| `apps/admin/lib/require-admin.ts` | Non-admin redirects to the public site |

**Sanity `redirect` docs on the `development` dataset** (read only, 5 published, all `permanent: true`, no drafts counted):

| Source | Destination | Note |
|---|---|---|
| `/2026-kansas-state-wildcats-preview-collin-kliens-return` | `/2026-kansas-state-wildcats-preview-collin-kleins-return` | Slug typo fix |
| `/2026-missouri-bears-preview-building-off-success` | `/2026-missouri-state-bears-preview-building-off-success` | Slug change |
| `/2026-notre-dame-fighting-irish-preview-unfished-business` | `/2026-notre-dame-fighting-irish-preview-unfinished-business` | Slug typo fix |
| `/college/teams/fairleigh-dickinson-knights` | `/college/teams/fdu-knights` | School slug shortened |
| `/privacy-policy` | `/legal/privacy-policy` | Path move, not a slug typo |

No non-permanent redirect docs. The four slug rows match what `auto-redirect` writes (A2).

## Follow-up PRs (Milestones 0b–8)

Ordered. One PR each unless a milestone says otherwise. Do not rebuild polls, ballots, rankings, RSS, or the rankings API. No tracker UI. No `drizzle-kit push`. No remote migrate.

| Order | Milestone | PR | Why this repo, this way |
|---|---|---|---|
| 1 | 0b | Add `@redshirt-sports/seo` with the URL helpers §17.8 describes (`SPORT_PATH`, article, team, poll, page). Do not add `apps/vote` and do not renumber ports (web 3000, admin 3001, studio 3333) | Package gap only. `apps/vote` waits on #19 |
| 2 | 1 | Gap PR, not a new schema: compare `packages/db/src/schema.ts` to §10, add missing RLS only where a table has none, and leave `voter_ballot` / `weekly_final_rankings` / `weekly_team_rankings` in place until you sign off a drop. Fix the Drizzle journal so `db:migrate` is a no-op after `supabase db reset` without re-applying SQL | Local proof already applied `0000`–`0022`. Do not generate a second copy of those migrations |
| 3 | 2 | Webhook gap: `apps/web/app/api/webhooks/auth/route.ts` already upserts users. Add the missing role helpers and change `apps/admin/lib/require-admin.ts` from a redirect to the §17 403 page. Do not add vote-host middleware until #19 | A3 stays untouched until you answer it |
| 4 | 3 | Sanity gap, no deploy: read-only published slugs, Studio validation that `redirect.permanent` is true, `SanityImage` hotspot/LQIP check, webhook `revalidateTag`. Do not delete `functions/auto-redirect` until you answer A2. Do not `sanity deploy` | A1 and A2 |
| 5 | 3b | Design-system gap: tokens already live in `packages/ui/src/styles/globals.css`. Diff them against §32.4, drop the dangling `./tailwind.config` export, add missing shadcn pieces, fonts, and a dev-only `/design` route | No `tailwind.config.js` |
| 6 | 4 | After #18, one section per PR: new §17 route, verify, legacy 301 in the same PR via Sanity `redirect` docs (permanent). First candidate is team hubs `/college/teams/[slug]` → `/teams/{slug}` once A13 (`hollins`) is answered. Articles and rankings stay on current URLs until their own PRs | No rewrites. `?page=n` only. Author `?page=1` redirect is a separate small PR if you want it removed |
| 7 | 4b | Portal/recruiting **plumbing only** when you ask: `portalEntry` schema, GROQ, zod params, cached loader, plain `/transfer-portal` list. Story optional (warning, not required). No `PortalRow`, filter bar, or summary cards | #16 and #17. Mockups are reference only |
| 8 | 5 | Poll gap on the current `/vote` routes: invite/resend/revoke, lock after publish, transparency pages, CSV. No new www voting surface. `apps/vote` is a later PR after #19, with one legacy 301 from `/vote/*` | Engine tables already exist |
| 9 | 6 | Bracket package and FCS event, new tables, local only | Nothing in the repo today |
| 10 | 7 | Other football bracket formats, newsletter, ads, Sentry cron checks, legacy 301 import for remaining old rankings URLs | Depends on 6 and #18 |
| 11 | 7b | Follows, saved items, onboarding picker, newsletters. Replace the A3 redirect only if you chose the inline picker | §31 |
| 12 | 8 | Men's and women's basketball polls on the same engine. New sport rows and hubs, no basketball bracket unless you add a Milestone 9 | Seed already inserts an inactive-ready `mens-basketball` / `mid-major` poll with no published week |

## Transfer Portal Tracker

**UI redesign pending (Open Decision #17).** **Story link optional (Open Decision #16).** This PR does not add `portalEntry`, `/transfer-portal`, or any tracker UI.
