# AGENTS.md: Redshirt Sports

Redshirt Sports is a live college sports media site (www.redshirtsports.com): news, a credentialed-voter Top 25 poll, rankings, and Transfer Portal / Recruiting coverage. It's a Turborepo + pnpm monorepo: `apps/web` (public site, Next.js App Router), `apps/admin` (staff dashboard), `apps/studio` (Sanity Studio) and shared `packages/*` (`@redshirt-sports/ui`, `db`, `sanity`, `auth`, `analytics`, `observability`, `clients`, `next-config`, `typescript-config`).

## This is an evolution, not a rewrite

`docs/blueprint/` (v1.7, handoff edition) describes where the platform is going. **Evolve this repo toward it incrementally:**
- Keep the site live and green after every PR. Don't delete working features (polls, ballots, rankings, RSS, the rankings API) to "start clean".
- **Migrate in small PRs**, milestone by milestone, from `docs/blueprint/BUILD_ORDER.md`. **Milestone 0 comes first:** audit the repo against the blueprint (`docs/blueprint/REPO_AUDIT.md`) and prove the local stack runs.
- **URL structure is level → sport:** `/college/football/…`, `/college/mens-basketball/…`, `/college/womens-basketball/…`. `/college` itself has no page and returns 404. `/high-school/…` is a reserved future level and isn't built yet. This is the shape the site already uses, so `/college/{sport}/news` and `/college/news` **stay put, with no redirect**.
- **Old URLs get one-time legacy 301s.** When a route does move (for example `/college/football/rankings/fcs/2026/7` → `…/week-7`, `/college/football/news/fcs` → `/college/football/fcs/news`, or `/college/teams/{slug}` → `/teams/{school-nickname}`), ship the new route **and** its permanent redirect in the same PR, through the existing Sanity `redirect` docs + `next.config.ts` `redirects()`. Slug changes create automatic permanent redirects via the Sanity `auto-redirect` function; that and legacy 301s are the only redirects.
- The repo's names and paths win: blueprint `@rs/x` = `@redshirt-sports/x`; `supabase/migrations` = `apps/web/supabase/migrations`; `pnpm typecheck` = `pnpm check:types`.
- Domain language comes from `CONTEXT.md` (School, Division, Poll, Ballot, Rankings, Week…). `CLAUDE.md` has more architecture notes. Agents never build or deploy; dev, lint, typecheck, and test only. James runs every Studio, Functions, and Vercel build or deploy.

## Local only (hard rule)

All agent work happens against a **local stack**. Details: `docs/blueprint/LOCAL_DEVELOPMENT.md` and `.cursor/rules/01-local-only.mdc`.
- **Database:** local Supabase via `supabase start --workdir apps/web` (Docker). `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Run `drizzle-kit migrate` / `push` **only against local**, guarded by `node scripts/assert-local-env.mjs`. Seed with fake example data (`seed.sql`, `packages/db/seeds/*`, `db:seed:example`).
- **Never** run migrations, SQL or MCP tools against remote Supabase, Neon, Vercel, Sanity production or Clerk production. **No deploys and no builds that deploy** (`vercel`, `sanity deploy`, `sanity schema deploy`, `sanity blueprints deploy`, Studio `build`/`deploy`/`deploy:schema`). Agents run dev, lint, typecheck, and test only (A8). **No `vercel env pull`** and no production secrets in `.env*`. `PROD_DATABASE_URL` stays empty.
- **Sanity:** the `development` dataset (or the fixtures in `docs/blueprint/local-dev/`). **Clerk:** development instance keys (`pk_test_`/`sk_test_`). **Email:** Resend test mode (`delivered@resend.dev`) or `EMAIL_TRANSPORT=preview`.
- Setup: `pnpm dev:setup` (outline in `scripts/dev-setup.sh`), then `pnpm dev` (web :3000, admin :3001, studio :3333). Local values: `apps/*/.env.local.example`.
- If a task seems to need a remote system, stop and ask James.

## Rules in short (full versions in `.cursor/rules/`)
- **Stack:** Next.js App Router (Cache Components), Turborepo/pnpm, Tailwind v4 CSS-first (tokens in `packages/ui/src/styles/globals.css`, no `tailwind.config.*`), shadcn/ui, Drizzle, Supabase Postgres with RLS on every table, Clerk, Sanity, `sanity-image`.
- **URLs:** zero rewrites, App Router folders map 1:1 to public URLs, redirects only as legacy 301s plus automatic slug-change 301s from Sanity `auto-redirect`, pagination as `?page=n`, sport sections at `/college/{sport}/…` (`/college` itself 404s; `/high-school` reserved), team hubs at `/teams/{school-nickname}` (a school with no nickname, such as Hollins, keeps a single-token slug), voting in `apps/vote` at `vote.redshirtsports.com`.
- **Out of scope:** game/score/schedule data, live blogs, rosters, player pages or DBs, fan vote or fan-built rankings, comments/forums, sign-in modals on load.
- **Images:** AVIF/WebP via `sanity-image`, largest rendered image under 200 KB, explicit dimensions, no upscaling.
- **Transfer Portal Tracker** (§16.1): in scope. Build it to `docs/mockups/portal-tracker.html`. The story link is optional: show "No story yet" when it is empty (Decision #16). Do not hide or reject an entry for a missing story.

## Commands
| Task | Command |
|---|---|
| Local stack setup | `pnpm dev:setup` (add the script in Milestone 0) |
| Dev servers | `pnpm dev` |
| Lint / format | `pnpm lint`, `pnpm check:format` (Biome) |
| Types | `pnpm check:types` |
| Tests | `pnpm test` (Vitest); `pnpm ci` runs affected lint + types + tests |
| DB (local only) | `pnpm --filter @redshirt-sports/web db:generate` / `db:migrate` / `db:studio` |
| Sanity types | `pnpm --filter @redshirt-sports/studio type` |
| Env guard | `node scripts/assert-local-env.mjs` |

## Docs map
- `docs/blueprint/README.md`: section index; `BUILD_ORDER.md`, `REPO_AUDIT.md`, `OPEN_DECISIONS.md`, `LOCAL_DEVELOPMENT.md`
- `docs/mockups/`: static HTML mockups + screenshots (tracker UI is reference only)
- `docs/poll-weeks.md`, `docs/rankings-api.md`: existing poll docs (authoritative for current behavior)
- `.agents/skills/`: library skills (Next/Vercel, Sanity, Supabase, Clerk, shadcn, Turborepo, TDD)

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
