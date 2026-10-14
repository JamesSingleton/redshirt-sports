# Repo audit: starter (existing repo vs. blueprint v1.7)

Pre-filled from a **read-only** look at `JamesSingleton/redshirt-sports@main` (tree `c862c65`, Oct 14, 2026) through the GitHub API. Nothing in the repo was modified. Milestone 0 turns this into the real audit: verify each row locally, fill in the "Decision" column with James, and list the follow-up PRs.

## Already aligned with the blueprint

| Area | Repo today | Blueprint |
|---|---|---|
| Monorepo | Turborepo + pnpm (`pnpm@12.8.1`, Node ≥ 22.12), Biome, Vitest, version catalog in `pnpm-workspace.yaml` | Same (§6) |
| Apps | `apps/web`, `apps/admin`, `apps/studio` | Same plus `apps/vote` |
| Packages | `@redshirt-sports/{ui,db,sanity,auth,analytics,observability,clients,next-config,typescript-config}` | `@rs/*` names map to these; add `seo`/`urls`, `polls`, `brackets`, `emails` as needed |
| Next.js | 16.x App Router, `cacheComponents: true`, `cacheLife` from next-sanity | Cache Components (§18) |
| Styling | Tailwind v4.3, shadcn (`components.json` in web/admin/ui), `packages/ui/src/styles/globals.css`, no tailwind config file in the tree | Tailwind v4 CSS-first (§32). `CLAUDE.md` still mentions `packages/ui/tailwind.config.ts`, which no longer exists: fix that doc line |
| DB | Drizzle 0.45, schema in `packages/db/src/schema.ts`, migrations `apps/web/supabase/migrations/0000…0022`, local Supabase `config.toml` (db 54322) | Same tooling (§10). Paths differ: keep the repo's |
| Poll model | `polls`, `ballots`/`ballot_entries`, `poll_rankings`, `poll_voters`, weeks (ESPN calendar); see `CONTEXT.md` | §13. **CONTEXT.md is authoritative for poll domain terms** |
| Images | `sanity-image` already a web dependency | `sanity-image` (§26) |
| Rewrites | No `rewrites()` in `apps/web/next.config.ts` | Zero rewrites ✓ |
| **Rankings tabs (v1.7)** | Verify in Milestone 0: which of the poll, ballots, voters, history and methodology pages exist today under `app/college/[sport]/rankings/…`, and whether the ballots page defaults to all voters | Target §32.11–32.11d: unfiltered all-voters grid by default, `ballots/by-voter`, "On X of N ballots" (`ballots_listed`), See-all-ballots CTA, Dropped out / No longer receiving votes, `voters` roster linking ballots + `/people`, `history` (+ `/history/{year}`), `methodology`. New routes need no redirects |
| **URL shape (v1.6)** | `app/college/[sport]/…` serves `/college/football/…`, `/college/mens-basketball/…`, `/college/womens-basketball/…` (sport values per `CONTEXT.md`/polls); `app/college/news` serves `/college/news` | Level → sport: `/college/{sport}/…` ✓. `college/[sport]` with `dynamicParams = false` is an accepted alternative to generated static folders (§17.3) |
| Agent docs | Root `AGENTS.md` holds only the Turborepo-managed block; `apps/web/AGENTS.md` holds the Next.js-managed block; `CLAUDE.md`, `CONTEXT.md`; skills in `.agents/skills` and `.claude/skills`. No `.cursor/` | The handoff adds `.cursor/rules/` and replaces root `AGENTS.md`, keeping the managed block |

## Gaps and conflicts to decide

| # | Finding | Blueprint rule | Suggested action | Decision |
|---|---|---|---|---|
| A1 | `apps/web/next.config.ts` `redirects()` maps Sanity `redirect` docs with `permanent: redirect.permanent === true`, so non-permanent (307) redirects are possible | Legacy one-time **301/308 only** | Force `permanent: true`, and add Studio validation so `redirect` docs are legacy-only | **Permanent only** |
| A2 | `apps/studio/functions/auto-redirect` creates a redirect on every slug change (post/author/school) | No slug-change redirects. Published slugs are immutable (§12) | Make published slugs read-only, then retire the function (keep the redirects it already created as legacy) | **Read-only after publish.** Other fields still edit. A new URL is a manual legacy 301. Retire `auto-redirect` |
| A3 | `apps/web/proxy.ts` redirects signed-in users without `onboardingComplete` to `/onboarding` | No role-based redirects. Onboarding is an optional picker (§31) | Decide: keep (auth-flow exception) or render an inline prompt instead | **Voters only** |
| A4 | Voting lives at `/vote/college/[sport]/[division]` in `apps/web` (www) | `apps/vote` on `vote.redshirtsports.com` | New app, voting only. Legacy 301 from `/vote/*` when ballot editing moves | **`apps/vote` at `vote.redshirtsports.com`** |
| A5 | URLs today: `/college/[sport]/news[/division[/conference]]`, `/college/[sport]/rankings/[division]/[year]/[week]` (week `0`/`N`/`final-rankings`, see `docs/poll-weeks.md`), `/college/news`, `/college/teams/[slug]`, root `/[slug]` articles, `/authors/[slug]`. **No `/college` page** | v1.6 map: `/college` level hub, `/college/news`, `/college/{sport}/news`, `/college/{sport}/{division}/news`, `/college/{sport}/rankings/{division}/{year}/week-{n}`, `/college/{sport}/news/{slug}`, `/teams/{school-nickname}`, `/people/{slug}` | **Conflict reduced in v1.6.** Unchanged (no redirect): sport news, sport hubs, `/college/news`. New, so no redirect needed: `/college` hub. Residual legacy 301s: rankings week segment, `news/{division}` → `{division}/news`, `/college/teams/*`, root `/[slug]`, `/authors/*` | **Match the blueprint.** Move every path that does not already match, with a legacy 301 in the same PR |
| A6 | `apps/web/.env.example` documents `PROD_DATABASE_URL` and a `pnpm db:dump-prod` script (that script wasn't found in the web/db `package.json`) | Local-only for agents | Keep it James-only. It must stay empty in Cursor sessions (guard enforces this) | |
| A7 | `SCHOOL_SYNC_URL` defaults to the **production** webhook | Local-only | Default to `http://localhost:3000/...` in development | **Mock it locally.** Do not call production. Example seed supplies schools |
| A8 | Studio `build` also deploys the schema (per `CLAUDE.md`). Scripts `deploy`, `deploy:schema`; Sanity Functions via `sanity.blueprint.ts` | No deploys from agents | Agents use `dev`, `type`, `check:types` only | |
| A9 | `packages/clients` has an ESPN client; `apps/web/utils/espn.ts` | No game/score data product (§15) | Keep it for the poll week calendar only, and document that in the client | |
| A10 | Drizzle config lives in `apps/web/drizzle.config.ts` (`CLAUDE.md` says `packages/db/drizzle.config.ts`) | n/a | Fix `CLAUDE.md`; add the local-only guard (`LOCAL_DEVELOPMENT.md`) | |
| A11 | `apps/web/env.ts` requires Upstash Redis URL/token | Local stack | Local Redis via serverless-redis-http (`LOCAL_DEVELOPMENT.md`) | |
| A12 | Domain language: `CONTEXT.md` treats "Division" as a legacy term (Browse Scope / Sport Subgrouping). The blueprint uses `division` widely | n/a | Use CONTEXT.md terms in new code. Map blueprint "division" → Browse Scope | **Fresh language.** Browse Scope in new schema, types, and copy. Not a from-scratch rewrite of the live site |
| A13 | `apps/studio/functions/auto-redirect` builds school paths as `/college/teams/{slug}`; Sanity `school` has slugs (migration `add-school-slugs`) and Postgres `schools` has a slug (`0017_schools_slug.sql`) | Team hubs `/teams/{school-nickname}` | Check that slugs are nickname-style before using them for hubs | **`hollins` stays.** No nickname or mascot. `{school}-{nickname}` only when a nickname exists |
| A14 | Transfer Portal Tracker isn't in the repo yet (`CONTEXT.md` lists Transfer Portal as a product surface) | §16.1, UI redesign pending, story optional | Build the data/route plumbing first (Open Decisions #16, #17) | **Build it, including the uploaded tracker UI.** Story optional: "No story yet" |

## Milestone 0 output
Update this file: tick verified rows, record decisions, and add a "Follow-up PRs" list ordered by `BUILD_ORDER.md`.
