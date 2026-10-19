## 1. Executive summary

The goal is a single platform that takes the best of what the big sports sites do, scoped to what Redshirt can run well with a small team:

1. **A newsroom**: fast, SEO-strong articles, team and conference hubs, people profiles, podcasts and video, and editor-built pages (ESPN, SI, Bleacher Report, The Athletic).
2. **Rankings with integrity**: Redshirt's own Top 25 polls with invite-only voters, published ballots and full audit (the AP-poll display pattern ESPN uses, plus transparency none of them offer).
3. **Interactive games**: a bracket challenge for each college football postseason (FBS/CFP, FCS, D-II, D-III), later men's and women's basketball, with groups and leaderboards (ESPN Bracket Challenge).

**Deliberately out of scope** (v1.2): a scores/schedules/standings data product, live scoring, live blogs, team rosters, player profiles, and recruiting/transfer-portal databases. Hubs **link out** to authoritative sources (school athletics sites, NCAA.com, conference sites) for schedules, scores and rosters (§15). Recruiting and portal news remain **editorial** (articles tagged by school).

The stack choices split cleanly by data shape:

| Concern | System | Why |
|---|---|---|
| Editorial content (articles, people profiles, schools and conferences as editorial references and link-out hubs, podcasts, video, one-off pages via a page builder) | **Sanity** | Structured content, real-time collaborative editing, Portable Text, image pipeline, scheduled publishing, visual editing |
| Transactional data (users mirror, voters and invites, ballots, poll results, bracket events, manually entered bracket results, entries, picks, groups, leaderboards, newsletters, entitlements) | **Supabase Postgres** | Relational integrity, transactions, constraints, RLS, materialized views, Storage |
| Data access layer | **Drizzle ORM** (`packages/db`) over Supavisor | Typed schema and queries in TypeScript, drizzle-kit migrations, RLS policies declared next to tables, transaction-scoped RLS for user reads |
| Identity (sign-in, sessions across `www`/`vote`/`admin`, roles, billing entitlement) | **Clerk** | Hosted auth UI, social login, shared sessions across subdomains, JWTs that Supabase accepts as a third-party auth provider, webhooks, optional Clerk Billing |
| Rendering and delivery | **Next.js App Router on Vercel** | Server Components, Cache Components / PPR, `revalidateTag`, edge network |
| Images | **Sanity Image CDN + `sanity-image`** | Hotspot/crop-aware `srcSet`, explicit width/height, AVIF/WebP via `auto=format` (§26) |
| Build and code sharing | **Turborepo + pnpm workspaces** | Shared UI, types, schemas, scoring engine; remote caching; per-app deploys |

The two signature features are first-class subsystems with their own packages:

- **`@rs/polls`**: invite-only voter onboarding (signed single-use, expiring invites; seasonal rosters; revocation), ballot windows with automated open/close, validation, locking, 25-to-1 tabulation, first-place votes, others receiving votes, week-over-week movement, public ballot transparency, audit and anti-abuse. Voters use **`vote.redshirtsports.com`**.
- **`@rs/brackets`**: a format registry (FCS 24 with 8 byes, CFP 12 with 4 byes, D-II 28 with 4 byes, D-III 32 with none; NCAA basketball 68 later), pick validation, lock times, scoring systems, deterministic tiebreakers, groups with invite codes, leaderboards from materialized views. **One bracket event per division per season**, at `/college/football/bracket-challenge/{fbs|fcs|d2|d3}/{year}`. **Results are entered by staff** in `admin.` game by game; each entry triggers a rescore.

A realistic path is an MVP in roughly **12.5 to 15.5 engineer-weeks** (design system + newsroom + page builder + polls + FCS bracket + retention basics), and a "season one" platform (all four football brackets, newsletters, push, fan engagement, ads, basketball polls) at roughly **18 to 22** (§28). **Estimate.** Appendix D is the step-by-step build order for Cursor.
