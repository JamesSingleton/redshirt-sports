# Build order (Cursor)

Generated from [Appendix D](appendix-d-build-order-for-cursor.md) of blueprint v1.7 (handoff edition), with **Milestone 0: audit the existing repo vs. the blueprint** added at the top. The original "Milestone 0: Monorepo skeleton" is now **Milestone 0b** and is gap-fill only, because the repo already exists.

**How to use:** one milestone = one or more PRs on feature branches. Tick the boxes in the PR that satisfies them. Work strictly against the local stack ([LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md)). When the blueprint and the repo differ, the repo's names and paths win, and the blueprint's rules (no rewrites, legacy 301s plus automatic slug-change 301s, `?page=n`, product refusals) still apply. The numbered section files win over `sports-platform-blueprint-v1.7.md`.

**Evolution, not rewrite:** keep www.redshirtsports.com working after every PR. When a route moves, ship the new route and its legacy 301 in the same PR. Existing features (polls, rankings, ballots, RSS, the rankings API) keep working throughout. Milestones 1–3 and 5 are partly done in the repo already (schema, Clerk webhook, Sanity schemas, the poll engine). For those, treat each box as "verify or fill the gap" and don't rebuild what works.

**URLs (v1.6+):** the target is `/college/{sport}/…` (`football`, `mens-basketball`, `womens-basketball`). `/college` itself returns 404. `/high-school/…` is reserved for later. That's the shape the repo already serves, so most sport URLs stay where they are. Only the residual moves in [§27](27-legacy-redirects-from-the-current-site.md) need legacy 301s, each shipped with its new route (Decision #18).

---

### D.0 Conventions for the coding agent

- **Local only:** local Supabase (`127.0.0.1:54322`), the Sanity `development` dataset, Clerk dev keys, Resend test/preview. No remote SQL, migrations, MCP writes, deploys or `vercel env pull` (`.cursor/rules/01-local-only.mdc`).
- **Evolve the existing repo:** the repo's package names and paths win, and moved URLs get legacy 301s in the same PR.
- Work on feature branches; open PRs; never push straight to `main`.
- After each milestone: `pnpm lint`, `pnpm check:types`, relevant `pnpm test`, and for DB milestones `supabase test db`.
- Do not invent sports-data ingestion, live blogs, rosters, player pages, or `apps/workers`.
- All URLs go through `@rs/seo/urls`. All DB writes go through `@rs/db` query functions.
- Pin dependency versions in the pnpm catalog when scaffolding.

---

### Milestone 0: Audit the existing repo vs. the blueprint (no feature code)

**Do:** Read `AGENTS.md`, `.cursor/rules/`, `CONTEXT.md`, `CLAUDE.md` and this folder. Complete [REPO_AUDIT.md](REPO_AUDIT.md) by checking every row against the code. Get the local stack running. Add the local-only tooling (`scripts/assert-local-env.mjs`, `scripts/dev-setup.sh`, the `dev:setup`/`env:check` root scripts, the `.env.local.example` files, and the drizzle-config guard). Propose the PR sequence for Milestones 0b–8 mapped onto the existing code.

**Verify the local stack:**
- [ ] Docker running; `pnpm dev:setup` completes (or every step in it, run by hand)
- [ ] `supabase start --workdir apps/web` is up: Postgres on `127.0.0.1:54322`, Studio `:54323`, Inbucket `:54324`
- [ ] `apps/web/.env.local` has `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres` and `node scripts/assert-local-env.mjs` prints ✓
- [ ] `supabase db reset --local --workdir apps/web` applies all migrations (`0000…0022`) and `seed.sql` without errors; `pnpm --filter @redshirt-sports/web db:migrate` then reports nothing pending
- [ ] Example seed runs locally (fake schools, voters, ballots and one published week), and the rankings page renders from local data
- [ ] `drizzle-kit migrate`/`push` with a non-local `DATABASE_URL` is refused by the guard (try it with a dummy remote URL)
- [ ] Sanity Studio runs at `localhost:3333` on the **`development`** dataset (never `production`), and the web app reads from the same dataset
- [ ] Clerk sign-in works locally with **development instance** keys (`pk_test_`/`sk_test_`)
- [ ] Email goes to preview/test only (`EMAIL_TRANSPORT=preview`, or Resend test recipients)
- [ ] `pnpm dev` serves web `:3000`, admin `:3001`, studio `:3333`; `pnpm lint`, `pnpm check:types` and `pnpm test` pass
- [ ] No `vercel env pull` output, production secrets or `PROD_DATABASE_URL` value in any `.env*` file

**Audit, accept when:**
- [ ] `REPO_AUDIT.md` has every row verified (✓ / ✗ / n/a) with file references
- [ ] Each conflict (A1–A14) has a recorded decision or an owner question for James
- [x] Route inventory: every current public URL listed with its v1.6 target in [REPO_AUDIT.md](REPO_AUDIT.md). `/college/{sport}/news` and `/college/news` **keep** their URL. Residual moves ship with a legacy 301 (rankings week segment, `news/{division}` → `{division}/news`, `/college/teams/*`, root `/[slug]`, `/authors/*`, `/vote/*`). Decision #18.
- [x] `app/college/[sport]` stays a dynamic segment. Add `generateStaticParams` + `dynamicParams = false` with the newsroom routes. Do not generate static sport folders.
- [x] `/college` returns 404 (never a live URL; do not add a level hub) and `/high-school` is reserved
- [x] `rg -n "rewrites|NextResponse.rewrite" apps packages` recorded in REPO_AUDIT.md (no matches in code)
- [ ] Redirect inventory: Sanity `redirect` docs in the **development** dataset reviewed for non-permanent entries only (slug-change entries are allowed). No production writes. Not run in this environment (no local Sanity credentials); see REPO_AUDIT.md
- [x] Follow-up PR list written (ordered, each mapped to a milestone below) in REPO_AUDIT.md
- [x] Transfer Portal Tracker: **build the uploaded UI now (#17)** and **story optional (#16)**

---
Execution plan. One milestone = one PR against `main` (or your default branch). Do not skip acceptance criteria. Prefer implementing packages before apps that consume them.



### Milestone 0b — Monorepo skeleton (gap-fill in the existing repo)

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

> Most of this exists already (web/admin/studio, packages, Biome, CI, local `config.toml`). Only add what Milestone 0 found missing (for example `apps/vote`, a `urls`/SEO package, `@redshirt-sports/*` equivalents of the blueprint packages). Ports in the repo today are web 3000, admin 3001 and studio 3333; give `apps/vote` the next free port rather than renumbering admin.

**Do:** Turborepo + pnpm workspaces; `apps/web`, `apps/vote`, `apps/admin`, `apps/studio` (empty Next shells); `packages/{ui,config,env,db,auth,sanity,polls,brackets,seo,emails,analytics,observability,testing}`; Biome; root scripts; Vercel project stubs; Clerk apps wired with `AUTHORIZED_PARTIES`; Supabase local `config.toml`.

**Accept when:**
- [ ] `pnpm i && pnpm dev` starts web:3000, vote:3001, admin:3002, studio:3333
- [ ] Each app renders a stub page and shares one button from `@rs/ui`
- [ ] Clerk sign-in works on web; `authorizedParties` listed
- [ ] CI workflow runs lint + typecheck on the PR

---

### Milestone 1 — Drizzle schema + migrations (core tables)

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** Implement `packages/db` schema for users, roles, sports, schools, teams, conferences, seasons, weeks, team_seasons, polls/voters/invites/ballots/results, bracket_* (with `unique(sport,division,season_id)`), engagement (newsletter, contact). RLS policies. `adminDb` + `withRls`. `rs_server` role custom migration. Seed. pgTAP smoke tests for RLS deny-by-default on invites.

**Accept when:**
- [ ] `pnpm db:migrate` + `pnpm db:seed` on a fresh `supabase start`
- [ ] `drizzle-kit generate` produces no drift on CI
- [ ] Inserting a second `bracket_events` row for the same sport/division/season fails
- [ ] `withRls` test: user A cannot select user B's `bracket_entries` before lock

---

### Milestone 2 — Clerk webhook + auth helpers

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `upsertUserFromClerk`, soft delete, role mirror; webhook route on `apps/web` (or a tiny shared route package); `requireUserId` / `requireRole`; admin middleware staff gate; vote middleware protect.

**Accept when:**
- [ ] Creating a Clerk user produces a `users` row within one webhook delivery
- [ ] Non-staff visiting `admin.` get a 403 "Staff only" page linking to `vote.` (no redirect)
- [ ] Signed-out visitor hitting `/ballot` on vote. is sent to sign-in

---

### Milestone 3 — Sanity schemas + Studio + `sanity-image`

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `post`, `person`, `school`, `conference`, `category`, `tag`, `page` + sections, `podcast*`, `video`, `homepage`, `siteSettings`, `pollRelease`, `bracketPromo`, `jobPosting`. Studio structure. Reserved paths. Presentation tool pointed at web preview. `SanityImage` wrapper. Webhook → `revalidateTag`.

**Accept when:**
- [ ] Editor can publish a post with a 1920×1080 image and a byline `person`
- [ ] Featured image under 1920×1080 fails validation
- [ ] Page builder page at `/about` renders via catch-all
- [ ] Visual editing click-to-edit works on a page section in draft mode
- [ ] Article hero uses `SanityImage` with hotspot and LQIP

---

### Milestone 3b — Design system (§32)

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `packages/ui/src/styles/globals.css` exactly as §32.4 (Tailwind v4 `@theme inline`, oklch tokens, light/dark); `next/font` for Barlow Condensed, Inter, Source Serif 4; `components.json`; add the shadcn components listed in §32.5; build custom components (`SiteHeader` with mega nav, `TopTicker`, `StoryCard` variants, `RankingsTable`/`RankRow`/`MovementIndicator`, `TeamMark`, `AdSlot`, `FollowButton`, `OutboundLinkCard`); `next-themes`; a `/design` route (dev only) showing every component in both themes.

**Accept when:**
- [ ] No `tailwind.config.js` exists; all tokens come from `globals.css`
- [ ] `/design` renders all components in light and dark; contrast test passes AA for every token pair
- [ ] Header, ticker and story cards visually match `docs/mockups/screenshots/home-desktop.png` and `home-mobile.png` (side-by-side review)
- [ ] `AdSlot` reserves height at each breakpoint (Playwright CLS check ≤ 0.05 on a test page)
- [ ] `Pagination` renders real `<a href="?page=n">` links; page 1 link has no parameter

---

### Milestone 4 — Public newsroom routes

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** Route manifest (`LEVELS` + `SPORTS`) + factory + `pnpm routes:gen` (§17.3); `/college/news` (no `/college` page); sport hubs, division hubs, news index and division news with `?page=n`, article `/{sport}/news/{slug}`, sport-agnostic team hubs `/teams/{school-nickname}` with sport sections, conference hubs, portal and recruiting hubs (§16), the Transfer Portal tracker UI from `docs/mockups/`, people pages, `@rs/seo` metadata + JSON-LD + news sitemap + OG. Legacy-redirect table stub. **No rewrites.** Keep `college/[sport]` with `generateStaticParams` + `dynamicParams = false`.

**Accept when:**
- [ ] `/college/football/news/{slug}` returns 200 with NewsArticle JSON-LD
- [ ] `rg -n "rewrites|NextResponse.rewrite" apps packages` returns nothing; every `page.tsx` path under `app/(site)` equals its public URL
- [ ] `pnpm routes:gen && git diff --exit-code` passes (stubs are up to date; generator reads `LEVELS` + `SPORTS`)
- [ ] `/college` returns 404 and `/college/news?page=2` paginates; `/college/xyz` and `/high-school` return 404 (`/high-school` is reserved, not built)
- [ ] `/college/football/news?page=2` renders with canonical `…/news?page=2`; `?page=1` canonicalizes to `/college/football/news` without redirecting; `?page=0`, `?page=abc` and past the last page return 404
- [ ] The news shell is prerendered (PPR); only the river is dynamic and its data comes from a `"use cache"` function keyed by page
- [ ] `/teams/montana-state-bobcats/football` renders; `/teams/montana-state-bobcats/hockey` and `/college/football/xyz` return 404
- [ ] Changing a published post's slug creates a 301 from the old URL (Sanity `auto-redirect`, `permanent: true`). Slugs are not read-only
- [ ] `/transfer-portal?division=fcs&status=committed&position=qb&sort=name&page=2` filters correctly, canonicalizes to `/transfer-portal?division=fcs&page=2` with `noindex, follow`; `?division=bogus` drops the filter (noindex), `?page=abc` 404s; no redirects
- [ ] `PortalRow` matches `docs/mockups/portal-tracker.html` and the v1.7 `.portal-grid` in `docs/mockups/src/app.css` (Decision #17)
- [ ] Studio refuses to publish a committed `portalEntry` without `newSchool` and `committedOn`; an entry without a `story` shows a warning but publishes (story optional, Decision #16) and renders "No story yet"; publishing expires `portal:<sport>`
- [ ] Root `/about` is a page-builder page; root `/some-old-article-slug` 301s when mapped
- [ ] Lighthouse CI budgets for an article page meet §26 (or are recorded with a follow-up issue if fonts pending)
- [ ] Team hub shows outbound schedule/roster link cards when URLs exist

---

### Milestone 5 — Polls domain + vote app

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** Invite create/resend/revoke (admin); accept invite (vote); ballot editor; soft-validation warnings; `submitBallot`; poll tick cron (open/close/tabulate/publish); transparency pages on web; CSV export; MFA gate for voters; seasonal roster builder.

**Accept when:**
- [ ] Admin invites a user; invite email arrives; acceptance creates `voters` + Clerk `voter` role
- [ ] Second use of the same token fails; revoked token fails; wrong email fails
- [ ] Voter submits a 25-team ballot on `vote.`; after close it is locked
- [ ] Tick publishes on `publish_at`; web rankings page updates via tags without redeploy
- [ ] Public ballots page lists every locked ballot after publish; CSV hash matches `poll_week_summaries.computed_hash`
- [ ] `/college/football/rankings/fcs/2026/week-7/ballots` defaults to the **unfiltered** teams × all-voters matrix (no voter pre-selected) with a sticky header row and team column in a two-way scroll container, flags outliers per the configured rule (≥ 8 spots or a top-15 omission), highlights voters via `?voters=` without changing the canonical, and shows a per-team distribution (matches `ballots-desktop.png` / `ballots-mobile.png`)
- [ ] `…/ballots/by-voter` lists every voter with a full 25-team ballot card, a diff chip vs consensus on every pick, omitted top-15 teams, `?q=` search, `?sort=` and `?page=n` (matches `ballots-by-voter-*.png`)
- [ ] Poll page shows "On X of N ballots" (from `ballots_listed`), a "See all N ballots" CTA with the live voter count, and **Others receiving votes**, **Dropped out of the Top 25** (with last week's rank) and **No longer receiving votes** (matches `rankings-*.png`)
- [ ] `…/fcs/voters` roster links every voter to their current ballot and `/people/{slug}`; `…/fcs/history` renders the rank chart, week-by-week table and No. 1 history; `/rankings/methodology` documents points, FPV, eligibility, window automation, transparency, outlier policy and FAQ
- [ ] Property test: TS `tabulate` ≡ SQL variant on 50 random ballots

---

### Milestone 6 — Bracket engine + FCS event

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `@rs/brackets` formats + tests (Appendix A invariants); admin create event for `cfb/fcs/{year}` (unique); set field; public landing + pick editor on web; groups/invites; lock job; **manual results UI + `setBracketGameResult` + rescore**; leaderboards; share OG.

**Accept when:**
- [ ] Engine tests green for `fcs24` (23 games, 8 byes, max score 720)
- [ ] Creating two FCS events for the same season fails at the DB
- [ ] URL `/college/football/bracket-challenge/fcs/2026` resolves the unique event; `/college/football/bracket-challenge/fcs` renders a landing page (200, no redirect) linking to the current year
- [ ] Bracket view matches `bracket-desktop.png` / `bracket-mobile.png`: two halves converge on a centred final, selected game drives the `MatchupPanel`, pick share % comes from our entries only
- [ ] After lock, saves return `BRACKET_LOCKED`
- [ ] Staff sets R1 winners → entry scores and group standings update; clearing a result re-scores
- [ ] Incomplete entries at lock remain and score only picked games

---

### Milestone 7 — Remaining football brackets + polish

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `cfp12` (division `fbs`), `d2_28`, `d3_32`; newsletters (double opt-in + one digest); ads slots + CMP; Sentry crons; PostHog funnels; PWA manifest; full redirect import from current site; Search Console checklist.

**Accept when:**
- [ ] Each format passes engine invariants and a dry-run admin tournament
- [ ] Newsletter confirm → active → appears in Resend audience
- [ ] Poll tick and invite-expire crons checked in Sentry
- [ ] `/college/football/news` and `/college/news` serve the new pages with **no** redirect; old numeric rankings weeks (`/college/football/rankings/fcs/2026/7`, `/0`, `/final-rankings`) 301 to `week-7` / `preseason` / `final`; `/college/football/news/fcs` 301s to `/college/football/fcs/news`
- [ ] Root legacy article slugs 301 to `/college/{sport}/news/{slug}`

---

### Milestone 7b — Retention (§31)

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `user_follows`, `saved_items`, `newsletter_events`, `FollowButton` with intent-preserving sign-in, `OnboardingPicker`, "For you" feed, prompt budget hook + PostHog flag, `packages/analytics/events.ts` schema, Poll Release / Daily / My Teams newsletters (React Email + Resend, UTM tagging, webhook → `newsletter_events`), web push topics, saved articles, infinite next article (max 3), poll and bracket OG share cards, bracket reminders, PWA install card, PostHog dashboards (Retention, Poll day, Bracket).

**Accept when:**
- [ ] Anonymous user follows 2 teams in onboarding, signs up, and the follows persist (localStorage merge)
- [ ] No sign-in modal ever appears on the first or second article view (Playwright test)
- [ ] "For you" shows only followed-team articles first; cache tag `feed:user:<id>` revalidates on follow change
- [ ] Every event in §31.12 fires once with the documented properties (PostHog debug/live events check)
- [ ] Activation, Newsletter and Bracket funnels plus a D1/D7/D30 retention insight exist in PostHog
- [ ] Poll Release email sends within 5 minutes of poll publish with UTM-tagged links

---

### Milestone 8 — Basketball polls (season one)

- [ ] **Milestone complete** (all boxes below ticked, PR merged)

**Do:** `mbb` / `wbb` seasons, divisions, hubs, Top 25 polls, voter invites for basketball panels. No basketball bracket yet unless time remains (then `ncaab68` as Milestone 9).

**Accept when:**
- [ ] `/college/mens-basketball/rankings/d1` publishes a week
- [ ] Same poll engine code paths; no sport-specific forks beyond calendar config

---

### Explicit non-goals: refuse to build (reject if Cursor proposes them)

- Games/scores/standings ingestion or `/scores` / `/games` routes
- Live blogs or `*/live/*`
- Rosters or `/players/*`
- Recruiting/portal databases, feeds or scrapers (the portal tracker is Sanity `portalEntry` docs maintained by editors, the story link is optional (Decision #16); §16)
- Player photos, star ratings, grades, NIL valuations or prediction percentages in the tracker
- A fan vote or fan-built rankings (removed in v1.5)
- `apps/workers` or Sportradar/CFBD clients
- Moving voting back onto `admin.`
- **Any rewrite**: no `rewrites()` in any `next.config`, no `NextResponse.rewrite` in middleware, no proxy routes. App Router folders must map 1:1 to public URLs (§17)
- **Any redirect other than one-time legacy 301s** from old Redshirt URLs (§27) **and automatic slug-change 301s** from Sanity `auto-redirect`: no sport-change, "latest year", current→archive, `?page=1`, internal-path, case-normalization or role-based redirects. Render in place, set a canonical, or 404
- An internal `sports/[sport]` folder or a root `[sport]`/`[level]` dynamic segment (use the generated static `college/{sport}` folders, §17.3; a `college/[sport]` segment with `dynamicParams = false` is the only accepted alternative)
- The pre-1.6 single-segment keyword sport roots (see Changes in 1.6) or any alias for them; building the `/high-school/` level before it is designed
- Path-based `/page/n` pagination (use `?page=n`, §17.6)
- Sport-scoped team URLs like `/college/football/teams/{school}` as hubs (team hubs are `/teams/{school-nickname}`)
- Custom `next/image` Sanity loader (use `sanity-image` unless James reverses this)
- A `tailwind.config.js` or hard-coded hex colors in components (tokens only, §32.4)
- Comments/forums in 2026–27 (§31.9)
- Sign-in modals on page load or first article view (§31.2)
