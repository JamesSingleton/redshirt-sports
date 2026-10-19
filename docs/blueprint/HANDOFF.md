# Handoff: blueprint v1.7 → `JamesSingleton/redshirt-sports`

This note now lives at `docs/blueprint/HANDOFF.md`. Decisions recorded Oct 14 supersede anything below that still says otherwise: `division` is canonical (Browse Scope is retired); slug changes keep automatic permanent 301s via `auto-redirect` (no slug lock); `/college` returns 404; agents never build or deploy Studio. See [OPEN_DECISIONS.md](OPEN_DECISIONS.md).

Paths below are repo-relative. Prepared Oct 14, 2026 after a read-only check of `main` (tree `c862c65`).

## Where each piece goes

| Handoff path | Goes to | Collision? | Notes |
|---|---|---|---|
| `AGENTS.md` | `/AGENTS.md` | **Replaces** the existing root file, which holds only the Turborepo-managed block | That block is kept verbatim at the bottom of ours, so `turbo` won't re-add it or create a diff. `apps/web/AGENTS.md` (Next.js-managed block) is untouched |
| `.cursor/rules/*.mdc` | `/.cursor/rules/` | None (no `.cursor/` in the repo) | `00-core` and `01-local-only` always apply; `10-db`, `20-sanity`, `30-ui`, `40-routing` and `50-portal-tracker` are glob-scoped to the repo's real paths |
| `docs/blueprint/` | `/docs/blueprint/` | None (`docs/` has only `poll-weeks.md`, `rankings-api.md`) | Numbered sections + `README.md` index, the full single-file md, `BUILD_ORDER.md`, `REPO_AUDIT.md`, `OPEN_DECISIONS.md`, `LOCAL_DEVELOPMENT.md`, `local-dev/` |
| `docs/mockups/` | `/docs/mockups/` | None | HTML, `css/app.css` (renamed from `dist/` because the root `.gitignore` ignores `dist`), `fonts/`, `screenshots/` (43 PNGs), `src/app.css`, generator scripts. Includes a `.gitignore` for `node_modules`. ~11 MB, mostly screenshots |
| `scripts/assert-local-env.mjs`, `scripts/dev-setup.sh` | `/scripts/` | None (no root `scripts/`) | Guard + `pnpm dev:setup` outline |
| `apps/{web,admin,studio}/.env.local.example` | same paths | None: new filenames next to the existing `.env.example` files | Local values only. `dev:setup` copies them to `.env.local`. `apps/web/.gitignore` ignores `.env.*`, so add them with `git add -f`, as the existing `.env.example` was |
| `HANDOFF.md` | Optional, e.g. `/docs/blueprint/HANDOFF.md`, or delete after use | n/a | |

**Not changed and not to be overwritten:** `CLAUDE.md`, `CONTEXT.md`, `README.md`, `apps/web/AGENTS.md`, the existing `.env.example` files, `package.json` (add `dev:setup`/`env:check` scripts in Milestone 0; see `LOCAL_DEVELOPMENT.md`).

## Install

```bash
cd ~/code/redshirt-sports            # your clone
git switch -c chore/blueprint-handoff
unzip ~/Downloads/redshirt-blueprint-handoff.zip -d /tmp/rs-handoff
rsync -av /tmp/rs-handoff/handoff/ ./ --exclude HANDOFF.md   # copies AGENTS.md, .cursor/, docs/, scripts/, apps/*/.env.local.example
git add -f apps/web/.env.local.example apps/admin/.env.local.example apps/studio/.env.local.example   # apps/web/.gitignore ignores .env.*
git status && git add -A && git commit -m "docs: add blueprint v1.7 handoff, Cursor rules, local-only tooling"
```

## Things the repo check turned up (details in `docs/blueprint/REPO_AUDIT.md`)
- Voting is at `/vote/...` inside `apps/web`, while the blueprint puts it on `vote.redshirtsports.com` (Decision #19).
- **URLs (much smaller conflict since v1.6):** the blueprint now uses `/college/{sport}/…`, the same shape the repo serves (`app/college/[sport]`), so sport news and `/college/news` keep their URLs. Decision #18 moves the rest, each with a legacy 301: rankings week segment (`/7` → `/week-7`, `0` → `preseason`, `final-rankings` → `final`), `news/{division}` → `{division}/news`, `/college/teams/*` → `/teams/*`, root `/[slug]` articles, `/authors/*`, and `/vote/*`. `/college` itself stays a 404.
- **Rankings and ballots (v1.7):** the poll pages in the repo should be compared against §32.11–32.11d in Milestone 0 (see the new *Rankings tabs* row in `REPO_AUDIT.md`). The ballot breakdown defaults to all voters (no pre-selected voter), `ballots/by-voter` and `{division}/history` are new static routes (no redirects), and "On X of N ballots" uses the existing `ballots_listed`-style count rather than a share bar.
- `next.config.ts` redirects from Sanity can be non-permanent, the Studio `auto-redirect` function makes slug-change redirects, and `proxy.ts` has an onboarding redirect. All three conflict with "legacy 301s only" and are flagged for Milestone 0.
- `.env.example` documents `PROD_DATABASE_URL` / `db:dump-prod`, and `SCHOOL_SYNC_URL` defaults to the production webhook. The local-only rule and guard cover both.
- `CLAUDE.md` mentions `packages/ui/tailwind.config.ts` and `packages/db/drizzle.config.ts`, neither of which exists. The real Drizzle config is `apps/web/drizzle.config.ts`.

## Before you start: one-time setup for James
1. Create (or confirm) a Sanity **`development`** dataset and a read token for local use.
2. Have the Clerk **development** instance keys ready (`pk_test_…`/`sk_test_…`).
3. Install Docker Desktop (for `supabase start`).
4. Optional: a Resend API key in test mode (only `@resend.dev` test recipients), or just use `EMAIL_TRANSPORT=preview`.

## Suggested first Cursor prompt

```
Read AGENTS.md, every file in .cursor/rules/, CONTEXT.md, and docs/blueprint/README.md,
BUILD_ORDER.md, REPO_AUDIT.md, OPEN_DECISIONS.md and LOCAL_DEVELOPMENT.md.

Do Milestone 0 only: "Audit the existing repo vs. the blueprint". No feature code.
1. Local stack: add the root scripts "dev:setup" and "env:check" from LOCAL_DEVELOPMENT.md,
   wire scripts/assert-local-env.mjs into the db:migrate/db:push scripts, then get
   `supabase start --workdir apps/web` + migrations + example seed running LOCALLY
   (DATABASE_URL on 127.0.0.1:54322). Use the Sanity development dataset and Clerk dev keys.
   Never touch remote Supabase/Neon/Vercel/Sanity production, never deploy, never
   `vercel env pull`. If something needs a remote system, stop and ask me.
2. Audit: verify every row in docs/blueprint/REPO_AUDIT.md against the code (file refs),
   build the current-URL → §17 route inventory, and list rewrites/redirects found.
3. Write the ordered follow-up PR plan for Milestones 0b–8 mapped onto this repo.
Tick the Milestone 0 boxes in BUILD_ORDER.md that you actually verified, and leave
the decision columns for me. Open one PR on a feature branch.
Remember: Transfer Portal Tracker UI is pending redesign (#17) and its story link is
optional (#16). Don't build tracker UI.
```
