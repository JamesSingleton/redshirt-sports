# Sports Media Platform Blueprint
## Building an On3 / 247Sports / ESPN / Bleacher Report / The Athletic / SI-class platform on Next.js, Sanity, Clerk, Supabase and Turborepo

*Prepared for James Singleton, Redshirt Sports. Oct 14, 2026. Version 1.5.*

> **How to read this document.** This is a clean-slate design for the next-generation Redshirt Sports platform. It does not assume or preserve the current codebase or URLs; the goal is the best possible clone of the reference sites. The only migration concern is optional one-time 301s from old URLs (§27); the app itself has zero rewrites and no other redirects (§17). Everything marked **Estimate** is a planning number, not a quote. Facts about the reference sites are described as product features in general terms; no traffic, revenue or subscriber numbers are claimed for them.
>
> Library versions move fast. Pin exact versions in `pnpm-workspace.yaml` catalogs at the time you scaffold and check each library's current docs (Next.js caching APIs, Clerk's Supabase integration, Sanity Live) before copying snippets verbatim.

> **Handoff edition (Oct 14, 2026).** This copy of v1.5 is packaged for Cursor inside the **existing** `JamesSingleton/redshirt-sports` repo. Read it as the *target architecture* for evolving that repo, not as a clean-slate rebuild: migrate incrementally, keep www.redshirtsports.com live, and use one-time legacy 301s for any URL that moves. Where the blueprint names something the repo already has, the repo's names win (`@rs/*` packages mean the existing `@redshirt-sports/*` ones; `supabase/migrations` means `apps/web/supabase/migrations`; `pnpm typecheck` means `pnpm check:types`). Development is **local only** (local Supabase on port 54322, a non-production Sanity dataset, Clerk development keys, Resend test mode); see `LOCAL_DEVELOPMENT.md`. Two tracker changes vs. the v1.5 master: (1) the Transfer Portal Tracker stays in scope, but **its UI needs a redesign before anyone builds it**, so treat the §16.1 screenshots and `PortalRow` sketch as layout and data reference only; (2) the "every entry requires a Redshirt story" rule is **under review** (not every player has a story), so `story` is optional pending Open Decision #16 (§30). Third-party reference screenshots (MarchArena, On3) are not included in the handoff.
>
> **Changes in 1.5.** (1) **Fan vote removed entirely**: no `fan_ballots` table or RLS policy, no fan poll, no "Fans vs. voters" comparison, no Fan vote tab on rankings/ballots pages, no fan events (`fan_ballot_submitted`, `top25_*`) or retention mentions. Build-your-own Top 25 is removed with it (it lived in the same table); the only Top 25 is the voters' poll. Rankings rail now shows Biggest movers + a poll-release alert; screenshots re-shot. (2) **Transfer Portal Tracker** at `/transfer-portal` (§16.1), studied from On3's Transfer Portal Wire: Sanity `portalEntry` documents maintained by editors (no external data), each requiring a linked Redshirt story; filters for sport, division, status, position, conference and school search plus sort and `?page=n`, all in `searchParams` with a canonical/noindex policy; GROQ query, zod param parsing, cached data function; `PortalRow` built on a `portal-row` Tailwind v4 `@utility` with named `grid-template-areas` that restack on mobile. New screenshots `portal-tracker-desktop.png`, `-desktop-full.png`, `-mobile.png`; the portal hub now previews the tracker. MVP estimate 12.5–15.5 engineer-weeks.
>
> **Changes in 1.4.** (1) **Folders map 1:1 to URLs, zero rewrites**: every sport section is a real static folder (`app/(site)/college-football/…`, `mens-college-basketball/…`, `womens-college-basketball/…`) generated from a route manifest and bound to shared route modules by a factory; the internal `sports/[sport]` folder and all rewrites are gone; full tree in §17.4. (2) **No redirects except optional one-time legacy 301s** (§27): slugs and sport are immutable after publish, the bracket division URL renders a landing page instead of redirecting, non-staff on `admin.` get a 403 page, PostHog uses a managed proxy subdomain. Added to the "refuse to build" list. (3) **Sport-agnostic team hubs** at `/teams/{school-nickname}` (e.g. `/teams/montana-state-bobcats`) with sport sections `/football`, `/mens-basketball`, `/womens-basketball`; `schools.slug` is immutable; follows can target a whole school. (4) **Pagination is `?page=n`** (SI / The Athletic): page 1 has no parameter, self-canonical per page, no rel prev/next, all valid pages indexable, PPR shell + `"use cache"` data keyed by page (§17.6). (5) **Bracket view restyled after a study of marcharena.com** (two halves converge on a centred final, compact cards, connector lines, persistent matchup panel; §32.12) and split from the pick editor. (6) **Transfer Portal and Recruiting hubs** return as article-driven pages with storylines and an optional editor-maintained Sanity tracker (§16). (7) New mockups + screenshots: Voter Ballot Breakdown, news index, division news, Transfer Portal, Recruiting, bracket view; "What following does" (§31.3). MVP estimate now 12–15 engineer-weeks.
>
> **Changes in 1.3.** (a) New **§31 User retention strategy**: follows (teams, conferences, divisions, writers) driving a personalized "For you" home/feed; onboarding picker; Resend newsletters (Daily, Poll Release, My Teams, Bracket); web push for followed teams and poll releases; bracket groups and reminders; poll engagement (fan vote vs. voters, build-your-own Top 25 share cards); saved articles; related/next and infinite next article; weekly (not daily) streaks as a maybe; **comments: not in 2026–27**; OG share cards; PWA install; free-account value without a paywall. All personal features are gated behind Clerk sign-in with light, capped prompts. Includes the PostHog event schema, five funnels, D1/D7/D30 and W1/W4 cohort definitions, newsletter CTR and other targets (labeled estimates). Schema: `user_favorites` → `user_follows`, plus `saved_items`, `fan_ballots`. (b) New **§32 UI/UX direction and design system**: principles; Barlow Condensed + Inter + Source Serif 4 (OFL); oklch color tokens with Redshirt red, light/dark; the **Tailwind v4 CSS-first theme file** (`@theme inline`, no `tailwind.config.js`) and shadcn `components.json`; a **component inventory** (shadcn components used as-is vs. custom components composed from them); grid; header + mega nav; score-less poll/top-stories ticker; home, hub, article, rankings, bracket (desktop board + mobile round-by-round), vote. ballot (dnd-kit drag-to-rank + validation), people and page-builder layouts; mobile nav; CLS-safe ad slots; accessibility. **Static HTML/Tailwind v4 mockups** in `docs/mockups/` with Playwright screenshots (1440×900 and 390×844) embedded in §32. Roadmap/estimates and Appendix D updated (new Milestones 3b Design system and 7b Retention).
>
> **Changes in 1.2.** Implementation-ready for a Cursor-driven build. (1) **No game/score data product**: no games tables, ingestion workers, data providers, `/games/*`, `/scores`, schedules from feeds, or live scoring. Link out to external sources. Bracket results are entered by staff (admin UI + Drizzle rescoring action). (2) **No live blogs** and no `*/live/*` routes. (3) **No team rosters or player profiles** (tables, Sanity stubs, routes). (4) **Sport URLs stay `/college-football/`** (and `/mens-college-basketball/`, `/womens-college-basketball/`) with a short rationale. (5) **Pagination stays path-based** (`/page/n`) so pages can be static/ISR; query-string pages would force dynamic rendering. (6) **Bracket challenge**: one event per division per season at `/college-football/bracket-challenge/{fbs|fcs|d2|d3}/{year}`; schema uniqueness and routes match. (7) **Articles** at `/{sport}/news/{slug}`; the site root catch-all is reserved for the Sanity page builder; 301s from legacy root `/{slug}` article URLs. (8) **Voting moves to `vote.redshirtsports.com`** (`apps/vote`); `admin.` is staff-only; Clerk shares the session across subdomains of `redshirtsports.com`. (9) **Images**: replace the custom `next/image` loader with the `sanity-image` library (hotspot/crop, width/height, WebP/AVIF); note `next-sanity`'s image loader as an alternative. Poll open/close automation is unchanged. New **Appendix D: Build order for Cursor** with ordered tasks and acceptance criteria. Roadmap and estimates updated.

> **Changes in 1.1.** (1) **Drizzle ORM** is the data access layer in `packages/db`: TypeScript schema with RLS policies, drizzle-kit migrations into `supabase/migrations`, typed queries, `adminDb` + transaction-scoped `withRls()`, Supavisor pooling, and supabase-js kept only for Realtime, Storage and optional browser reads (§8.3, §10.10–10.16; key snippets converted). (2) **Voters are invite-only**: signed, single-use, expiring admin invites, Clerk role sync, revocation and seasonal roster tools; the public application flow is gone (§13.4). (3) A generic **`person`** model replaces authors, with profiles at **`/people/{slug}`** (§12.7). (4) One-off pages use a Sanity **page builder** with a catch-all route and visual editing (§12.8).

---

## Table of contents

1. Executive summary
2. Reference sites: what each does well
3. Feature map (including what is deliberately out of scope)
4. Architecture overview
5. System responsibility split: Sanity vs Supabase vs Clerk
6. Turborepo monorepo layout, apps and domains, pnpm and tooling
7. CI/CD and Vercel deployment
8. Identity: Clerk, roles, shared sessions, webhooks, Supabase third-party auth
9. Canonical data model: schools, teams, conferences, seasons
10. Postgres schema and the Drizzle data access layer
11. Row Level Security policies
12. Sanity content model, GROQ, Studio, people and the page builder
13. Top 25 polls: full lifecycle
14. Bracket Challenge: full design (manual results)
15. External links instead of a sports-data product
16. Transfer portal and recruiting hubs (article-driven)
17. Route map and URL structure
18. Rendering and caching strategy
19. SEO and AEO
20. Monetization
21. Notifications, newsletter, mobile and PWA
22. Observability
23. Testing strategy
24. Security
25. Accessibility
26. Performance budgets and image rules
27. Legacy redirects (optional one-time 301s)
28. Phased roadmap and effort
29. Cost estimates
30. Open decisions and risks
31. User retention strategy
32. UI/UX direction and design system (with mockups)
Appendix A: Bracket templates (FCS 24, CFP 12, D-II 28, D-III 32, NCAA basketball 68)
Appendix B: Environment variables
Appendix C: Glossary
Appendix D: Build order for Cursor

---

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
- **`@rs/brackets`**: a format registry (FCS 24 with 8 byes, CFP 12 with 4 byes, D-II 28 with 4 byes, D-III 32 with none; NCAA basketball 68 later), pick validation, lock times, scoring systems, deterministic tiebreakers, groups with invite codes, leaderboards from materialized views. **One bracket event per division per season**, at `/college-football/bracket-challenge/{fbs|fcs|d2|d3}/{year}`. **Results are entered by staff** in `admin.` game by game; each entry triggers a rescore.

A realistic path is an MVP in roughly **12.5 to 15.5 engineer-weeks** (design system + newsroom + page builder + polls + FCS bracket + retention basics), and a "season one" platform (all four football brackets, newsletters, push, fan engagement, ads, basketball polls) at roughly **18 to 22** (§28). **Estimate.** Appendix D is the step-by-step build order for Cursor.

---


## 2. Reference sites: what each does well

The descriptions below are product-level observations. They describe features in general terms and avoid claims about traffic, revenue or audience size.

### 2.1 On3

| Area | What it does well | Lesson for Redshirt |
|---|---|---|
| Recruiting database | Deep player profiles for high school recruits with position, measurables, hometown, school, offers, visits, predictions and commitment history | Out of scope for Redshirt's database; cover recruiting editorially and link to official commitment announcements |
| Proprietary rankings and valuations | Its own player ranking and an industry composite-style ranking, plus a NIL valuation product | The credibility lesson applies to Redshirt's polls: a clear methodology page and visible history |
| Transfer portal tracker | Filterable list of portal entries by position, school, status, with commit updates | High-intent search topic; Redshirt covers it with tagged articles and roundups rather than a tracker database; v1.4 adds an article-driven hub; v1.5 adds the **Portal Tracker** at `/transfer-portal`, built from editor-maintained Sanity `portalEntry` docs, each citing a Redshirt story (§16.1) |
| Team sites network | Team-specific sub-brands with their own writers and premium boards | Team hubs should feel like a "site within the site": own feed, beat writers, poll history and curated outbound links |
| Premium model | Subscriptions that unlock premium intel and message boards, often per team site | Entitlements should be modelled so you can sell "all access" or "one team" later |

### 2.2 247Sports

| Area | What it does well | Lesson |
|---|---|---|
| Recruiting rankings and composite | Long-running player rankings, a composite ranking blending several services, and team class rankings with a points formula | Not built; the general lesson is derived rankings should be recomputable from raw inputs (applied to polls and brackets) |
| Crystal Ball-style predictions | Expert predictions of where a recruit will commit, with a track record | Engagement via predictions maps to the bracket challenge here |
| Team sites and boards | Team-focused communities with insider posts and forums | Community is sticky but expensive to moderate; defer forums until there is moderation tooling |
| Commitment and transfer feeds | Constant stream of short updates | Short-form "update" content type separate from long-form articles |

### 2.3 ESPN

| Area | What it does well | Lesson |
|---|---|---|
| Scores and gamecasts | Scoreboard by sport/division/week, game pages with box score, play-by-play, win probability | Redshirt does not build a scores product; hubs link to official scoreboards instead (§15) |
| Breadth and hubs | Consistent hub per sport, league, conference and team with news, schedule, roster, stats, standings | Every entity gets the same predictable tab structure (for Redshirt: news, rankings, brackets, staff, links) |
| Fantasy and games | Bracket Challenge, pick'em, fantasy with groups, leaderboards and national standings | The bracket UX bar is high: fast pick entry on mobile, clear lock times, group management, shareable brackets |
| Rankings pages | AP and coaches poll display with points, first-place votes, previous rank and others receiving votes | This is the exact display format the Redshirt poll pages should match or exceed |
| App and alerts | Favorite teams drive personalized feeds and push alerts | "Favorites" is a core user preference table |

### 2.4 Bleacher Report

| Area | What it does well | Lesson |
|---|---|---|
| Social-first storytelling | Visual, mobile-first, shareable cards and short takes | OG image generation and share cards matter as much as the article page |
| Team streams | Feed per team mixing original posts, highlights and links | A unified feed can mix articles, quick takes and video |
| Personalization | Follow teams and get a custom feed and alerts | Same follows model as ESPN (§31) |
| Rankings and listicles | Power rankings and list content | Listicle/ranked-list content type in Sanity |

### 2.5 The Athletic

| Area | What it does well | Lesson |
|---|---|---|
| Subscription and metering | Hard or metered paywall, premium long-form, ad-light experience | Build a metering service early, even if paywall stays off, so the switch is a config change |
| Beat writer depth | Team-focused coverage by local writers | People profiles with bylines, beats (writer to team) and "more from this writer" |
| Clean reading UX | Fast, readable, minimal clutter | Performance budgets and typography matter more than features |
| Newsletters | Many topic newsletters | Resend + audiences per team/division |

### 2.6 Sports Illustrated (SI)

| Area | What it does well | Lesson |
|---|---|---|
| Brand and long-form | Feature writing and photography | Strong image pipeline and large featured images |
| Team and school sub-sites | A network of team-focused sites under one domain | Team hubs with optional per-team editorial staff |
| Evergreen and SEO content | Explainers, rankings and history pieces | Evergreen content types and internal linking |

### 2.7 Synthesis

The common pattern across all six is **entity hubs** (sport, division, conference, team) that aggregate editorial content and structured data. Redshirt keeps the hubs and its own data (polls, brackets) and links out for scores, schedules and rosters. Redshirt's edge is not breadth; it is **depth on underserved levels** (FCS, D-II, D-III, and soon college basketball) plus **community trust features** (transparent voter ballots, open brackets).

---

## 3. Feature map

Priority: **P0** = MVP, **P1** = season one, **P2** = later, **P3** = maybe. **Out** = deliberately not built (link out instead).

| Module | Inspired by | Features | Priority | Owner system |
|---|---|---|---|---|
| News | All | Articles at `/{sport}/news/{slug}`, categories, tags, bylines (people), related content, breaking banner, `?page=n` archives | P0 | Sanity |
| People profiles | The Athletic, SI | One `person` per human (writers, editors, photographers, hosts, staff, voters), `/people/{slug}`, masthead | P0 | Sanity |
| One-off pages | All | About, Contact, Privacy, Terms, Ethics/Corrections, Advertise, Careers via a section-based page builder at the site root | P0 | Sanity |
| Team hubs | ESPN, SI, On3 | News, poll history, bracket appearances, beat writers, **outbound links** (official schedule, roster, stats, tickets) | P0 | Sanity + Supabase |
| Conference hubs | ESPN | News, members, poll snapshots, outbound links (standings, schedule on the conference site) | P0 | Sanity + Supabase |
| Top 25 polls | AP/ESPN display | Invite-only voters, ballots, automated windows, tabulation, transparency, history | P0 | Supabase |
| Voter app | — | `vote.redshirtsports.com`: invites, ballots, history | P0 | Supabase + Clerk |
| Bracket Challenge | ESPN | One event per division per season; groups, leaderboards; **manual results** | P0 (FCS), P1 (FBS/CFP, D-II, D-III), P2 (NCAAB) | Supabase |
| Podcasts and video | ESPN, SI | Episode pages, embeds, transcripts | P1 | Sanity (+ YouTube/Mux) |
| Follows + For you feed | ESPN, B/R | Follow teams/conferences/divisions/writers, onboarding picker, personalized home (§31) | P0 | Supabase + Sanity |
| Newsletters | The Athletic | Daily, Poll Release, My Teams, Bracket (§31.4) | P0 (Poll Release), P1 (rest) | Resend + Supabase |
| Reader engagement | ESPN, B/R | Saved articles, poll share cards, Notify me on polls (§31); no fan vote | P1 | Supabase |
| Ads and sponsorships | All | Display ads, sponsored polls/brackets | P1 | Ad network + Sanity |
| Push and alerts | ESPN, B/R | Poll released, bracket lock reminders, followed-team news | P1 | Supabase + web push |
| Subscriptions | The Athletic, On3 | Metering, paywall | P2 | Clerk Billing or Stripe |
| Community | 247, On3 | Comments, boards: not in 2026–27 (§31.9) | P3 | Third party |
| Scores, schedules, standings, game pages | ESPN | — | **Out** (link out) | — |
| Live scoring, live blogs | ESPN, The Athletic | — | **Out** | — |
| Rosters, player profiles | ESPN, On3, 247 | — | **Out** (link out) | — |
| Transfer Portal + Recruiting hubs (article-driven) | On3, 247 | Storylines, commit coverage cards, Portal Tracker from Sanity `portalEntry` (§16) | P1 | Sanity |
| Recruiting DB, portal database, pick'em, predictions | On3, 247, ESPN | — | **Out** | — |

---

## 4. Architecture overview

```mermaid
flowchart LR
  subgraph Clients
    B[Readers / PWA]
    V[Invited voters]
    ST[Staff]
    E[Editors]
  end
  subgraph Vercel
    W["apps/web<br/>www.redshirtsports.com"]
    VO["apps/vote<br/>vote.redshirtsports.com"]
    A["apps/admin<br/>admin.redshirtsports.com"]
    S["apps/studio<br/>studio.redshirtsports.com"]
    CR[Vercel Cron]
  end
  subgraph Sanity
    CL[Content Lake]
    CDN[Sanity CDN + Image API]
  end
  subgraph Supabase
    PG[(Postgres via Supavisor)]
    STG[Storage]
  end
  CK[Clerk<br/>shared session *.redshirtsports.com]
  RS[Resend]
  SE[Sentry]
  PH[PostHog]
  EXT[External sources<br/>school sites, NCAA.com]

  B --> W
  V --> VO
  ST --> A
  E --> S
  S --> CL
  W -->|GROQ| CDN
  W -->|Drizzle| PG
  VO -->|Drizzle| PG
  A -->|Drizzle| PG
  VO --> STG
  W & VO & A --> CK
  CK -->|webhooks| W
  CL -->|webhooks| W
  CR -->|poll tick, reminders| A
  A -->|revalidate tags| W
  W -. outbound links .-> EXT
  W & VO & A --> RS
  W & VO & A --> SE
  W --> PH
```

**Key principles**

1. **Server-first reads.** Public pages read Sanity and Postgres on the server and cache aggressively with tags. The browser does not query Supabase in the MVP (Storage uploads use signed URLs).
2. **One write path per domain.** Ballots are written only through `submitBallot()`; picks only through `saveBracketEntry()`; results only through `setBracketGameResult()`. All are Drizzle transactions in `packages/db` that take row locks and enforce lock times, called from server actions that validate with zod.
3. **Postgres enforces invariants.** One ballot per voter per poll week, one bracket event per sport/division/season, one entry per user per group, rank uniqueness: constraints, not just app checks.
4. **Derived data is recomputable.** Poll results, bracket scores and leaderboards can be rebuilt from ballots, picks and admin-entered results at any time. Audits and corrections are safe.
5. **Content and data join by canonical IDs.** Sanity `school` documents carry the canonical `schoolId` used in Postgres, so a team hub joins both worlds without fuzzy matching.
6. **Own what's unique, link to what's commodity.** Redshirt owns polls, brackets and journalism; schedules, scores and rosters are links.

---

## 5. System responsibility split

### 5.1 The rule of thumb

> **If an editor writes it, it lives in Sanity. If a user or a machine writes it, or it needs a transaction, a constraint, or an aggregate, it lives in Postgres. If it answers "who is this person and what may they do", Clerk is the source of truth and Postgres keeps a mirror.**

### 5.2 Ownership table

| Entity | Source of truth | Mirror / reference | Notes |
|---|---|---|---|
| Article, podcast episode, video, gallery, one-off page (page builder) | Sanity | Optional Postgres `content_index` for search/analytics joins | Sanity webhooks push slug + ids for sitemaps |
| Person (writers, editors, photographers, hosts, staff, optional voter profiles) | Sanity `person` | Postgres `users.sanity_person_id`, `voters.sanity_person_id` | One profile per human; bylines, credits and hosts reference it (§12.7) |
| One-off pages (About, Contact, Privacy, Terms, Ethics, Advertise, Careers) | Sanity `page` (page builder) | Postgres `contact_submissions` for form entries | §12.8 |
| School (editorial: logo, colors, nicknames, bio, social) | Sanity `school` doc | Postgres `schools` (canonical id, slugs, division membership) | Sanity holds `schoolId` field equal to Postgres `schools.id` |
| Conference (editorial) | Sanity `conference` | Postgres `conferences` + `conference_memberships` by season | Membership changes by season live in Postgres |
| Division, sport, season, week | Postgres | Sanity references by string key | E.g. `sport='cfb'`, `division='fcs'` |
| Users | Clerk | Postgres `users` mirror via webhook | Postgres needs FK targets for ballots and entries |
| Roles (admin, editor, voter, moderator) | Clerk `publicMetadata.roles` + org roles | Postgres `user_roles` mirror | RLS reads JWT claims; server code reads Postgres |
| Voter status | Postgres `voters` (created only by accepting an admin invite) and `voter_invites` | Clerk `publicMetadata.roles` gets `voter`, mirrored to `user_roles` by webhook | Postgres is the source of truth per poll and season (§13.4) |
| Ballots, poll results | Postgres | Sanity optional `pollRelease` doc for the written commentary | Commentary article references `pollWeekId` |
| Brackets, picks, groups, leaderboards, admin-entered results | Postgres | Sanity `bracketPromo` for marketing blocks | Results are staff-entered; no feed (§14.11) |
| Subscriptions, entitlements | Clerk Billing or Stripe | Postgres `entitlements` mirror | Paywall checks read session claims first |
| Newsletter subscribers | Postgres `newsletter_subscriptions` | Resend audiences / contacts | Resend for delivery |

### 5.3 Data flow between systems

```mermaid
sequenceDiagram
  participant U as User
  participant C as Clerk
  participant W as apps/web
  participant P as Supabase Postgres
  participant S as Sanity
  U->>C: Sign up / sign in
  C-->>W: webhook user.created (svix-signed)
  W->>P: upsert users, user_roles
  U->>W: Request /college-football/news/slug-id
  W->>S: GROQ (cached, tag post:slug)
  W->>P: related rankings (cached, tag rankings:fcs)
  W-->>U: HTML (static shell + streamed dynamic holes)
  S-->>W: webhook on publish
  W->>W: revalidateTag(post:slug)
```

### 5.4 Why not put everything in one system?

- **Sanity as a database for ballots or picks** would lose transactions, uniqueness constraints and cheap aggregates; mutation rate limits and per-document costs also make high-write traffic a poor fit.
- **Postgres as a CMS** would lose the editorial UX (real-time collaboration, Portable Text, image hotspots, scheduled publishing, previews).
- **Clerk as the user database** is fine for identity but you cannot join Clerk to Postgres in SQL; hence the mirror.


---

## 6. Turborepo monorepo layout, pnpm and tooling

### 6.1 Directory tree

```text
redshirt/
├── apps/
│   ├── web/                    # www.redshirtsports.com — news, hubs, rankings, public brackets, page builder
│   ├── vote/                   # vote.redshirtsports.com — invite acceptance, ballot editor, voter home
│   ├── admin/                  # admin.redshirtsports.com — staff only: poll ops, invites, bracket results, roles
│   └── studio/                 # Sanity Studio (studio.redshirtsports.com or *.sanity.studio)
├── packages/
│   ├── ui/                     # shadcn/ui components, Tailwind preset, design tokens, icons, SanityImage wrapper
│   ├── config/                 # tsconfig bases, biome config, tailwind config, vitest config
│   ├── env/                    # @t3-oss/env-nextjs schemas shared across apps
│   ├── db/                     # Drizzle ORM: TS schema (tables, indexes, RLS), drizzle-kit, typed queries, adminDb + withRls
│   ├── auth/                   # Clerk helpers, authorizedParties, getCurrentUser, requireRole, webhook verification
│   ├── sanity/                 # Sanity schemas, GROQ queries, typegen, client, sanity-image helpers
│   ├── polls/                  # Pure: invite tokens, ballot validation, tabulation, movement, anti-abuse heuristics
│   ├── brackets/               # Pure: format registry, resolve, validate, score, rank/tiebreak
│   ├── seo/                    # Metadata, JSON-LD, sitemap builders, OG templates, urls.ts, reserved paths
│   ├── analytics/              # PostHog wrappers, event name constants
│   ├── observability/          # Sentry init helpers, logger
│   ├── emails/                 # React Email templates for Resend
│   ├── billing/                # Entitlements, metering (later)
│   └── testing/                # Factories, fixtures (bracket formats, ballots), Postgres test harness
├── supabase/                   # config.toml, migrations/ (from drizzle-kit), tests/ (pgTAP), functions/ (optional)
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── biome.json
└── .github/workflows/
```

**Why `supabase/` at the root:** the Supabase CLI expects one project directory for the local stack, pgTAP tests, Edge Functions and preview branches. drizzle-kit writes its migrations into `supabase/migrations` with the Supabase-compatible file prefix, so both tools read the same SQL files (§10.11). Types come from the Drizzle schema (`$inferSelect`), not from `supabase gen types`.

### 6.1a Apps and domains (web, vote, admin, studio)

There is **no `apps/workers`** and no ingestion service. Scheduled jobs (poll tick, reminders, newsletters, invite expiry, role reconcile) are Vercel Cron route handlers in `apps/admin` (§13.14).


| App | Domain | Audience | Owns |
|---|---|---|---|
| `apps/web` | `www.redshirtsports.com` | Readers | News, hubs, rankings display, brackets (public), page builder, SEO |
| `apps/vote` | `vote.redshirtsports.com` | Invited voters | Invite acceptance, ballot editor, voter home, own ballot history |
| `apps/admin` | `admin.redshirtsports.com` | Staff only | Poll ops, voter invites/rosters, bracket field + **manual results**, data corrections, roles |
| `apps/studio` | `studio.redshirtsports.com` (or `*.sanity.studio`) | Editors | Sanity Studio |

Voting does **not** live on `admin.`. A voter who bookmarks `admin.` and has no staff role gets a clear "wrong site" page that links to `vote.`.

#### Clerk: shared session across subdomains (not satellites)

`www`, `vote` and `admin` are all subdomains of **`redshirtsports.com`**. In production Clerk shares the session cookie across that root domain. You do **not** need Clerk satellite domains (those are for a *different* root domain).

Setup:

1. Clerk production instance: primary domain `redshirtsports.com` (or `www.redshirtsports.com` per Clerk's current primary-domain rules — follow the dashboard wizard).
2. Enable **Allowed Subdomains** and allowlist exactly: `www.redshirtsports.com`, `vote.redshirtsports.com`, `admin.redshirtsports.com` (and `studio` only if Studio uses Clerk, which it should not).
3. In every app's `clerkMiddleware` / `<ClerkProvider>`, set `authorizedParties` to that same allowlist so a compromised sibling subdomain cannot mint trusted sessions for the others.
4. Sign-in/sign-up UI can live on `www` (account) and/or `vote` (voter-first). Prefer one primary sign-in host (`www.redshirtsports.com/sign-in`) and link others there with `redirect_url` back, so users see one familiar surface. After sign-in on `www`, visiting `vote.` is already authenticated (shared cookie).
5. Development: three localhost ports do **not** share cookies. Use Clerk's development instance with three apps pointing at it, and accept re-auth per port — or use a tool like `lvh.me` / local DNS + HTTPS. Document the chosen local approach in `apps/vote/README.md`.

```ts
// packages/auth/src/authorized-parties.ts
export const AUTHORIZED_PARTIES = [
  "https://www.redshirtsports.com",
  "https://vote.redshirtsports.com",
  "https://admin.redshirtsports.com",
] as const;

// apps/vote/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { AUTHORIZED_PARTIES } from "@rs/auth/authorized-parties";
export default clerkMiddleware({ authorizedParties: [...AUTHORIZED_PARTIES] });
```

Staff gate on `apps/admin`: every route requires a staff role (`admin`, `poll_admin`, `bracket_admin`, `data_admin`, `editor`). Voters without a staff role get a 403 "Staff only" page with a link to `vote.` (no redirect).




### 6.2 `pnpm-workspace.yaml` with catalogs

```yaml
packages:
  - "apps/*"
  - "packages/*"

catalog:
  next: ^16.0.0
  react: ^19.2.0
  react-dom: ^19.2.0
  typescript: ^5.9.0
  zod: ^4.1.0
  "@clerk/nextjs": ^6.0.0
  "@supabase/supabase-js": ^2.50.0
  drizzle-orm: ^0.44.0
  drizzle-kit: ^0.31.0
  drizzle-zod: ^0.8.0
  postgres: ^3.4.0
  next-sanity: ^11.0.0
  sanity: ^4.0.0
  tailwindcss: ^4.1.0
  vitest: ^3.2.0
  "@sentry/nextjs": ^10.0.0
  posthog-js: ^1.250.0
  posthog-node: ^5.0.0
  resend: ^6.0.0
```

> Versions are illustrative. Use whatever is current when you scaffold, and keep them in the catalog so every app moves together.

### 6.3 Root `package.json`

```json
{
  "name": "redshirt",
  "private": true,
  "packageManager": "pnpm@10.17.0",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "db:start": "supabase start",
    "db:reset": "supabase db reset",
    "db:generate": "pnpm --filter @rs/db exec drizzle-kit generate",
    "db:custom": "pnpm --filter @rs/db exec drizzle-kit generate --custom",
    "db:migrate": "pnpm --filter @rs/db exec drizzle-kit migrate",
    "db:check": "pnpm --filter @rs/db exec drizzle-kit check",
    "db:seed": "pnpm --filter @rs/db exec tsx src/seed.ts",
    "db:studio": "pnpm --filter @rs/db exec drizzle-kit studio",
    "sanity:typegen": "pnpm --filter @rs/sanity typegen",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "@biomejs/biome": "^2.2.0",
    "typescript": "catalog:"
  }
}
```

### 6.4 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "globalEnv": ["NODE_ENV", "VERCEL_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "env": [
        "NEXT_PUBLIC_*",
        "SANITY_*",
        "CLERK_*",
        "SUPABASE_*",
        "SENTRY_*",
        "RESEND_API_KEY"
      ]
    },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e": { "dependsOn": ["build"], "cache": false },
    "typegen": { "outputs": ["src/sanity.types.ts", "schema.json"] }
  }
}
```

### 6.5 Package conventions

| Rule | Detail |
|---|---|
| Naming | `@rs/<name>`; apps are `@rs/web`, `@rs/vote`, `@rs/admin`, `@rs/studio` |
| Internal packages | "Just-in-time" TypeScript packages: `exports` points to `src/*.ts`, consuming Next apps list them in `transpilePackages`. No separate build step. Pure packages (`polls`, `brackets`) are also importable in Vitest without Next. |
| Boundaries | `packages/polls` and `packages/brackets` are **pure** (no DB, no network). DB access lives in `packages/db/queries/*`. Engines are unit-testable and usable in the browser for pick previews. |
| Server-only | Packages that touch secrets import `server-only` at the top. |
| Exports | Each package exposes subpaths, e.g. `@rs/db/queries`, `@rs/db/types`, `@rs/sanity/queries`, `@rs/sanity/schemas`, `@rs/auth/server`, `@rs/auth/client`. |

Example `packages/brackets/package.json`:

```json
{
  "name": "@rs/brackets",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./formats": "./src/formats/index.ts",
    "./scoring": "./src/scoring.ts"
  },
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "build": "tsup src/index.ts --format esm --dts"
  },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": { "vitest": "catalog:", "tsup": "^8.5.0", "@rs/config": "workspace:*" }
}
```

### 6.6 `packages/ui` with shadcn/ui

- Initialize with the shadcn CLI's monorepo support so components land in `packages/ui/src/components` and apps import `@rs/ui/components/button`.
- Tailwind v4: put tokens in `packages/ui/src/styles/globals.css` with `@theme` and import it from each app's root layout. Apps add `@source "../../packages/ui/src";` so classes in the package are scanned.
- Sports-specific components belong here too: `TeamLogo`, `RankBadge`, `MovementArrow`, `PollTable`, `BracketGrid`, `CountdownToLock`, `OutboundLinkCard` (for "Official schedule" / "Roster" / "Scores" cards on hubs).
- `SanityImage` wraps the `sanity-image` library with projectId/dataset defaults (§26).
- Theming per school: CSS variables `--team-primary`, `--team-secondary` set on team hub layouts from Sanity colors, with a contrast check (fall back to neutral if WCAG AA fails).

```css
/* packages/ui/src/styles/globals.css */
@import "tailwindcss";
@theme {
  --color-brand: oklch(0.55 0.2 25);
  --color-surface: oklch(0.99 0 0);
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-display: "Oswald Variable", var(--font-sans);
}
```

### 6.7 Local development

1. `pnpm i`
2. `supabase start` (Docker), then `pnpm db:migrate` and `pnpm db:seed` (schools, conferences, seasons, a sample poll with invited voters, an FCS bracket event with a few slots filled). `pnpm db:reset` rebuilds from scratch. `pnpm db:studio` opens Drizzle Studio.
3. Sanity: use a `development` dataset; `pnpm --filter @rs/studio dev`.
4. Clerk: development instance; set the Supabase third-party auth integration for local using the Clerk dev domain.
5. `pnpm dev` runs web (3000), vote (3001), admin (3002), studio (3333). Local Clerk sessions do not share across ports; see §6.1a.
6. Webhooks locally: `ngrok` or `cloudflared` tunnel for Clerk and Sanity webhooks, or use Clerk's dev webhook replay.

---

## 7. CI/CD and Vercel deployment

### 7.1 Projects

| Vercel project | Root directory | Domain | Notes |
|---|---|---|---|
| `redshirt-web` | `apps/web` | `www.redshirtsports.com` (apex → www) | `npx turbo-ignore` |
| `redshirt-vote` | `apps/vote` | `vote.redshirtsports.com` | Clerk shared session; voters only |
| `redshirt-admin` | `apps/admin` | `admin.redshirtsports.com` | Staff only; Vercel Cron targets; optional deployment protection on previews |
| `redshirt-studio` | `apps/studio` | `studio.redshirtsports.com` | Or `sanity deploy` to `*.sanity.studio` |

Enable **Turborepo Remote Cache** on Vercel so CI and deploys share build artifacts.

### 7.2 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }
jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm i --frozen-lockfile
      - run: pnpm turbo run lint typecheck test --filter="...[HEAD^1]"
  db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm i --frozen-lockfile
      - uses: supabase/setup-cli@v1
      - run: supabase start -x studio,imgproxy,inbucket
      - run: pnpm db:check                                  # migration journal is consistent
      - run: pnpm db:generate --name=ci_drift && git diff --exit-code supabase/migrations   # schema edited without generating?
      - run: pnpm db:migrate
        env: { DATABASE_URL_DIRECT: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" }
      - run: supabase test db           # pgTAP tests for RLS + functions
      - run: pnpm --filter @rs/db test  # Drizzle integration tests (withRls, locks, invites)
        env: { DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" }
      - run: supabase db lint --level warning
  e2e:
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm i --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm turbo run test:e2e --filter=@rs/web
        env:
          E2E_BASE_URL: ${{ secrets.PREVIEW_URL }}
```

```yaml
# .github/workflows/migrate.yml  (production DB migrations on merge)
name: migrate
on:
  push:
    branches: [main]
    paths: ["supabase/migrations/**"]
jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: production        # requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm i --frozen-lockfile
      - run: pnpm db:migrate            # drizzle-kit migrate: the ONLY applier for remote databases
        env:
          DATABASE_URL_DIRECT: ${{ secrets.DATABASE_URL_DIRECT }}   # session pooler, port 5432, postgres role
```

### 7.3 Environments

| Env | Next.js | Sanity dataset | Supabase | Clerk |
|---|---|---|---|---|
| Local | `next dev` | `development` | Local CLI stack | Dev instance |
| Preview (per PR) | Vercel preview (web + vote + admin) | `development` (or `staging`) | Shared `staging` project (branching optional) | Dev instance |
| Production | Vercel production | `production` | Production project | Production instance |

**Migration discipline:** forward-only migrations generated by drizzle-kit and reviewed as SQL in the PR; every destructive change is split into expand (add new column, dual-write) and contract (drop old column) across two deploys. Never run `db reset` against production. **Coding agents (Cursor) never run migrations, SQL or deploys against remote environments**; they work against the local stack only (`LOCAL_DEVELOPMENT.md`). The `migrate.yml` job is run by CI with manual approval, never by an agent.

### 7.4 Release gates

- Required checks: `verify`, `db`, `e2e` (smoke) must pass.
- Feature flags (PostHog) wrap risky features (bracket submission, paywall) so they can ship dark.
- Rollback = Vercel "Instant Rollback" to the previous deployment; DB changes are backward compatible by construction (expand/contract), so the old code still works.

---

## 8. Identity: Clerk, roles, orgs, webhooks and Supabase third-party auth

### 8.1 Role model

| Role | Granted by | Can do |
|---|---|---|
| `reader` (implicit) | Sign-up | Comment (later), create bracket entries, join groups, follow teams, manage newsletter prefs |
| `subscriber` | Billing entitlement | Read premium content, ad-light experience |
| `voter` | Accepting an admin-issued invite for a specific poll and season (no public applications) | Submit ballots for the polls and seasons they hold an active `voters` row for |
| `contributor` | Admin | Write drafts in Sanity (Sanity role), no publish |
| `editor` | Admin | Publish in Sanity; feature content; moderate |
| `poll_admin` | Admin | Open/close poll weeks, approve voters, void ballots, publish results |
| `bracket_admin` | Admin | Create bracket events, set field/seeds, enter results, rescore |
| `data_admin` | Admin | Manage schools/teams/conference memberships, legacy redirects, enter bracket results (with `bracket_admin`) |
| `admin` | Owner | Everything, including role grants |

**Where roles live:** Clerk `publicMetadata.roles: string[]` is the source of truth for staff roles and is copied into the session token so middleware and RLS can read it without a DB call. Voter membership is per poll and season and lives in Postgres (`voters`); accepting an invite also adds `voter` to `publicMetadata.roles` (plus `isVoter`) as a coarse gate, mirrored into `user_roles` by the webhook (§13.4).

**Clerk Organizations** are optional but useful for two things: (1) a "Redshirt Staff" org whose org roles map to staff permissions, and (2) future **sponsored or partner groups** (a media partner org that owns a sponsored bracket group). Bracket groups themselves do *not* need to be Clerk orgs; they are plain Postgres rows, which scales better and avoids per-org pricing.

### 8.2 Session token claims

In the Clerk dashboard, customize the session token:

```json
{
  "role": "authenticated",
  "roles": "{{user.public_metadata.roles}}",
  "is_voter": "{{user.public_metadata.isVoter}}",
  "plan": "{{user.public_metadata.plan}}"
}
```

The `role: "authenticated"` claim is what Supabase needs to map the request to the `authenticated` Postgres role. Clerk's native Supabase integration adds it for you; if you enable that integration, keep the custom claims small (session tokens should stay well under the cookie size limit).

### 8.3 Supabase third-party auth with Clerk, and how Drizzle uses it

1. In Clerk, enable the Supabase integration (it sets up the claims Supabase expects).
2. In Supabase: Authentication → Third-party auth → add Clerk with your Clerk domain. Supabase then trusts Clerk-signed JWTs for supabase-js, Realtime and Storage requests.
3. In Postgres, `auth.jwt() ->> 'sub'` is the **Clerk user id** (e.g. `user_2abc…`). All user-owned tables use `text` user ids, not `uuid`, and never reference `auth.users`.

**Data access is Drizzle ORM** (`packages/db`, §10.10–10.16). Server code never queries through supabase-js. There are three access paths:

| Path | Client | RLS | Used for |
|---|---|---|---|
| **Trusted server** | `adminDb` (Drizzle over Supavisor, dedicated `rs_server` role with `BYPASSRLS`) | Bypassed. Authorization is done in code: `auth()` from Clerk, then explicit `userId` filters, domain checks and DB constraints | Writes (ballots, picks, invites, audit), cached public reads, jobs, webhooks, workers |
| **RLS-scoped server** | `withRls(claims, tx => …)`: Drizzle transaction that runs `set local role authenticated` and sets `request.jwt.claims` from the **verified** Clerk session | Applies, same policies as the browser | Reads of private, user-owned data (my entries, my ballots, private group pages) where a missing `where` clause must not leak data |
| **Browser** | supabase-js with the Clerk session token (`accessToken`) | Applies | Optional: Realtime ping, own-row reads, Storage uploads with signed URLs. Not needed for MVP. |

```ts
// packages/auth/src/server.ts
import "server-only";
import { auth } from "@clerk/nextjs/server";

export type RlsClaims = { sub: string; roles: string[]; is_voter?: boolean };

/** Claims for withRls(). sessionClaims are already verified by Clerk middleware; never decode an unverified token. */
export async function getRlsClaims(): Promise<RlsClaims | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;
  return { sub: userId, roles: (sessionClaims?.roles as string[] | undefined) ?? [], is_voter: Boolean(sessionClaims?.is_voter) };
}

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
```

Browser client (Realtime and optional own-row reads only):

```ts
// apps/web/lib/supabase-browser.ts
"use client";
import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

export function useSupabase() {
  const { session } = useSession();
  return useMemo(
    () =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
        accessToken: async () => (await session?.getToken()) ?? null,
      }),
    [session],
  );
}
```

**Why both, deliberately.** Writes need to touch tables that have no client policies at all (audit logs, revisions, invites), so they run through `adminDb` with explicit checks. RLS is still written correctly so that (a) the browser can safely use the publishable key for Realtime and own-row reads, and (b) server reads of private data through `withRls` cannot leak other users' rows even if a query forgets a filter. Defense in depth.

**Simpler alternative for MVP:** skip `withRls` and the browser read path; revoke `anon`/`authenticated` grants and use `adminDb` everywhere with code-level authorization. The policies (declared in the Drizzle schema) can stay in place, so client access can be opened table by table later.

### 8.4 Middleware (`proxy.ts` / `middleware.ts`)

```ts
// apps/web/middleware.ts  (named proxy.ts in newer Next.js versions)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAccount = createRouteMatcher(["/account(.*)", "/:sport/bracket-challenge/:division/:year/my-bracket(.*)"])  // join can stay public-ish but still signed-in;

export default clerkMiddleware(async (auth, req) => {
  if (isAccount(req)) await auth.protect();
});

export const config = {
  matcher: ["/((?!_next|.*\\.(?:css|js|png|jpg|jpeg|webp|avif|svg|ico|woff2?|txt|xml)).*)", "/(api|trpc)(.*)"],
};
```

```ts
// apps/admin/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
const STAFF = ["admin", "poll_admin", "bracket_admin", "data_admin", "editor"];

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth.protect();
  const roles = (sessionClaims?.roles as string[] | undefined) ?? [];
  if (!roles.some((r) => STAFF.includes(r))) {
    return new Response(null, { status: 403 }); // rendered by app/forbidden.tsx: "Staff only" + link to vote. (no redirect)
  }
});
```

```ts
// apps/vote/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { AUTHORIZED_PARTIES } from "@rs/auth/authorized-parties";

const isPublic = createRouteMatcher(["/invite(.*)", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
}, { authorizedParties: [...AUTHORIZED_PARTIES] });
```

Route-level checks still happen in the page/action (`requireRole`) because middleware is a coarse filter.

### 8.5 Webhooks: Clerk → Supabase mirror

Events to subscribe: `user.created`, `user.updated`, `user.deleted`, `session.created` (optional, for last-seen), `organizationMembership.*` (if orgs are used), and billing events if using Clerk Billing.

```ts
// packages/db/src/queries/users.ts
import { and, eq, inArray, isNull, lt, notInArray, or, sql } from "drizzle-orm";
import type { UserJSON } from "@clerk/backend";
import { adminDb } from "../client";
import { users, userRoles, USER_ROLES } from "../schema";

type Role = (typeof USER_ROLES)[number];

export async function upsertUserFromClerk(u: UserJSON) {
  const primary = u.email_addresses.find((e) => e.id === u.primary_email_address_id)?.email_address ?? null;
  const updatedAt = new Date(u.updated_at);
  const roles = ((u.public_metadata?.roles as string[] | undefined) ?? []).filter((r): r is Role => (USER_ROLES as readonly string[]).includes(r));

  await adminDb.transaction(async (tx) => {
    const [row] = await tx.insert(users).values({
      id: u.id, email: primary, firstName: u.first_name, lastName: u.last_name, imageUrl: u.image_url, clerkUpdatedAt: updatedAt,
    }).onConflictDoUpdate({
      target: users.id,
      set: { email: primary, firstName: u.first_name, lastName: u.last_name, imageUrl: u.image_url, clerkUpdatedAt: updatedAt, deletedAt: null },
      setWhere: or(isNull(users.clerkUpdatedAt), lt(users.clerkUpdatedAt, updatedAt)),   // ignore out-of-order (older) events
    }).returning({ id: users.id });
    if (!row) return;                                                                      // stale event: nothing changed

    // Mirror roles exactly: Clerk publicMetadata.roles is the source of truth for staff roles and the coarse "voter" role
    await tx.delete(userRoles).where(roles.length ? and(eq(userRoles.userId, u.id), notInArray(userRoles.role, roles)) : eq(userRoles.userId, u.id));
    if (roles.length) await tx.insert(userRoles).values(roles.map((role) => ({ userId: u.id, role }))).onConflictDoNothing();
  });
}

export async function softDeleteUser(id: string) {
  await adminDb.update(users).set({ deletedAt: new Date(), firstName: null, lastName: null, email: null, imageUrl: null }).where(eq(users.id, id));
}
```

```ts
// apps/web/app/api/webhooks/clerk/route.ts
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq } from "drizzle-orm";
import { adminDb } from "@rs/db";
import { webhookEvents } from "@rs/db/schema";
import { upsertUserFromClerk, softDeleteUser } from "@rs/db/queries/users";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  let evt;
  try {
    evt = await verifyWebhook(req); // uses CLERK_WEBHOOK_SIGNING_SECRET (svix)
  } catch {
    return new Response("invalid signature", { status: 400 });
  }
  const svixId = req.headers.get("svix-id") ?? crypto.randomUUID();
  const [fresh] = await adminDb.insert(webhookEvents).values({ id: svixId, source: "clerk", type: evt.type })
    .onConflictDoNothing().returning({ id: webhookEvents.id });
  if (!fresh) return new Response("duplicate");       // already processed (svix retries)
  try {
    switch (evt.type) {
      case "user.created":
      case "user.updated":
        await upsertUserFromClerk(evt.data);
        break;
      case "user.deleted":
        if (evt.data.id) await softDeleteUser(evt.data.id);
        break;
    }
    return new Response("ok");
  } catch (err) {
    await adminDb.delete(webhookEvents).where(eq(webhookEvents.id, svixId)); // allow the retry to process it
    Sentry.captureException(err, { tags: { webhook: "clerk", type: evt.type } });
    return new Response("error", { status: 500 }); // svix retries with backoff
  }
}
```

Idempotency: upserts are keyed on the Clerk id and ignore events older than `clerk_updated_at`; `webhook_events` dedupes svix message ids.

**Lazy upsert fallback:** webhooks can arrive after the user's first request. Any server action that needs a user row calls `ensureUser(userId)` which fetches from Clerk's backend API and upserts if missing.

### 8.6 Deletion and privacy

`user.deleted` → soft-delete the row (`deleted_at`), anonymize display fields, keep ballots for poll integrity (ballot shows "Former voter" if the voter deletes their account; published polls must stay reproducible). Bracket entries are removed from leaderboards and anonymized. Document this in the privacy policy.

---

## 9. Canonical data model: schools, teams, conferences, seasons

### 9.1 Identity rules

| Concept | Canonical key | Example |
|---|---|---|
| School | `schools.id` (`uuid`) + immutable `slug` | `slug = 'montana-state'` |
| Team | (`school_id`, `sport`) → `teams.id` | Montana State football; Montana State women's basketball |
| Sport | short code | `cfb`, `mbb`, `wbb` |
| Division | short code per sport | football: `fbs`, `fcs`, `d2`, `d3`, `naia`; basketball: `d1`, `d2`, `d3` |
| Season | `seasons.id` = (`sport`, `year`) | `cfb-2026`; basketball display `2026-27` |
| Week | (`season_id`, `week_number`) + `season_type` | Used by poll weeks; not a sports-data schedule |
| Conference | `conferences.id` + slug; membership per season | Realignment via `team_seasons` |
| Bracket event | unique (`sport`, `division`, `season_id`) | One FCS 2026 challenge, one CFP/FBS 2026 challenge, etc. |

**Division is a team-season attribute**, not a school attribute: schools reclassify. `team_seasons(team_id, season_id, division, conference_id)` captures it.

There are **no `games`, `players`, or `roster` entities**. Schedules, scores and rosters are outbound links on hubs (§15). Bracket games are rows in `bracket_games` only (format slots + admin-entered winners), not linked to a sports feed.

### 9.2 Manual / editorial IDs

Schools and conferences are created in admin (or a one-time seed) and linked to Sanity. A small `provider_ids` table is optional for **importing historical poll data** that used ESPN/CFBD school ids — not for live feeds.

### 9.3 Sanity ↔ Postgres link

The Sanity `school` document has a read-only `schoolId` string field filled from Postgres. GROQ fetches the Sanity school by `schoolId`; SQL fetches poll/bracket history by the same id. Outbound link URLs (official site, athletics schedule URL, roster URL) live on the Sanity school doc so editors can update them without a migration.

## 10. Postgres schema and the Drizzle data access layer

**Source of truth: the Drizzle schema.** Tables, columns, indexes, constraints, RLS enablement and policies are declared in TypeScript in `packages/db/src/schema/*.ts`, and `drizzle-kit generate` turns them into SQL migrations. The SQL DDL in §10.1–10.9 is the **generated shape**, shown as SQL so reviewers can read it and pgTAP tests can be written against it. Anything Drizzle cannot declare (functions, triggers, materialized views and their refresh, `pg_cron` schedules, extensions, function grants) goes into **custom migrations** (`drizzle-kit generate --custom`) in the same folder, so there is one linear migration history. §10.10–10.16 cover the Drizzle side: package layout, config, schema code, RLS wiring, pooling, typed queries and where supabase-js is still used.

Conventions: snake_case; `uuid` PKs via `gen_random_uuid()` for domain entities; `text` for Clerk user ids; `timestamptz` everywhere; `created_at`/`updated_at` on mutable tables with a shared trigger; check constraints instead of Postgres enums (easier to evolve); all foreign keys indexed.

### 10.1 Extensions and helpers

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists pg_cron;      -- enable in dashboard
create extension if not exists pg_net;       -- for cron → edge function calls

create schema if not exists app;             -- private helper functions, not exposed via Data API

create or replace function app.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Current Clerk user id from the JWT (null for anon)
create or replace function app.uid() returns text language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')
$$;

-- Role check from JWT claims (staff roles in Clerk publicMetadata.roles)
create or replace function app.has_role(r text) returns boolean language sql stable as $$
  select coalesce((auth.jwt() -> 'roles') ? r, false)
      or coalesce((auth.jwt() -> 'roles') ? 'admin', false)
$$;
```

### 10.2 Users and roles

```sql
create table users (
  id text primary key,                         -- Clerk user id
  email citext,
  first_name text,
  last_name text,
  display_name text generated always as (
    coalesce(first_name,'') || case when last_name is not null and last_name <> '' then ' ' || left(last_name,1) || '.' else '' end
  ) stored,
  image_url text,
  sanity_person_id text,                       -- Sanity person doc link
  clerk_updated_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index users_email_uq on users (email) where deleted_at is null;
create trigger users_updated before update on users for each row execute function app.set_updated_at();

create table user_roles (
  user_id text not null references users(id) on delete cascade,
  role text not null check (role in ('admin','editor','contributor','poll_admin','bracket_admin','data_admin','moderator','voter')),
  granted_by text references users(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table user_follows (                    -- teams, conferences, divisions, people (§31.3)
  user_id text not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('school','team','conference','division','person')),  -- 'school' = all sports
  target_id text not null,                     -- team uuid, conference id, 'cfb:fcs', Sanity person _id
  notify_push boolean not null default false,
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index on user_follows (target_type, target_id);

create table saved_items (                     -- saved articles (§31.8)
  user_id text not null references users(id) on delete cascade,
  sanity_id text not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, sanity_id)
);

create table webhook_events (
  id text primary key,                         -- svix-id or sanity transaction id
  source text not null,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);
```

### 10.3 Sports reference data

```sql
create table sports (
  code text primary key check (code in ('cfb','mbb','wbb')),
  name text not null
);

create table divisions (
  sport text not null references sports(code),
  code text not null,                          -- fbs, fcs, d2, d3, naia, d1
  name text not null,
  sort_order int not null,
  primary key (sport, code)
);

create table schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique                    -- public team-hub slug: "montana-state-bobcats" → /teams/montana-state-bobcats
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_slug text not null unique,             -- "montana-state" (internal lookups, legacy mapping; never in URLs)
  name text not null,                          -- "Montana State University"
  short_name text not null,                    -- "Montana State"
  abbreviation text,                           -- "MTST"
  mascot text not null,                        -- "Bobcats" (nickname; part of the slug)
  city text, state text, country text default 'US',
  sanity_id text unique,                       -- Sanity school _id
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index schools_name_trgm on schools using gin (short_name gin_trgm_ops);
create trigger schools_updated before update on schools for each row execute function app.set_updated_at();

-- Team-hub slugs are immutable (no redirects, §17). Block updates; a real rebrand is a one-off migration
-- plus a manual legacy 301 row (§27).
create or replace function app.schools_slug_immutable() returns trigger language plpgsql as $$
begin
  if new.slug <> old.slug then raise exception 'schools.slug is immutable'; end if;
  return new;
end $$;
create trigger schools_slug_lock before update of slug on schools for each row execute function app.schools_slug_immutable();

-- One row per sport a school plays. The public sport section is /teams/{schools.slug}/{SPORTS[sport].teamPath}
-- (football | mens-basketball | womens-basketball); no slug of its own.
create table teams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  sport text not null references sports(code),
  unique (school_id, sport)
);
-- user_follows.target_id is polymorphic (no FK); a nightly job deletes follows whose target no longer exists.

create table conferences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                   -- "big-sky"
  name text not null,
  short_name text,
  sanity_id text unique
);

create table seasons (
  id text primary key,                         -- 'cfb-2026', 'mbb-2026'
  sport text not null references sports(code),
  year int not null,
  display_label text not null,                 -- '2026' or '2026-27'
  starts_on date, ends_on date,
  unique (sport, year)
);

create table weeks (
  id uuid primary key default gen_random_uuid(),
  season_id text not null references seasons(id),
  season_type text not null default 'regular' check (season_type in ('preseason','regular','postseason')),
  number int not null,                         -- 0..16 regular; postseason uses 1..n
  label text not null,                         -- 'Week 7', 'Preseason', 'Final'
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  unique (season_id, season_type, number)
);

create table team_seasons (
  team_id uuid not null references teams(id),
  season_id text not null references seasons(id),
  division text not null,
  conference_id uuid references conferences(id),
  is_transitional boolean not null default false,  -- reclassifying teams (e.g. postseason-ineligible)
  postseason_eligible boolean not null default true,
  head_coach text,
  primary key (team_id, season_id)
);
create index team_seasons_div on team_seasons (season_id, division);
create index team_seasons_conf on team_seasons (season_id, conference_id);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null, city text, state text, capacity int,
  timezone text                                -- IANA, e.g. 'America/Denver'
);
```

### 10.4 Games and scores — removed

There is no `games`, `game_events`, `team_game_stats`, `standings` or `ingestion_runs` table. Bracket games are `bracket_games` (§10.6). Hub "schedule / scores / standings / roster" tabs are outbound-link cards configured on the Sanity `school` / `conference` documents (§15).

### 10.5 Polls

```sql
create table polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                   -- 'cfb-fbs', 'cfb-fcs', 'mbb-d1', 'wbb-d1'
  sport text not null references sports(code),
  division text not null,
  name text not null,                          -- 'Redshirt Sports FCS Top 25'
  size int not null default 25 check (size between 5 and 50),
  allow_ineligible boolean not null default false,  -- may voters rank postseason-ineligible teams?
  is_active boolean not null default true,
  foreign key (sport, division) references divisions(sport, code)
);

create table poll_weeks (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id),
  season_id text not null references seasons(id),
  week_number int not null,                    -- 0 = preseason; final poll uses a high number with label
  label text not null,                         -- 'Preseason', 'Week 7', 'Final'
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  publish_at timestamptz,                      -- scheduled public release
  status text not null default 'draft'
    check (status in ('draft','open','closed','tabulated','published','voided')),
  tabulated_at timestamptz,
  published_at timestamptz,
  published_by text references users(id),
  notes text,
  unique (poll_id, season_id, week_number),
  check (closes_at > opens_at)
);
create index poll_weeks_status on poll_weeks (status, closes_at);

create table voter_invites (                   -- invite-only onboarding (§13.4); no public applications
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  poll_id uuid not null references polls(id),
  season_id text not null references seasons(id),
  public_name text, outlet text, note text,
  token_hash text not null,                    -- sha256 of the nonce in the signed token
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  allow_any_email boolean not null default false,
  invited_by text not null references users(id),
  sent_count int not null default 1,
  last_sent_at timestamptz not null default now(),
  accepted_by text references users(id), accepted_at timestamptz,
  revoked_by text references users(id), revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index voter_invites_one_pending on voter_invites (email, poll_id, season_id) where status = 'pending';
create index on voter_invites (poll_id, season_id, status);

create table voters (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id),
  poll_id uuid not null references polls(id),
  season_id text not null references seasons(id),  -- membership is per season; rosters renew each year
  invite_id uuid references voter_invites(id),
  slug text not null,                          -- public URL segment for ballot pages
  public_name text not null,                   -- shown on transparency pages
  outlet text,
  bio text,
  avatar_path text,                            -- Supabase Storage object path
  conflicts text[] not null default '{}',      -- disclosed school slugs / affiliations (shown publicly)
  sanity_person_id text,                       -- optional person profile (/people/{slug})
  code_of_conduct_version text not null,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  added_by text references users(id),          -- the admin who issued the invite
  joined_at timestamptz not null default now(),
  revoked_at timestamptz, revoked_by text references users(id), revoked_reason text,
  missed_weeks int not null default 0,
  unique (user_id, poll_id, season_id),
  unique (poll_id, season_id, slug)
);

create table ballots (
  id uuid primary key default gen_random_uuid(),
  poll_week_id uuid not null references poll_weeks(id),
  voter_id uuid not null references voters(id),
  status text not null default 'draft' check (status in ('draft','submitted','locked','voided')),
  submitted_at timestamptz,
  locked_at timestamptz,
  voided_reason text,
  revision int not null default 1,
  client_fingerprint text,                     -- hashed UA + IP prefix, anti-abuse only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (poll_week_id, voter_id)
);
create trigger ballots_updated before update on ballots for each row execute function app.set_updated_at();

create table ballot_entries (
  ballot_id uuid not null references ballots(id) on delete cascade,
  rank int not null,
  team_id uuid not null references teams(id),
  comment text check (char_length(comment) <= 280),
  primary key (ballot_id, rank),
  unique (ballot_id, team_id)
);
create index ballot_entries_team on ballot_entries (team_id);

create table ballot_revisions (                -- immutable history of every save
  id bigint generated always as identity primary key,
  ballot_id uuid not null references ballots(id) on delete cascade,
  revision int not null,
  entries jsonb not null,                      -- [{rank, team_id}]
  saved_at timestamptz not null default now(),
  saved_by text not null
);

create table poll_results (
  poll_week_id uuid not null references poll_weeks(id) on delete cascade,
  team_id uuid not null references teams(id),
  rank int,                                    -- null for 'others receiving votes'
  points int not null,
  first_place_votes int not null default 0,
  ballots_listed int not null,                 -- how many ballots included the team
  highest_rank int not null,
  lowest_rank int not null,
  previous_rank int,                           -- null = unranked last week
  movement int,                                -- previous_rank - rank (positive = up)
  is_new boolean not null default false,
  record_wins int, record_losses int, record_ties int,   -- snapshot at publish
  primary key (poll_week_id, team_id)
);
create index poll_results_rank on poll_results (poll_week_id, rank);

create table poll_week_summaries (
  poll_week_id uuid primary key references poll_weeks(id) on delete cascade,
  ballots_counted int not null,
  ballots_voided int not null default 0,
  dropped_out uuid[] not null default '{}',    -- teams ranked last week, unranked now
  consensus_index numeric(5,4),                -- e.g. mean Spearman correlation vs final
  computed_hash text not null                  -- sha256 of inputs for reproducibility
);

create table poll_audit_log (
  id bigint generated always as identity primary key,
  poll_week_id uuid references poll_weeks(id),
  ballot_id uuid references ballots(id),
  actor_id text,
  voter_id uuid references voters(id),
  invite_id uuid references voter_invites(id),
  action text not null,                        -- 'ballot.submit','ballot.void','week.open','week.publish','invite.create','invite.accept','invite.revoke','voter.revoke',...
  detail jsonb,
  ip_hash text,
  at timestamptz not null default now()
);
create index poll_audit_week on poll_audit_log (poll_week_id, at);
```

### 10.6 Brackets

```sql
create table bracket_formats (
  code text primary key,                       -- 'fcs24','cfp12','d2_28','d3_32','ncaab68'
  name text not null,
  sport text not null references sports(code),
  team_count int not null,
  game_count int not null,
  rounds int not null,
  definition jsonb not null,                   -- slots + feeds, generated from @rs/brackets registry
  version int not null default 1
);

create table bracket_events (
  id uuid primary key default gen_random_uuid(),
  -- Public URL: /{sport-path}/bracket-challenge/{division}/{year}
  -- Exactly one event per sport + division + season (enforced below).
  sport text not null references sports(code), -- 'cfb'
  division text not null,                      -- 'fbs' (CFP format), 'fcs', 'd2', 'd3'
  season_id text not null references seasons(id),
  year int not null,                           -- denormalized for URLs; must match seasons.year
  format_code text not null references bracket_formats(code),
  name text not null,                          -- '2026 FCS Bracket Challenge'
  status text not null default 'draft'
    check (status in ('draft','field_set','open','locked','in_progress','complete','archived')),
  opens_at timestamptz,
  lock_at timestamptz not null,                -- first game kickoff; staff-set
  lock_mode text not null default 'full' check (lock_mode = 'full'),  -- per_round dropped in 1.2
  scoring_system text not null default 'standard',
  scoring_config jsonb not null,
  tiebreaker text not null default 'title_total' check (tiebreaker in ('title_total','title_margin','none')),
  sponsor jsonb,
  max_entries_per_user int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport, division, season_id),
  foreign key (sport, division) references divisions(sport, code)
);

create table bracket_slots (                   -- concrete field: who is in which seed/slot for this event
  event_id uuid not null references bracket_events(id) on delete cascade,
  slot_code text not null,                     -- 'R1G1H', 'SEED1', 'FF1A' ... defined by format
  team_id uuid references teams(id),           -- null until set
  seed int,
  region text,
  primary key (event_id, slot_code)
);

create table bracket_games (                   -- one row per format game per event; results are staff-entered
  event_id uuid not null references bracket_events(id) on delete cascade,
  game_code text not null,                     -- 'R1G1'...'F'
  round int not null,
  label text,                                  -- bowl name, "First Round", etc.
  starts_at timestamptz,                       -- informational (for countdown); does not auto-score
  winner_team_id uuid references teams(id),
  loser_team_id uuid references teams(id),
  home_score int, away_score int,              -- optional display; scoring uses winner only
  status text not null default 'pending' check (status in ('pending','final')),
  result_set_by text references users(id),
  result_set_at timestamptz,
  primary key (event_id, game_code)
);

create table bracket_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references bracket_events(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 60),
  slug text,                                   -- for public groups
  manager_id text not null references users(id),
  visibility text not null default 'private' check (visibility in ('private','public','system')),
  invite_code text not null unique,            -- 8+ chars, base32 without ambiguous chars
  password_hash text,                          -- optional extra gate for public groups
  max_members int not null default 500,
  allow_multiple_entries boolean not null default false,
  is_sponsored boolean not null default false,
  created_at timestamptz not null default now()
);
create index bracket_groups_event on bracket_groups (event_id);

create table bracket_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references bracket_events(id) on delete cascade,
  user_id text not null references users(id),
  name text not null check (char_length(name) between 1 and 40),
  tiebreaker_value int check (tiebreaker_value between 0 and 200),
  status text not null default 'incomplete' check (status in ('incomplete','complete','locked','disqualified')),
  submitted_at timestamptz,
  score int not null default 0,
  max_possible int not null default 0,
  correct_picks int not null default 0,
  round_points int[] not null default '{}',
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bracket_entries_event_score on bracket_entries (event_id, score desc);
create index bracket_entries_user on bracket_entries (user_id, event_id);

create table bracket_picks (
  entry_id uuid not null references bracket_entries(id) on delete cascade,
  game_code text not null,
  picked_team_id uuid not null references teams(id),
  primary key (entry_id, game_code)
);

create table bracket_group_members (
  group_id uuid not null references bracket_groups(id) on delete cascade,
  entry_id uuid not null references bracket_entries(id) on delete cascade,
  user_id text not null references users(id),
  joined_at timestamptz not null default now(),
  primary key (group_id, entry_id)
);
create unique index bgm_one_entry_per_user on bracket_group_members (group_id, user_id);  -- drop if allow_multiple_entries
create index bgm_user on bracket_group_members (user_id);

create table bracket_audit_log (
  id bigint generated always as identity primary key,
  event_id uuid references bracket_events(id),
  entry_id uuid,
  actor_id text,
  action text not null,
  detail jsonb,
  at timestamptz not null default now()
);
```

### 10.7 Recruiting and portal — removed

No `players`, `roster_spots`, `recruit_*` or `portal_entries` tables. Cover those topics with articles tagged to schools.

### 10.7a Redirects and admin-entered team records

```sql
-- Legacy redirects ONLY: one-time 301s from old Redshirt URLs (§27). Read by the root catch-all fallback.
-- The app never redirects its own URLs (slugs are immutable after publish).
create table redirects (
  source_path text primary key,                -- old Redshirt path, e.g. '/my-old-article-slug'
  destination_path text not null,              -- '/college-football/news/my-old-article-slug'
  status_code int not null default 308 check (status_code in (301, 308)),  -- Next.js permanentRedirect/permanent:true emit 308; both are permanent
  reason text not null default 'legacy' check (reason in ('legacy','manual_legacy')),
  hits bigint not null default 0,
  last_hit_at timestamptz,
  created_at timestamptz not null default now(),
  check (source_path <> destination_path)
);
create index on redirects (destination_path);   -- collapse chains on insert (A→B, B→C ⇒ A→C)

-- Optional W-L record shown on poll pages. Admin-entered per poll week; no data feed.
create table poll_week_team_records (
  poll_week_id uuid not null references poll_weeks(id) on delete cascade,
  team_id uuid not null references teams(id),
  wins int not null check (wins >= 0),
  losses int not null check (losses >= 0),
  ties int not null default 0 check (ties >= 0),
  entered_by text references users(id),
  entered_at timestamptz not null default now(),
  primary key (poll_week_id, team_id)
);
```

Drizzle: `redirects` and `pollWeekTeamRecords` live in `schema/content.ts` and `schema/polls.ts`. RLS: enabled, no client policies (server reads only).

```ts
// packages/db/src/queries/redirects.ts
import { eq, sql } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";
import { adminDb } from "../client";
import { redirects } from "../schema";

export async function lookupRedirect(path: string): Promise<string | null> {
  "use cache";
  cacheTag("redirects");
  cacheLife("hours");
  const [r] = await adminDb.select({ to: redirects.destinationPath }).from(redirects).where(eq(redirects.sourcePath, path)).limit(1);
  return r?.to ?? null;
}

/** Insert and collapse chains so every source points at the final destination. */
export async function upsertRedirect(source: string, destination: string, reason: "legacy" | "manual_legacy") {
  await adminDb.transaction(async (tx) => {
    await tx.update(redirects).set({ destinationPath: destination }).where(eq(redirects.destinationPath, source));
    await tx.insert(redirects).values({ sourcePath: source, destinationPath: destination, reason })
      .onConflictDoUpdate({ target: redirects.sourcePath, set: { destinationPath: destination, reason } });
    await tx.delete(redirects).where(sql`${redirects.sourcePath} = ${redirects.destinationPath}`);
  });
}
```

(Hit counters are incremented asynchronously with `after()` so cached lookups stay cached.)

### 10.8 Engagement, billing, newsletters

```sql
create table newsletter_lists (
  id text primary key,                          -- 'daily', 'fcs-weekly', 'team:<team_id>'
  name text not null, description text,
  resend_segment_id text
);

create table newsletter_subscriptions (
  email citext not null,
  list_id text not null references newsletter_lists(id),
  user_id text references users(id),
  status text not null default 'pending' check (status in ('pending','active','unsubscribed','bounced','complained')),
  confirm_token_hash text,
  confirmed_at timestamptz,
  source text,                                  -- 'footer','article-inline','bracket-signup'
  created_at timestamptz not null default now(),
  primary key (email, list_id)
);

create table entitlements (
  user_id text not null references users(id),
  product text not null,                        -- 'all_access', 'ad_free'
  source text not null check (source in ('clerk_billing','stripe','comp')),
  status text not null check (status in ('active','trialing','past_due','canceled')),
  current_period_end timestamptz,
  external_id text,
  updated_at timestamptz not null default now(),
  primary key (user_id, product)
);

create table meter_events (                     -- paywall metering for signed-in users (anon is cookie-based)
  user_id text not null references users(id),
  content_id text not null,                     -- sanity _id
  period_start date not null,                   -- month bucket
  first_viewed_at timestamptz not null default now(),
  primary key (user_id, period_start, content_id)
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null, auth text not null,
  topics text[] not null default '{}',          -- 'team:<id>','poll:cfb-fcs','bracket:<event>'
  created_at timestamptz not null default now()
);
```

### 10.9 Entity-relationship diagram (core)

```mermaid
erDiagram
  users ||--o{ voters : "is"
  users ||--o{ voter_invites : "issues"
  voter_invites ||--o| voters : "accepted as"
  polls ||--o{ voter_invites : "for"
  users ||--o{ bracket_entries : "owns"
  users ||--o{ bracket_groups : "manages"
  schools ||--o{ teams : "fields"
  teams ||--o{ team_seasons : "has"
  seasons ||--o{ team_seasons : "in"
  conferences ||--o{ team_seasons : "member"
  polls ||--o{ poll_weeks : "runs"
  poll_weeks ||--o{ ballots : "collects"
  voters ||--o{ ballots : "submits"
  ballots ||--|{ ballot_entries : "ranks"
  poll_weeks ||--o{ poll_results : "produces"
  bracket_formats ||--o{ bracket_events : "templates"
  bracket_events ||--o{ bracket_games : "has"
  bracket_events ||--o{ bracket_entries : "has"
  bracket_entries ||--o{ bracket_picks : "contains"
  bracket_groups ||--o{ bracket_group_members : "has"
  bracket_entries ||--o{ bracket_group_members : "joins"
```

### 10.10 `packages/db` layout

```text
packages/db/
├── drizzle.config.ts
├── package.json                  # exports: ".", "./schema", "./queries", "./rls", "./realtime", "./storage", "./types"
├── src/
│   ├── schema/
│   │   ├── _helpers.ts           # timestamps(), citext, app.uid() sql, role imports
│   │   ├── users.ts              # users, user_roles, user_follows, saved_items, webhook_events
│   │   ├── sports.ts             # sports, divisions, schools, teams, conferences, seasons, weeks, team_seasons, venues (optional provider_ids for history import)
│   │   ├── polls.ts              # polls, poll_weeks, voters, voter_invites, ballots, ballot_entries, ballot_revisions, poll_results, summaries, audit
│   │   ├── content.ts            # redirects, optional content_index
│   │   ├── brackets.ts           # formats, events (unique sport+division+season), slots, games (manual results), groups, group_secrets, entries, picks, members, audit, standings MV (existing)
│   │   ├── engagement.ts         # newsletter_* (+ newsletter_events), entitlements, meter_events, push_subscriptions, notification_prefs, contact_submissions
│   │   ├── relations.ts
│   │   └── index.ts
│   ├── client.ts                 # adminDb, withRls(), pool config
│   ├── queries/                  # typed query functions, one file per domain
│   │   ├── users.ts  polls.ts  voters.ts  brackets.ts  newsletter.ts  index.ts
│   ├── realtime.ts               # optional: bracket leaderboard refresh broadcast
│   ├── storage.ts                # Supabase Storage helpers (signed upload/download URLs)
│   ├── cache-tags.ts
│   ├── errors.ts                 # domain errors: PollWeekClosedError, BracketLockedError, InviteInvalidError, ...
│   └── seed.ts                   # local seed (schools, conferences, seasons, poll + invites, FCS bracket event)
└── test/                         # integration tests against the local Supabase Postgres
```

Migrations are written to the root `supabase/migrations/` folder using drizzle-kit's **Supabase-compatible file prefix**, so the Supabase CLI (`supabase db reset`, `supabase test db`, preview branches) sees exactly the same SQL files Drizzle generated.

### 10.11 `drizzle.config.ts`

```ts
// packages/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "../../supabase/migrations",
  casing: "snake_case",                       // TS camelCase → SQL snake_case
  dbCredentials: { url: process.env.DATABASE_URL_DIRECT! }, // session pooler (5432) or direct; never the transaction pooler
  schemaFilter: ["public"],
  entities: { roles: { provider: "supabase" } }, // don't try to create/drop Supabase's built-in roles (anon, authenticated, service_role)
  migrations: { prefix: "supabase", table: "__drizzle_migrations", schema: "drizzle" },
  strict: true,
  verbose: true,
});
```

Migration workflow:

| Step | Command | Notes |
|---|---|---|
| Change the schema | edit `packages/db/src/schema/*.ts` | |
| Generate SQL | `pnpm db:generate` (`drizzle-kit generate --name=<change>`) | Review the SQL diff in the PR like code |
| Functions, triggers, MVs, cron | `pnpm db:custom --name=poll_functions` (`drizzle-kit generate --custom`) then write SQL in the empty file | Same journal, same order |
| Apply locally | `supabase start` then `pnpm db:migrate` (`drizzle-kit migrate`) and `pnpm db:seed`; or `supabase db reset` for a clean rebuild | Local stack Postgres on port 54322 |
| Test | `supabase test db` (pgTAP) + `pnpm --filter @rs/db test` | CI runs both |
| Apply to staging/production | GitHub Action runs `drizzle-kit migrate` with `DATABASE_URL_DIRECT` behind a manual approval | **One applier for remote databases: drizzle-kit.** Don't also run `supabase db push` against the same database, the two tools keep separate history tables |
| Never | `drizzle-kit push` against shared or production databases | `push` is fine for throwaway local experiments only |

Expand/contract still applies (§7.3): a column rename is two migrations across two deploys, never a generated drop-and-add.

### 10.12 Drizzle schema (key tables)

```ts
// packages/db/src/schema/_helpers.ts
import { sql } from "drizzle-orm";
import { customType, timestamp } from "drizzle-orm/pg-core";

export const citext = customType<{ data: string }>({ dataType: () => "citext" });
export const uid = sql`(select app.uid())`;                    // Clerk sub from request.jwt.claims
export const hasRole = (r: string) => sql`app.has_role(${r})`;
export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};
```

```ts
// packages/db/src/schema/users.ts
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, primaryKey, uniqueIndex, pgPolicy, check } from "drizzle-orm/pg-core";
import { authenticatedRole } from "drizzle-orm/supabase";
import { citext, timestamps, uid } from "./_helpers";

export const users = pgTable("users", {
  id: text().primaryKey(),                                   // Clerk user id
  email: citext(),
  firstName: text(),
  lastName: text(),
  displayName: text().generatedAlwaysAs(sql`coalesce(first_name,'') || case when coalesce(last_name,'') <> '' then ' ' || left(last_name,1) || '.' else '' end`),
  imageUrl: text(),
  sanityPersonId: text(),                                    // link to Sanity person doc (§12.8)
  clerkUpdatedAt: timestamp({ withTimezone: true }),
  deletedAt: timestamp({ withTimezone: true }),
  ...timestamps,
}, (t) => [
  uniqueIndex("users_email_uq").on(t.email).where(sql`${t.deletedAt} is null`),
  pgPolicy("own row", { for: "select", to: authenticatedRole, using: sql`${t.id} = ${uid}` }),
]);

export const USER_ROLES = ["admin", "editor", "contributor", "poll_admin", "bracket_admin", "data_admin", "moderator", "voter"] as const;

export const userRoles = pgTable("user_roles", {
  userId: text().notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text({ enum: USER_ROLES }).notNull(),
  grantedBy: text(),
  grantedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.role] }),
  check("user_roles_role_chk", sql`${t.role} in (${sql.raw(USER_ROLES.map((r) => `'${r}'`).join(","))})`),
]).enableRLS();                                              // no policies: server-only
```

```ts
// packages/db/src/schema/polls.ts (excerpt)
import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, timestamp, boolean, jsonb, primaryKey, unique, uniqueIndex, index, check, pgPolicy, bigint } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { citext, timestamps, uid } from "./_helpers";
import { users } from "./users";
import { seasons, teams } from "./sports";

export const polls = pgTable("polls", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),                           // 'cfb-fcs'
  sport: text().notNull(),
  division: text().notNull(),
  name: text().notNull(),
  size: integer().notNull().default(25),
  allowIneligible: boolean().notNull().default(false),
  isActive: boolean().notNull().default(true),
}, () => [pgPolicy("public read", { for: "select", to: [anonRole, authenticatedRole], using: sql`true` })]);

export const POLL_WEEK_STATUS = ["draft", "open", "closed", "tabulated", "published", "voided"] as const;

export const pollWeeks = pgTable("poll_weeks", {
  id: uuid().primaryKey().defaultRandom(),
  pollId: uuid().notNull().references(() => polls.id),
  seasonId: text().notNull().references(() => seasons.id),
  weekNumber: integer().notNull(),
  label: text().notNull(),
  opensAt: timestamp({ withTimezone: true }).notNull(),
  closesAt: timestamp({ withTimezone: true }).notNull(),
  publishAt: timestamp({ withTimezone: true }),
  status: text({ enum: POLL_WEEK_STATUS }).notNull().default("draft"),
  tabulatedAt: timestamp({ withTimezone: true }),
  publishedAt: timestamp({ withTimezone: true }),
  publishedBy: text().references(() => users.id),
  notes: text(),
}, (t) => [
  unique().on(t.pollId, t.seasonId, t.weekNumber),
  index().on(t.status, t.closesAt),
  check("poll_weeks_window_chk", sql`${t.closesAt} > ${t.opensAt}`),
  pgPolicy("published weeks", { for: "select", to: [anonRole, authenticatedRole], using: sql`${t.status} = 'published'` }),
  pgPolicy("voter sees own polls' weeks", {
    for: "select", to: authenticatedRole,
    using: sql`exists (select 1 from voters v where v.poll_id = ${t.pollId} and v.season_id = ${t.seasonId} and v.user_id = ${uid} and v.status = 'active')`,
  }),
]);

export const voterInvites = pgTable("voter_invites", {
  id: uuid().primaryKey().defaultRandom(),
  email: citext().notNull(),
  pollId: uuid().notNull().references(() => polls.id),
  seasonId: text().notNull().references(() => seasons.id),
  publicName: text(),                                        // prefill for the acceptance form
  outlet: text(),
  note: text(),                                              // internal note from the admin
  tokenHash: text().notNull(),                               // sha256 of the nonce inside the signed token
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  status: text({ enum: ["pending", "accepted", "revoked", "expired"] }).notNull().default("pending"),
  allowAnyEmail: boolean().notNull().default(false),         // admin override when the voter signs in with another address
  invitedBy: text().notNull().references(() => users.id),
  sentCount: integer().notNull().default(1),
  lastSentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  acceptedBy: text().references(() => users.id),
  acceptedAt: timestamp({ withTimezone: true }),
  revokedBy: text().references(() => users.id),
  revokedAt: timestamp({ withTimezone: true }),
  ...timestamps,
}, (t) => [
  uniqueIndex("voter_invites_one_pending").on(t.email, t.pollId, t.seasonId).where(sql`${t.status} = 'pending'`),
  index().on(t.pollId, t.seasonId, t.status),
]).enableRLS();                                              // no policies: admin/server only

export const voters = pgTable("voters", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text().notNull().references(() => users.id),
  pollId: uuid().notNull().references(() => polls.id),
  seasonId: text().notNull().references(() => seasons.id),
  inviteId: uuid().references(() => voterInvites.id),
  slug: text().notNull(),                                    // public URL segment for ballots
  publicName: text().notNull(),
  outlet: text(),
  bio: text(),
  avatarPath: text(),                                        // Supabase Storage path
  conflicts: text().array().notNull().default(sql`'{}'::text[]`),
  sanityPersonId: text(),                                    // optional person doc → /people/{slug}
  codeOfConductVersion: text().notNull(),
  status: text({ enum: ["active", "suspended", "revoked"] }).notNull().default("active"),
  addedBy: text().references(() => users.id),
  joinedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp({ withTimezone: true }),
  revokedBy: text().references(() => users.id),
  revokedReason: text(),
  missedWeeks: integer().notNull().default(0),
}, (t) => [
  unique().on(t.userId, t.pollId, t.seasonId),
  unique().on(t.pollId, t.seasonId, t.slug),
  pgPolicy("public voter roster", { for: "select", to: [anonRole, authenticatedRole], using: sql`${t.status} = 'active'` }),
]);

export const ballots = pgTable("ballots", {
  id: uuid().primaryKey().defaultRandom(),
  pollWeekId: uuid().notNull().references(() => pollWeeks.id),
  voterId: uuid().notNull().references(() => voters.id),
  status: text({ enum: ["draft", "submitted", "locked", "voided"] }).notNull().default("draft"),
  submittedAt: timestamp({ withTimezone: true }),
  lockedAt: timestamp({ withTimezone: true }),
  voidedReason: text(),
  revision: integer().notNull().default(1),
  clientFingerprint: text(),
  ...timestamps,
}, (t) => [
  unique().on(t.pollWeekId, t.voterId),
  pgPolicy("own ballots", { for: "select", to: authenticatedRole,
    using: sql`exists (select 1 from voters v where v.id = ${t.voterId} and v.user_id = ${uid})` }),
  pgPolicy("published ballots", { for: "select", to: [anonRole, authenticatedRole],
    using: sql`${t.status} = 'locked' and exists (select 1 from poll_weeks w where w.id = ${t.pollWeekId} and w.status = 'published')` }),
]);

export const ballotEntries = pgTable("ballot_entries", {
  ballotId: uuid().notNull().references(() => ballots.id, { onDelete: "cascade" }),
  rank: integer().notNull(),
  teamId: uuid().notNull().references(() => teams.id),
  comment: text(),
}, (t) => [
  primaryKey({ columns: [t.ballotId, t.rank] }),
  unique().on(t.ballotId, t.teamId),
  index().on(t.teamId),
  check("ballot_entries_comment_len", sql`char_length(${t.comment}) <= 280`),
  pgPolicy("entries follow ballot", { for: "select", to: [anonRole, authenticatedRole],
    using: sql`exists (select 1 from ballots b where b.id = ${t.ballotId})` }),
]);

export const ballotRevisions = pgTable("ballot_revisions", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  ballotId: uuid().notNull().references(() => ballots.id, { onDelete: "cascade" }),
  revision: integer().notNull(),
  entries: jsonb().$type<{ rank: number; teamId: string }[]>().notNull(),
  savedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  savedBy: text().notNull(),
}).enableRLS();

export const pollAuditLog = pgTable("poll_audit_log", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  pollWeekId: uuid().references(() => pollWeeks.id),
  ballotId: uuid().references(() => ballots.id),
  voterId: uuid().references(() => voters.id),
  inviteId: uuid().references(() => voterInvites.id),
  actorId: text(),
  action: text().notNull(),
  detail: jsonb(),
  ipHash: text(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => [index().on(t.pollWeekId, t.at)]).enableRLS();

// pollResults, pollWeekSummaries follow the same pattern as the DDL in §10.5
```

```ts
// packages/db/src/schema/brackets.ts (excerpt)
import { sql } from "drizzle-orm";
import { pgTable, uuid, text, integer, jsonb, timestamp, primaryKey, unique, index, pgPolicy } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { users } from "./users";
import { sports, seasons, teams } from "./sports";
import { bracketFormats } from "./bracket-formats";
export const bracketEvents = pgTable("bracket_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  sport: text("sport").notNull().references(() => sports.code),
  division: text("division").notNull(),                    // 'fbs' | 'fcs' | 'd2' | 'd3'
  seasonId: text("season_id").notNull().references(() => seasons.id),
  year: integer("year").notNull(),
  formatCode: text("format_code").notNull().references(() => bracketFormats.code),
  name: text("name").notNull(),
  status: text("status", { enum: ["draft", "field_set", "open", "locked", "in_progress", "complete", "archived"] }).notNull().default("draft"),
  opensAt: timestamp("opens_at", { withTimezone: true }),
  lockAt: timestamp("lock_at", { withTimezone: true }).notNull(),
  scoringSystem: text("scoring_system").notNull().default("standard"),
  scoringConfig: jsonb("scoring_config").notNull(),
  tiebreaker: text("tiebreaker", { enum: ["title_total", "title_margin", "none"] }).notNull().default("title_total"),
  sponsor: jsonb("sponsor"),
  maxEntriesPerUser: integer("max_entries_per_user").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("bracket_events_one_per_division_season").on(t.sport, t.division, t.seasonId),
  index().on(t.sport, t.division, t.year),
  pgPolicy("public non-draft events", { for: "select", to: [anonRole, authenticatedRole], using: sql`${t.status} <> 'draft'` }),
]).enableRLS();

export const bracketGames = pgTable("bracket_games", {
  eventId: uuid("event_id").notNull().references(() => bracketEvents.id, { onDelete: "cascade" }),
  gameCode: text("game_code").notNull(),
  round: integer("round").notNull(),
  label: text("label"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  winnerTeamId: uuid("winner_team_id").references(() => teams.id),
  loserTeamId: uuid("loser_team_id").references(() => teams.id),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status", { enum: ["pending", "final"] }).notNull().default("pending"),
  resultSetBy: text("result_set_by").references(() => users.id),
  resultSetAt: timestamp("result_set_at", { withTimezone: true }),
}, (t) => [
  primaryKey({ columns: [t.eventId, t.gameCode] }),
  pgPolicy("public bracket games", { for: "select", to: [anonRole, authenticatedRole],
    using: sql`exists (select 1 from bracket_events e where e.id = ${t.eventId} and e.status <> 'draft')` }),
]).enableRLS();

/** Division → default format (used by the admin "create event" form). */
export const DIVISION_FORMAT = { fbs: "cfp12", fcs: "fcs24", d2: "d2_28", d3: "d3_32" } as const;

/** Resolve THE event for a public URL. */
// db.select().from(bracketEvents).where(and(eq(bracketEvents.sport, "cfb"), eq(bracketEvents.division, division), eq(bracketEvents.year, year))).limit(1)

export const bracketEntries = pgTable("bracket_entries", {
  id: uuid().primaryKey().defaultRandom(),
  eventId: uuid().notNull().references(() => bracketEvents.id, { onDelete: "cascade" }),
  userId: text().notNull().references(() => users.id),
  name: text().notNull(),
  tiebreakerValue: integer(),
  status: text({ enum: ["incomplete", "complete", "locked", "disqualified"] }).notNull().default("incomplete"),
  submittedAt: timestamp({ withTimezone: true }),
  score: integer().notNull().default(0),
  maxPossible: integer().notNull().default(0),
  correctPicks: integer().notNull().default(0),
  roundPoints: integer().array().notNull().default(sql`'{}'::int[]`),
  scoredAt: timestamp({ withTimezone: true }),
  ...timestamps,
}, (t) => [
  index().on(t.eventId, t.score.desc()),
  index().on(t.userId, t.eventId),
  pgPolicy("own entries", { for: "select", to: authenticatedRole, using: sql`${t.userId} = ${uid}` }),
  pgPolicy("entries visible after lock", { for: "select", to: [anonRole, authenticatedRole], using: sql`
    exists (select 1 from bracket_events e where e.id = ${t.eventId} and now() >= e.lock_at)
    and exists (select 1 from bracket_group_members m join bracket_groups g on g.id = m.group_id
                where m.entry_id = ${t.id}
                  and (g.visibility in ('public','system')
                       or exists (select 1 from bracket_group_members me where me.group_id = g.id and me.user_id = ${uid})))` }),
]);

// Materialized view is created in a custom migration (§14.8); declare its columns so reads are typed.
export const bracketGroupStandings = pgMaterializedView("bracket_group_standings", {
  groupId: uuid().notNull(),
  entryId: uuid().notNull(),
  userId: text().notNull(),
  name: text().notNull(),
  score: integer().notNull(),
  maxPossible: integer().notNull(),
  correctPicks: integer().notNull(),
  roundPoints: integer().array().notNull(),
  position: bigint({ mode: "number" }).notNull(),
  scoreRank: bigint({ mode: "number" }).notNull(),
  groupSize: bigint({ mode: "number" }).notNull(),
}).existing();
```

Relations (`relations.ts`) declare `users ↔ voters ↔ ballots ↔ ballotEntries`, `pollWeeks ↔ pollResults`, `bracketEvents ↔ entries ↔ picks`, so `db.query.*.findMany({ with: … })` returns nested typed objects. Inferred types (`typeof ballots.$inferSelect`, `$inferInsert`) replace `supabase gen types` for all server code; `drizzle-zod` (`createInsertSchema`) can derive zod validators for admin forms.

### 10.13 Client, RLS wrapper and connection pooling (Supavisor)

```ts
// packages/db/src/client.ts
import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const g = globalThis as unknown as { __pg?: postgres.Sql };

const pg =
  g.__pg ??
  postgres(process.env.DATABASE_URL!, {     // Supavisor TRANSACTION mode, port 6543, user rs_server.<project-ref>
    prepare: false,                          // required: transaction pooling cannot keep prepared statements
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 10,
  });
if (process.env.NODE_ENV !== "production") g.__pg = pg;   // survive HMR in dev

/** Trusted connection. Bypasses RLS. Authorize the caller in code BEFORE using it. */
export const adminDb = drizzle(pg, { schema, casing: "snake_case" });
export type Db = typeof adminDb;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Run `fn` with Supabase RLS enforced for the given verified Clerk claims.
 * Everything is transaction-local (set local / set_config(..., true)), which is what makes it
 * safe on a transaction-mode pooler: nothing leaks to the next client that gets this connection.
 */
export async function withRls<T>(claims: { sub: string; roles?: string[] } | null, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const role = claims ? "authenticated" : "anon";
  const jwt = JSON.stringify(claims ? { ...claims, role } : { role });
  return adminDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${jwt}, true)`);
    await tx.execute(sql.raw(`set local role ${role}`));    // role is one of two literals, never user input
    return fn(tx);
  });
}
```

**Database roles**

| Role | Login? | Privileges | Used by |
|---|---|---|---|
| `postgres` (Supabase owner) | Yes | DDL, owns tables | `drizzle-kit migrate` only (CI with approval) |
| `rs_server` (create in a custom migration) | Yes | `select/insert/update/delete` on app tables, `usage` on sequences, `execute` on `app.*` functions, **`BYPASSRLS`**, member of `anon` and `authenticated` so it can `set local role` | `adminDb` / `withRls` in web, admin, workers |
| `authenticated`, `anon` | No (assumed) | Grants per table + RLS policies | `withRls`, supabase-js |
| `service_role` | Via secret key | Bypasses RLS through the Data API | supabase-js server helpers for Storage/Realtime only |

```sql
-- custom migration: 0003_rs_server_role.sql (password set out-of-band, stored in Vercel env)
create role rs_server login bypassrls;
grant anon, authenticated to rs_server;
grant usage on schema public, app to rs_server;
grant select, insert, update, delete on all tables in schema public to rs_server;
grant usage, select on all sequences in schema public to rs_server;
grant execute on all functions in schema app to rs_server;
alter default privileges in schema public grant select, insert, update, delete on tables to rs_server;
alter default privileges in schema public grant usage, select on sequences to rs_server;
```

Using a dedicated runtime role instead of `postgres` means a leaked app connection string cannot drop tables or change schema.

**Connection strings and pooling**

| Variable | Supavisor mode | Port | Use | Why |
|---|---|---|---|---|
| `DATABASE_URL` | Transaction | 6543 | Vercel functions (web, admin), short jobs | Many short-lived serverless connections share a small number of Postgres connections; requires `prepare: false`; no session state (hence `set local`) |
| `DATABASE_URL_SESSION` | Session | 5432 | drizzle-kit migrate in CI, seeding, local scripts; advisory locks held across statements | Keeps one backend per client; supports session features |
| `DATABASE_URL_DIRECT` | Session pooler or direct | 5432 | `drizzle-kit migrate`, `pg_dump` | DDL and long transactions. The direct host may be IPv6-only unless the IPv4 add-on is enabled; the session pooler works over IPv4 from CI |

Sizing rules: `DB_POOL_MAX` × (max concurrent function instances) must stay well under the pooler's client limit for your compute size; keep `max` at 1–5 per instance. With Vercel Fluid compute, instances are reused across requests, so a module-level pool is correct; if your `@vercel/functions` version provides `attachDatabasePool`, attach the pool so idle connections are released before an instance is suspended. Keep transactions short (no network calls to Clerk or Resend inside a DB transaction; do them after commit).

### 10.14 Typed queries (examples)

```ts
// packages/db/src/queries/polls.ts
import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { adminDb } from "../client";
import { polls, pollWeeks, pollResults, pollWeekSummaries, teams, schools } from "../schema";

export async function getPollWeek(input: { pollSlug: string; year: number; weekNumber: number }) {
  const [week] = await adminDb
    .select({ id: pollWeeks.id, label: pollWeeks.label, publishedAt: pollWeeks.publishedAt, size: polls.size, pollName: polls.name })
    .from(pollWeeks)
    .innerJoin(polls, eq(polls.id, pollWeeks.pollId))
    .where(and(eq(polls.slug, input.pollSlug), eq(pollWeeks.seasonId, sql`${polls.sport} || '-' || ${input.year}`),
               eq(pollWeeks.weekNumber, input.weekNumber), eq(pollWeeks.status, "published")))
    .limit(1);
  if (!week) return null;

  const rows = await adminDb
    .select({
      rank: pollResults.rank, points: pollResults.points, fpv: pollResults.firstPlaceVotes,
      previousRank: pollResults.previousRank, movement: pollResults.movement, isNew: pollResults.isNew,
      wins: pollResults.recordWins, losses: pollResults.recordLosses,
      school: { slug: schools.slug, shortName: schools.shortName, sanityId: schools.sanityId },
    })
    .from(pollResults)
    .innerJoin(teams, eq(teams.id, pollResults.teamId))
    .innerJoin(schools, eq(schools.id, teams.schoolId))
    .where(eq(pollResults.pollWeekId, week.id))
    .orderBy(sql`${pollResults.rank} asc nulls last`, desc(pollResults.points), asc(schools.shortName));

  const [summary] = await adminDb.select().from(pollWeekSummaries).where(eq(pollWeekSummaries.pollWeekId, week.id));
  return {
    week, summary,
    ranked: rows.filter((r) => r.rank !== null),
    othersReceivingVotes: rows.filter((r) => r.rank === null),
  };
}
```

```ts
// packages/db/src/queries/brackets.ts – private group page read through RLS
import { asc, eq } from "drizzle-orm";
import { withRls } from "../client";
import { bracketGroupStandings, bracketGroups } from "../schema";

export function getGroupStandings(claims: { sub: string } | null, groupId: string) {
  return withRls(claims, async (tx) => {
    const [group] = await tx.select().from(bracketGroups).where(eq(bracketGroups.id, groupId)); // RLS hides private groups you aren't in
    if (!group) return null;
    // Materialized views have no RLS; membership was proven by the RLS-filtered group read above.
    const standings = await tx.select().from(bracketGroupStandings)
      .where(eq(bracketGroupStandings.groupId, groupId)).orderBy(asc(bracketGroupStandings.position)).limit(500);
    return { group, standings };
  });
}
```

Calling SQL from Drizzle (for the few things that stay in SQL, like the MV refresh):

```ts
await adminDb.execute(sql`refresh materialized view concurrently bracket_group_standings`);
```

### 10.15 Where supabase-js is still used

| Use | Where | How |
|---|---|---|
| **Realtime Broadcast** (optional: "results updated" ping for open bracket group pages, ballot counter in admin) | Browser subscribes; server publishes | Browser: `useSupabase().channel(...)`. Server: either supabase-js with the secret key (`channel.send` falls back to the REST broadcast endpoint when not subscribed) or SQL `realtime.send(payload, event, topic, private)` executed through Drizzle **inside the same transaction** that wrote the result, so the message only goes out if the write commits |
| **Realtime private channels** (voter-only, admin-only) | Browser | Private channels authorize with RLS policies on `realtime.messages`, evaluated against the Clerk JWT |
| **Storage** (voter avatars, contact-form attachments, ballot/results CSV exports, generated share images) | Server issues signed upload/download URLs; browser uploads directly | `supabase.storage.from("voter-avatars").createSignedUploadUrl(path)`; bucket policies use `app.uid()` for own-folder access |
| **Browser own-row reads** (optional) | Client components | Publishable key + Clerk token, RLS applies |
| **Not used for** | | Server queries and writes, migrations, generated types (Drizzle owns all of these) |

```ts
// packages/db/src/realtime.ts
import "server-only";
import { sql } from "drizzle-orm";
import type { Tx } from "./client";

/** Broadcast from inside a Drizzle transaction; delivered only if the transaction commits. */
export async function broadcastInTx(tx: Tx, topic: string, event: string, payload: Record<string, unknown>, isPrivate = false) {
  await tx.execute(sql`select realtime.send(${JSON.stringify(payload)}::jsonb, ${event}, ${topic}, ${isPrivate})`);
}
```

### 10.16 Testing the data layer

- **pgTAP** (`supabase test db`) still tests policies and SQL functions against the generated schema (§11.3).
- **Drizzle integration tests** (Vitest) run against the local Supabase Postgres after `drizzle-kit migrate`: each test opens a transaction and rolls back. They cover `withRls` visibility (user A can't read user B's entries before lock), lock enforcement in `submitBallot`/`saveBracketEntry`, invite acceptance edge cases, and query shapes.
- **Schema drift check** in CI: `drizzle-kit generate` must produce no new migration on `main` (fails the build if someone edited the schema without generating), and `drizzle-kit check` validates the migration journal.
---

## 11. Row Level Security policies

### 11.1 Posture

- RLS is **enabled on every table** in `public`. Tables with no policy are deny-all for `anon`/`authenticated` (only the service role and direct DB connections bypass RLS).
- **Public read** is granted only on reference data and published results.
- **Own-row** access uses `app.uid()` (the Clerk `sub`).
- **Staff** access uses `app.has_role()` from JWT claims. Admin tools generally use the service connection anyway; staff policies exist for the admin app's client-side tables (e.g. live ballot counter).
- Lock enforcement for ballots and picks lives in **server-side Drizzle transactions with row locks** (§13.7, §14.4), not in policies, because "is the window open" needs joins, row locks and clear error messages.
- **Declared in Drizzle.** Every policy below is written with `pgPolicy()` next to its table in `packages/db/src/schema` (§10.12), and drizzle-kit generates the SQL shown here. The SQL is the reviewable, testable form.
- Policies apply to `anon`/`authenticated`: the browser (supabase-js) and server code running inside `withRls()` (§10.13). `adminDb` uses the `rs_server` role with `BYPASSRLS` and must authorize in code.
- Always wrap `auth.jwt()` calls in a subselect `(select app.uid())` so Postgres evaluates them once per statement, not per row.

### 11.2 Policies

```sql
-- Enable RLS everywhere
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- Reference data: public read
create policy "public read" on sports          for select using (true);
create policy "public read" on divisions       for select using (true);
create policy "public read" on schools         for select using (true);
create policy "public read" on teams           for select using (true);
create policy "public read" on conferences     for select using (true);
create policy "public read" on seasons         for select using (true);
create policy "public read" on weeks           for select using (true);
create policy "public read" on team_seasons    for select using (true);
create policy "public read" on venues          for select using (true);
create policy "public read" on polls           for select using (true);
create policy "public read" on bracket_formats for select using (true);

-- Users: read own row; public display fields exposed via a view instead
create policy "own row" on users for select using (id = (select app.uid()));
create view public_profiles with (security_invoker = false) as
  select id, display_name, image_url from users where deleted_at is null;
-- (grant select on public_profiles to anon, authenticated)

-- Favorites: full control of own rows
create policy "own follows" on user_follows
  for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));
create policy "own saved" on saved_items
  for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));

-- Poll weeks: public sees published weeks; voters see open weeks of polls they vote in
create policy "published weeks" on poll_weeks for select using (status = 'published');
create policy "voter sees own polls' weeks" on poll_weeks for select using (
  exists (select 1 from voters v
          where v.poll_id = poll_weeks.poll_id and v.season_id = poll_weeks.season_id
            and v.user_id = (select app.uid()) and v.status = 'active')
);

-- Poll results: public only after publish
create policy "published results" on poll_results for select using (
  exists (select 1 from poll_weeks w where w.id = poll_results.poll_week_id and w.status = 'published')
);
create policy "published summaries" on poll_week_summaries for select using (
  exists (select 1 from poll_weeks w where w.id = poll_week_summaries.poll_week_id and w.status = 'published')
);

-- Voters: public roster of active voters (transparency); own row always
create policy "public voter roster" on voters for select using (status = 'active');

-- Voter invites: no policies at all (RLS enabled = deny). Only admin server code (adminDb) reads or writes them;
-- invite acceptance goes through a server action that verifies the signed token (§13.4).

-- Ballots: owner can read always; everyone can read after the week is published (transparency)
create policy "own ballots" on ballots for select using (
  exists (select 1 from voters v where v.id = ballots.voter_id and v.user_id = (select app.uid()))
);
create policy "published ballots" on ballots for select using (
  status = 'locked' and exists (select 1 from poll_weeks w where w.id = ballots.poll_week_id and w.status = 'published')
);
-- No insert/update policy: writes only via the server's submitBallot() Drizzle transaction (§13.7)

create policy "ballot entries follow ballot" on ballot_entries for select using (
  exists (select 1 from ballots b where b.id = ballot_entries.ballot_id)   -- ballots RLS applies inside
);

-- Brackets: public reference
create policy "public events" on bracket_events for select using (status <> 'draft');
create policy "public slots" on bracket_slots for select using (
  exists (select 1 from bracket_events e where e.id = bracket_slots.event_id and e.status <> 'draft'));
create policy "public bracket games" on bracket_games for select using (
  exists (select 1 from bracket_events e where e.id = bracket_games.event_id and e.status <> 'draft'));

-- Entries: owner always; others only after lock AND if they share a group or the entry is in a public/system group
create policy "own entries" on bracket_entries for select using (user_id = (select app.uid()));
create policy "entries visible after lock" on bracket_entries for select using (
  exists (select 1 from bracket_events e where e.id = bracket_entries.event_id and now() >= e.lock_at)
  and exists (
    select 1 from bracket_group_members m
    join bracket_groups g on g.id = m.group_id
    where m.entry_id = bracket_entries.id
      and (g.visibility in ('public','system')
           or exists (select 1 from bracket_group_members me
                      where me.group_id = g.id and me.user_id = (select app.uid())))
  )
);
create policy "picks follow entries" on bracket_picks for select using (
  exists (select 1 from bracket_entries be where be.id = bracket_picks.entry_id)  -- entry RLS applies
);
-- Writes only via server Drizzle transactions: saveBracketEntry(), joinGroup(), createGroup() (§14.4, §14.7)

-- Groups: members and public/system visible; private group discoverable only via invite RPC
create policy "group visibility" on bracket_groups for select using (
  visibility in ('public','system')
  or manager_id = (select app.uid())
  or exists (select 1 from bracket_group_members m where m.group_id = bracket_groups.id and m.user_id = (select app.uid()))
);
create policy "membership visibility" on bracket_group_members for select using (
  exists (select 1 from bracket_groups g where g.id = bracket_group_members.group_id)  -- group RLS applies
);

-- Newsletter, push, entitlements: own rows only
create policy "own subs" on newsletter_subscriptions for select using (user_id = (select app.uid()));
create policy "own push" on push_subscriptions for all using (user_id = (select app.uid())) with check (user_id = (select app.uid()));
create policy "own entitlements" on entitlements for select using (user_id = (select app.uid()));

-- Audit logs, webhook_events, redirects, poll_week_team_records, ballot_revisions, meter_events, voter_invites, user_roles, contact_submissions: no policies (server-only)
```

**Note on the `invite_code` column:** because public groups are readable, do not let the `invite_code` leak. Either move it to a separate `bracket_group_secrets` table with no select policy, or expose groups through a view that omits it. The blueprint uses the separate table in the final migration:

```sql
create table bracket_group_secrets (
  group_id uuid primary key references bracket_groups(id) on delete cascade,
  invite_code text not null unique
);
alter table bracket_group_secrets enable row level security;
create policy "manager reads code" on bracket_group_secrets for select using (
  exists (select 1 from bracket_groups g where g.id = group_id and g.manager_id = (select app.uid())));
```

### 11.3 Testing RLS

pgTAP tests in `supabase/tests/rls_*.test.sql` set the JWT and assert visibility:

```sql
begin;
select plan(3);
-- simulate Clerk user
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"user_A","role":"authenticated"}', true);

select is((select count(*)::int from bracket_entries where user_id = 'user_B'), 0,
  'cannot see other users entries before lock');
select is((select count(*)::int from ballots b join poll_weeks w on w.id=b.poll_week_id where w.status='open'), 0,
  'non-voter cannot see open ballots');
select throws_ok($$ insert into ballots (poll_week_id, voter_id) values (gen_random_uuid(), gen_random_uuid()) $$,
  '42501', null, 'direct ballot insert is denied');
select * from finish();
rollback;
```

---

## 12. Sanity content model, GROQ and Studio

### 12.1 Document types

| Type | Key fields | Notes |
|---|---|---|
| `post` (article) | title, slug (**globally unique** across posts via a custom `isUnique`; URL `/{primarySport}/news/{slug}`; read-only after first publish, together with `primarySport`, so no redirects), dek/excerpt, mainImage (1920×1080, alt required, caption, credit text and optional `creditPerson` → person), body (Portable Text), authors[] (byline → `person`, §12.7), primarySport, divisions[], conferences[] (ref), schools[] (ref), category (ref), tags[], publishedAt, updatedAt override, isPremium, isSponsored + sponsor (ref), canonicalUrl, seo{title, description, ogImage, noindex}, newsKeywords, articleType (`news`, `analysis`, `opinion`, `feature`, `recap`, `preview`, `rankings`, `explainer`) | `articleType` drives JSON-LD (`NewsArticle` vs `OpinionNewsArticle`/`AnalysisNewsArticle`) |
| `person` | name, slug, roles[] (writer, editor, photographer, podcastHost, videoHost, voter, staff, contributor, columnist, analyst), title, image, bio, beats[], socials, isStaff, profilePage{enabled, noindex}, clerkUserId, voterIds | Replaces a separate author type. Bylines, credits, hosts, masthead, voter profiles. Pages at `/people/{slug}` when enabled (§12.7) |
| `school` | schoolId (Postgres uuid, read-only), name, shortName, nickname, slug (read-only, mirrors `schools.slug` = `{school}-{nickname}`, e.g. `montana-state-bobcats`), logo (light/dark SVG), colors{primary, secondary}, conference (ref, current), city/state, social, website, editorialBio | Editorial only; division lives in Postgres |
| `conference` | conferenceId, name, slug, logo, sports[], description | |
| `category` | title, slug, description, parent (ref) | e.g. News, Recruiting, Transfer Portal, Rankings |
| `tag` | title, slug | lightweight topical tags |
| `podcastShow` | title, slug, artwork, rss feed URL, platforms links, hosts[] → person | |
| `podcastEpisode` | show (ref), hosts[]/guests[] → person, title, slug, audioUrl or embed, duration, publishedAt, transcript (PT), chapters[], relatedSchools[] | `PodcastEpisode` schema |
| `video` | title, slug, provider (`youtube`,`mux`), providerId, thumbnail, duration, transcript, relatedSchools[] | `VideoObject` schema |
| `gallery` | title, images[] | |
| `pollRelease` | pollSlug, seasonYear, weekNumber, intro (PT), notes per team (array of {teamSlug, blurb}) | Commentary layered on Postgres results |
| `bracketPromo` | eventSlug, headline, body, sponsor (ref), heroImage | Marketing module for bracket landing pages |
| `sponsor` | name, logo, url, disclosureText, campaign dates | |
| `page` | title, slug (nestable), pageType (standard/legal/landing), legal{effectiveDate, version}, sections[] (hero, richText, faq, contactForm, staffGrid, cta, embed, newsletterSignup, featuredContent, gallery, logoCloud, pricingTable, jobListings, table), seo | **Page builder** for About, Contact, Privacy, Terms, Ethics/Corrections, Advertise, Careers, masthead, methodology, bracket rules (§12.8) |
| `jobPosting` | title, location, remote, employmentType, description, validThrough, applyUrl | Careers listings, `JobPosting` JSON-LD |
| `homepage` (singleton) | lead story, featured slots, modules | |
| `siteSettings` (singleton) | nav, footer, breaking banner, default SEO, social | |
| `portalEntry` | playerName, sport, season, position, classYear, redshirt, eligibilityRemaining, heightInches?, weightLbs?, previousSchool (ref), division, status (entered/committed/withdrawn), newSchool (ref, required if committed), enteredOn/committedOn/withdrawnOn, story (ref post, **optional pending §30 #16**), moreStories[], note | One row of the Transfer Portal Tracker (§16.1). No slug, no photo, no player page |
| `curatedTracker` | kind (`recruiting`), sport, season, rows (name, position, from/to school refs, status, date, sourceArticle ref, note), showTracker | Optional commits list on the recruiting hub |
| `storyline` | title, slug, dek, topic, schools, posts[] | Editor-picked threads on portal/recruiting hubs |

### 12.2 Portable Text custom blocks

`image`, `twitterEmbed`/`xEmbed`, `youtube`, `instagram`, `pullQuote`, `callout`, `tableBlock`, `pollEmbed` (poll slug + week, renders the published table), `bracketEmbed` (event slug or inline mini-bracket), `teamCard` (school ref), `newsletterSignup` (list id), `adSlot` (manual placement hint), `relatedPosts`.

### 12.3 Example schema (post)

```ts
// packages/sanity/src/schemas/documents/post.ts
import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons";

export const post = defineType({
  name: "post",
  title: "Article",
  type: "document",
  icon: DocumentTextIcon,
  groups: [{ name: "content", default: true }, { name: "taxonomy" }, { name: "seo" }, { name: "monetization" }],
  fields: [
    defineField({ name: "title", type: "string", group: "content", validation: (r) => r.required().max(110) }),
    defineField({ name: "slug", type: "slug", group: "content", options: { source: "title", maxLength: 96 }, validation: (r) => r.required() }),
    defineField({ name: "excerpt", type: "text", rows: 3, group: "content", validation: (r) => r.required().max(200) }),
    defineField({
      name: "mainImage", type: "image", group: "content", options: { hotspot: true },
      fields: [
        defineField({ name: "alt", type: "string", validation: (r) => r.required() }),
        defineField({ name: "caption", type: "string" }),
        defineField({ name: "credit", type: "string", description: "Agency or free-text credit" }),
        defineField({ name: "creditPerson", type: "reference", to: [{ type: "person" }], options: { filter: '"photographer" in roles' } }),
      ],
      validation: (r) => r.required().custom((img) => {
        const ref = (img as { asset?: { _ref?: string } })?.asset?._ref;
        if (!ref) return true;
        const [, , dims] = ref.split("-");             // image-<id>-1920x1080-webp
        const [w, h] = dims.split("x").map(Number);
        if (w < 1920 || h < 1080) return "Featured images must be at least 1920×1080";
        if (Math.abs(w / h - 16 / 9) > 0.01) return "Featured images must be 16:9";
        return true;
      }),
    }),
    defineField({ name: "body", type: "blockContent", group: "content" }),
    defineField({
      name: "authors", title: "Byline", type: "array", group: "content", validation: (r) => r.required().min(1),
      of: [defineArrayMember({ type: "reference", to: [{ type: "person" }],
        options: { filter: 'count(roles[@ in ["writer","editor","columnist","contributor","analyst"]]) > 0' } })],
    }),
    defineField({ name: "articleType", type: "string", group: "taxonomy", options: { list: ["news","analysis","opinion","feature","recap","preview","rankings","explainer"] }, initialValue: "news" }),
    defineField({ name: "sport", type: "string", group: "taxonomy", options: { list: [{title:"College Football",value:"cfb"},{title:"Men's Basketball",value:"mbb"},{title:"Women's Basketball",value:"wbb"}] }, validation: (r) => r.required() }),
    defineField({ name: "divisions", type: "array", group: "taxonomy", of: [{ type: "string" }], options: { list: ["fbs","fcs","d2","d3","naia","d1"] } }),
    defineField({ name: "schools", type: "array", group: "taxonomy", of: [defineArrayMember({ type: "reference", to: [{ type: "school" }] })] }),
    defineField({ name: "conferences", type: "array", group: "taxonomy", of: [defineArrayMember({ type: "reference", to: [{ type: "conference" }] })] }),
    defineField({ name: "category", type: "reference", group: "taxonomy", to: [{ type: "category" }], validation: (r) => r.required() }),
    defineField({ name: "publishedAt", type: "datetime", group: "content", validation: (r) => r.required() }),
    defineField({ name: "isPremium", type: "boolean", group: "monetization", initialValue: false }),
    defineField({ name: "sponsor", type: "reference", group: "monetization", to: [{ type: "sponsor" }] }),
    defineField({ name: "seo", type: "seo", group: "seo" }),
  ],
  preview: { select: { title: "title", media: "mainImage", subtitle: "publishedAt" } },
});
```

The image validation parses Sanity's asset id format (`image-<hash>-<w>x<h>-<ext>`). File-size limits (under 200 KB) are enforced in an upload-time **asset source plugin or a document action** that checks `asset->size` and warns; at render time the Sanity Image API serves AVIF/WebP via `auto=format` regardless of the original (§26).

### 12.4 GROQ queries

```ts
// packages/sanity/src/queries.ts
import { defineQuery } from "next-sanity";

export const postBySlugQuery = defineQuery(/* groq */ `
  *[_type == "post" && slug.current == $slug][0]{
    _id, _updatedAt, title, "slug": slug.current, excerpt, publishedAt, articleType, isPremium, sport, divisions,
    mainImage{ ..., asset->{ _id, url, metadata{ dimensions, lqip } } },
    body[]{ ..., markDefs[]{ ..., _type == "internalLink" => { "slug": @.reference->slug.current, "type": @.reference->_type } } },
    authors[]->{ _id, name, title, "slug": slug.current, image, shortBio, roles, "hasProfile": coalesce(profilePage.enabled, false), socials },
    category->{ title, "slug": slug.current },
    schools[]->{ name, shortName, "slug": slug.current, schoolId, logo, colors },
    conferences[]->{ name, "slug": slug.current },
    sponsor->{ name, logo, url, disclosureText },
    seo,
    "related": *[_type == "post" && _id != ^._id && count(schools[@._ref in ^.^.schools[]._ref]) > 0]
      | order(publishedAt desc)[0...4]{ title, "slug": slug.current, mainImage, publishedAt }
  }
`);

export const latestBySchoolQuery = defineQuery(/* groq */ `
  *[_type == "post" && references(*[_type == "school" && schoolId == $schoolId]._id)]
    | order(publishedAt desc)[$from...$to]{ _id, title, "slug": slug.current, excerpt, mainImage, publishedAt, sport }
`);

export const newsSitemapQuery = defineQuery(/* groq */ `
  *[_type == "post" && publishedAt > $since && !(_id in path("drafts.**"))] | order(publishedAt desc)[0...1000]{
    title, "slug": slug.current, publishedAt, sport, newsKeywords
  }
`);
```

Run `sanity typegen generate` in `packages/sanity` to produce `sanity.types.ts`; apps import query result types from there.

### 12.5 Studio

- **Structure**: desks by sport → division → content type; "People" (filter by role, staff vs contributor, profile on/off); "Pages" (grouped by standard, legal, landing); "My drafts"; "Scheduled"; "Needs image" (posts missing 1920×1080 images); "Live now" (live blogs with status live).
- **Roles** (Sanity): Administrator, Editor (publish), Contributor (create/edit own drafts, no publish), Viewer. Map staff via Sanity's member management; Clerk is not used for Studio login.
- **Workflow**: Draft → In Review → Approved → Scheduled/Published using Sanity's Releases or a custom `workflowState` field plus document actions.
- **Plugins**: Presentation tool (visual editing against `apps/web` draft mode), media library, scheduled publishing/releases, a custom "School picker" that searches by name, abbreviation and mascot.
- **AI-assist** (optional): excerpt and SEO description suggestions; always human-approved.

### 12.6 Webhooks from Sanity

| Webhook | Filter | Projection | Target |
|---|---|---|---|
| Content revalidate | `_type in ["post","person","school","conference","category","homepage","siteSettings","page","pollRelease","bracketPromo"]` | `{_id,_type,"slug":slug.current,"schoolIds":schools[]->schoolId,"oldSlug":before().slug.current}` | `POST /api/revalidate/sanity` |
| Search index | `_type == "post"` | `{_id,title,excerpt,"slug":slug.current,publishedAt}` | `POST /api/search/index` (Phase 2) |
| Push alerts | `_type == "post" && delta::changedAny(publishedAt) && isBreaking == true` | `{_id,title,"slug":slug.current,"schoolIds":schools[]->schoolId}` | `POST /api/notify/breaking` |

Verify with `@sanity/webhook`'s `isValidSignature` and the shared secret.

### 12.7 People: one `person` model for bylines, credits, hosts, voters and staff

There is no separate `author` type. Every human the site credits or features is a Sanity **`person`** document with one or more **roles**. Bylines, photo credits, podcast and video hosts, the staff masthead and optional voter profiles all reference the same document, so a writer who also hosts a podcast and votes in the FCS poll has one profile, one URL and one `Person` entity in structured data.

| Field | Type | Notes |
|---|---|---|
| `name` | string, required | Display name |
| `slug` | slug, required, unique | URL segment |
| `roles` | array of strings, min 1 | `writer`, `editor`, `photographer`, `podcastHost`, `videoHost`, `voter`, `staff`, `contributor`, `columnist`, `analyst` (list kept in one constant) |
| `title` | string | "FCS Insider", "Managing Editor" |
| `image` | image with alt | Headshot, square crop |
| `bio` | Portable Text | |
| `shortBio` | text, ≤ 200 chars | For byline cards and `description` |
| `beats` | array of `school` / `conference` refs | Powers "Our {team} coverage" and beat pages |
| `socials` | object: x, bluesky, instagram, threads, linkedin, website | Also emitted as `sameAs` |
| `email` | string, hidden from public queries | For the internal directory only |
| `clerkUserId` | string, read-only | Links to Postgres `users.sanity_person_id` (set by the admin "link account" action) |
| `voterIds` | read-only array of strings | Postgres `voters.id` values, filled when an invited voter opts into a profile |
| `isStaff` | boolean | Staff vs freelance/contributor; drives the masthead |
| `profilePage` | object: `enabled` (boolean), `noindex` (boolean) | **Profile page toggle.** Default `enabled = true` for `writer`, `editor`, `columnist`, `podcastHost`; `false` for others |
| `sortOrder`, `department` | number, string | Masthead ordering |
| `credentials` | array of strings | E-E-A-T details (years covering, past outlets) |

```ts
// packages/sanity/src/schemas/documents/person.ts
import { defineArrayMember, defineField, defineType } from "sanity";
import { UserIcon } from "@sanity/icons";

export const PERSON_ROLES = [
  { title: "Writer", value: "writer" }, { title: "Editor", value: "editor" }, { title: "Photographer", value: "photographer" },
  { title: "Podcast host", value: "podcastHost" }, { title: "Video host", value: "videoHost" }, { title: "Poll voter", value: "voter" },
  { title: "Staff", value: "staff" }, { title: "Contributor", value: "contributor" }, { title: "Columnist", value: "columnist" }, { title: "Analyst", value: "analyst" },
] as const;
const PROFILE_BY_DEFAULT = ["writer", "editor", "columnist", "podcastHost"];

export const person = defineType({
  name: "person",
  title: "Person",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", options: { source: "name" }, validation: (r) => r.required() }),
    defineField({ name: "roles", type: "array", of: [{ type: "string" }], options: { list: [...PERSON_ROLES], layout: "grid" }, validation: (r) => r.required().min(1) }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "image", type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", type: "string" })] }),
    defineField({ name: "shortBio", type: "text", rows: 3, validation: (r) => r.max(200) }),
    defineField({ name: "bio", type: "blockContent" }),
    defineField({ name: "beats", type: "array", of: [defineArrayMember({ type: "reference", to: [{ type: "school" }, { type: "conference" }] })] }),
    defineField({ name: "socials", type: "socialLinks" }),
    defineField({ name: "isStaff", type: "boolean", initialValue: false }),
    defineField({ name: "department", type: "string" }),
    defineField({ name: "credentials", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "profilePage", type: "object",
      fields: [
        defineField({ name: "enabled", type: "boolean", description: "Publish a page at /people/{slug}" }),
        defineField({ name: "noindex", type: "boolean", initialValue: false }),
      ],
      initialValue: { enabled: false, noindex: false },
    }),
    defineField({ name: "email", type: "string", hidden: ({ currentUser }) => !currentUser?.roles.some((r) => r.name === "administrator") }),
    defineField({ name: "clerkUserId", type: "string", readOnly: true }),
    defineField({ name: "voterIds", type: "array", of: [{ type: "string" }], readOnly: true }),
  ],
  preview: { select: { title: "name", subtitle: "title", media: "image" } },
});
// A document action sets profilePage.enabled = true on first publish when roles intersect PROFILE_BY_DEFAULT.
```

**How content references people**

| Document | Field | Constraint |
|---|---|---|
| `post` | `authors[]` → `person` (the **byline**) | Reference filter: `roles` includes `writer`, `editor`, `columnist`, `contributor` or `analyst`; min 1 |
| `post.mainImage` / `image` blocks | `creditPerson` → `person` (optional) plus free-text `credit` for agencies | Filter: `photographer` |
| `podcastShow` / `podcastEpisode` | `hosts[]`, `guests[]` → `person` | Hosts filter: `podcastHost` |
| `video` | `hosts[]` → `person` | |
| `page` module `staffGrid` | Manual list or a query by role/department | |

```ts
// byline reference with a role filter
defineField({
  name: "authors", title: "Byline", type: "array", validation: (r) => r.required().min(1),
  of: [defineArrayMember({ type: "reference", to: [{ type: "person" }],
    options: { filter: 'count(roles[@ in ["writer","editor","columnist","contributor","analyst"]]) > 0' } })],
}),
```

**GROQ byline projection** (used everywhere a byline renders):

```ts
export const personCardFragment = /* groq */ `{
  _id, name, title, "slug": slug.current, image, shortBio, roles,
  "hasProfile": coalesce(profilePage.enabled, false), socials
}`;
// in postBySlugQuery: authors[]->${personCardFragment}
```

**Rendering rules**

- If `hasProfile`, the byline links to `/people/{slug}` and JSON-LD `author` includes `url` plus `sameAs` from socials. If not, the name renders as plain text and JSON-LD carries `name` (and `sameAs` if present) without a `url`. Writers have profiles by default because a linked author page with credentials is a strong trust signal for Google News and AI answer engines.
- People with profiles disabled are excluded from sitemaps and return 404 at `/people/{slug}`.
- **Voters**: the poll transparency pages (`/college-football/rankings/fcs/voters/{voter}`) are Postgres data pages and always exist for active voters. If the voter also has a `person` doc with a profile (linked through `voterIds`), the voter page links to it and the person page shows a "Poll ballots" section (pulled from Postgres).

#### URL: `/people/{slug}` (recommended) vs `/staff/{slug}`

| | `/people/{slug}` | `/staff/{slug}` |
|---|---|---|
| Accuracy | Fits everyone the model covers: staff, freelancers, photographers, guest hosts, voters | Wrong for freelancers, contributors and voters |
| Stability | No redirect when someone moves between staff and contributor | Role change would imply a URL change or an inaccurate URL |
| Masthead | `/staff` is free to be the masthead page (a page-builder page with a `staffGrid` module) | Collides conceptually with the masthead |

**Recommendation: `/people/{slug}`** for every profile, and `/staff` as the masthead listing. The profile page renders sections based on roles: latest articles (writer/editor), photo galleries credited (photographer), episodes (host), poll ballots (voter), beats, and socials. JSON-LD: `ProfilePage` with `mainEntity` `Person` (`name`, `jobTitle`, `image`, `sameAs`, `worksFor` the Redshirt Sports `Organization` when `isStaff`).

### 12.8 Page builder for one-off pages

About, Contact, Privacy Policy, Terms of Service, Ethics and Corrections policy, Editorial Standards, Advertise, Careers, Masthead (`/staff`), Poll methodology, Bracket rules, Accessibility statement, Press kit and similar pages are **built in Sanity** with a single `page` document type made of ordered, typed **sections**. They are served by a catch-all route and edited visually with the Presentation tool.

#### `page` document

| Field | Notes |
|---|---|
| `title`, `slug` | Slug may contain `/` for nesting (`about/ethics`), validated against **reserved paths** (below) and for uniqueness |
| `sections[]` | Ordered modules (table below) |
| `seo` | title, description, ogImage, `noindex` |
| `pageType` | `standard`, `legal`, `landing`, used for layout and JSON-LD (`WebPage`, `AboutPage`, `ContactPage`) |
| `legal` (when `pageType = legal`) | `effectiveDate`, `version`, `changeSummary`, displayed at the top; Terms/Privacy version strings are stored with user acceptances |
| `showInSitemap` | default true |
| `parent` | optional reference for breadcrumbs |

#### Section modules

| Module | Purpose | Fields | Rendering / schema |
|---|---|---|---|
| `hero` | Page heading | heading (renders the **only `<h1>`**), subheading, image, CTA buttons, variant | |
| `richText` | Body copy | Portable Text (h2–h4 only, links, lists, tables) | `prose` styles |
| `faq` | Questions and answers | items[] {question, answer (PT)} | Accessible disclosure list + **`FAQPage` JSON-LD** generated from the same data |
| `contactForm` | Contact, tips, corrections, advertising inquiries | formType (`general`, `tip`, `correction`, `advertising`, `careers`), routing email (from an allow-list in `siteSettings`), intro text, success message, fields toggles (phone, URL, attachment) | Server action → zod → Turnstile check → rate limit → `contact_submissions` table (Drizzle) → Resend notification to the routed inbox; attachments via Supabase Storage signed upload |
| `staffGrid` | Masthead, team pages | mode `manual` (refs to `person`) or `query` (by role, department, `isStaff`), layout | Links to `/people/{slug}` when the profile is enabled |
| `cta` | Conversion block | heading, body, button(s), style | Newsletter, subscribe, bracket signup |
| `embed` | Third-party content | provider (`youtube`, `x`, `instagram`, `tiktok`, `spotify`, `apple-podcasts`, `google-map`, `iframe`), URL, title, aspect ratio | Allow-listed providers only, `iframe` limited to an allow-list of hosts, lazy-loaded, title required |
| `newsletterSignup` | List signup | list ids, copy | Uses the subscribe action (§21.2) |
| `featuredContent` | Curated or latest posts | manual refs or query (sport, school, category), count | |
| `imageGallery`, `imageWithText` | Media | images with alt + credit | |
| `logoCloud` | Advertise page, partners | logos with links | `rel="sponsored"` where applicable |
| `statsBand` | Key numbers you can source | label, value, source note | Editors enter only numbers they can back up |
| `pricingTable` | Advertise rates, subscription plans | tiers[] | |
| `jobListings` | Careers | refs to `jobPosting` docs (title, location/remote, type, description, validThrough) | Emits **`JobPosting` JSON-LD** per listing; expired postings are hidden automatically |
| `table` | Policy matrices | rows/columns | Real `<table>` with caption |
| `divider` / `spacer` | Layout | size | |

Each module is a Sanity object type with its own schema file and a matching React Server Component in `apps/web/components/sections/*`. A registry maps `_type` to component; unknown types render nothing in production and a warning box in draft mode.

```ts
// packages/sanity/src/schemas/documents/page.ts
import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentIcon } from "@sanity/icons";
import { RESERVED_ROOT_SEGMENTS } from "../../reserved-paths";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  icon: DocumentIcon,
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug", type: "slug", options: { source: "title" },
      validation: (r) => r.required().custom((s) => {
        const v = s?.current ?? "";
        if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(v)) return "Lowercase letters, numbers, hyphens; use / for nesting";
        if (RESERVED_ROOT_SEGMENTS.includes(v.split("/")[0])) return `"${v.split("/")[0]}" is reserved by the app`;
        return true;
      }),
    }),
    defineField({ name: "pageType", type: "string", options: { list: ["standard", "legal", "landing"] }, initialValue: "standard" }),
    defineField({ name: "legal", type: "legalMeta", hidden: ({ document }) => document?.pageType !== "legal" }),
    defineField({
      name: "sections", type: "array",
      of: ["hero", "richText", "faq", "contactForm", "staffGrid", "cta", "embed", "newsletterSignup", "featuredContent",
           "imageGallery", "imageWithText", "logoCloud", "statsBand", "pricingTable", "jobListings", "table", "divider"]
        .map((type) => defineArrayMember({ type })),
      options: { insertMenu: { views: [{ name: "grid", previewImageUrl: (t) => `/static/section-previews/${t}.png` }] } },
      validation: (r) => r.custom((sections: { _type: string }[] | undefined) =>
        (sections ?? []).filter((s) => s._type === "hero").length > 1 ? "Only one hero (one h1) per page" : true),
    }),
    defineField({ name: "seo", type: "seo" }),
    defineField({ name: "showInSitemap", type: "boolean", initialValue: true }),
  ],
});
```

```ts
// packages/sanity/src/reserved-paths.ts  (shared by Studio validation and the web router)
export const RESERVED_ROOT_SEGMENTS = [
  "college-football", "mens-college-basketball", "womens-college-basketball", "teams", "people", "transfer-portal",
  "topics", "podcasts", "video", "bracket-challenge", "newsletters", "onboarding", "account", "search", "sign-in", "sign-up", "api", "studio",
  "sitemap.xml", "news-sitemap.xml", "sitemaps", "robots.txt", "feed.xml", "ads.txt", "manifest.webmanifest", "_next",
];
```

#### Catch-all route

Sport sections are real static folders (`app/(site)/college-football/…`, §17.3). Static segments always match before the root catch-all, so `[...slug]` only sees paths no folder claims. `RESERVED_ROOT_SEGMENTS` is generated from the route manifest, so editors can't create a page whose slug shadows a section. No rewrites are involved.

```tsx
// apps/web/app/(site)/[...slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/live";
import { client } from "@rs/sanity/client";
import { pageBySlugQuery, pageSlugsQuery } from "@rs/sanity/queries";
import { Sections } from "@/components/sections";
import { pageJsonLd } from "@rs/seo/jsonld/page";
import { JsonLd } from "@/components/json-ld";
import { buildMetadata } from "@rs/seo/metadata";

type Props = { params: Promise<{ slug: string[] }> };

export async function generateStaticParams() {
  const slugs = await client.fetch(pageSlugsQuery, {}, { perspective: "published", stega: false });
  return slugs.map((s: string) => ({ slug: s.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: pageBySlugQuery, params: { slug: slug.join("/") }, stega: false }); // no stega in metadata
  return data ? buildMetadata({ title: data.seo?.title ?? data.title, description: data.seo?.description, path: `/${data.slug}`, noindex: data.seo?.noindex }) : {};
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const { data } = await sanityFetch({ query: pageBySlugQuery, params: { slug: slug.join("/") } });
  if (!data) notFound();
  return (
    <>
      <JsonLd data={pageJsonLd(data)} />   {/* WebPage/AboutPage/ContactPage + FAQPage + JobPosting, built with stega disabled */}
      <Sections sections={data.sections} pageId={data._id} />
    </>
  );
}
```

```ts
export const pageBySlugQuery = defineQuery(/* groq */ `
  *[_type == "page" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, pageType, legal, seo,
    sections[]{
      ...,
      _type == "staffGrid" => {
        ...,
        "people": select(
          mode == "manual" => people[]->${personCardFragment},
          // @ = role string, ^ = person, ^.^ = this section
          *[_type == "person" && count(roles[@ in ^.^.roles]) > 0 && (coalesce(^.staffOnly, false) == false || isStaff == true)]
            | order(sortOrder asc, name asc)${personCardFragment}
        )
      },
      _type == "jobListings" => { "jobs": jobs[!defined(@->validThrough) || @->validThrough > now()]->{ title, location, employmentType, validThrough, description } },
      _type == "featuredContent" => { "posts": select(mode == "manual" => posts[]->{ title, "slug": slug.current, primarySport, mainImage },
        *[_type == "post" && sport == ^.sport] | order(publishedAt desc)[0...6]{ title, "slug": slug.current, primarySport, mainImage }) }
    }
  }
`);
```

Revalidation: the Sanity webhook (§12.6) adds `page` and `person` to its filter and expires `page:<slug>`; `staffGrid` sections also depend on `person` changes, so person updates expire the `pages:with-people` tag.

#### Preview and visual editing (Presentation tool)

```ts
// apps/studio/sanity.config.ts (excerpt)
import { defineConfig } from "sanity";
import { presentationTool, defineLocations } from "sanity/presentation";

export default defineConfig({
  // ...
  plugins: [
    presentationTool({
      previewUrl: { initial: process.env.SANITY_STUDIO_PREVIEW_URL, previewMode: { enable: "/api/draft-mode/enable" } },
      resolve: {
        mainDocuments: [{ route: "/:slug*", filter: `_type == "page" && slug.current == $slug` }],
        locations: {
          page: defineLocations({ select: { title: "title", slug: "slug.current" }, resolve: (doc) => ({ locations: [{ title: doc?.title ?? "Page", href: `/${doc?.slug}` }] }) }),
          person: defineLocations({ select: { name: "name", slug: "slug.current" }, resolve: (doc) => ({ locations: [{ title: doc?.name ?? "Person", href: `/people/${doc?.slug}` }, { title: "Masthead", href: "/staff" }] }) }),
        },
      },
    }),
  ],
});
```

On the web side: `defineLive` from `next-sanity` provides `sanityFetch` and `<SanityLive />`; the root layout renders `<VisualEditing />` only when draft mode is enabled; `/api/draft-mode/enable` uses `defineEnableDraftMode` with a read token. Section components add `data-sanity` attributes (via `createDataAttribute`) to array items so editors can click a section in the preview and reorder or edit it in place.

#### Recommendation and caveats

**Recommendation: yes, use the page builder for these pages.** They change rarely but unpredictably, are owned by editors and business staff rather than engineers, and share a small set of layouts. Modeling them as typed sections gives non-developers safe control, keeps one rendering system, and adds structured data (FAQ, jobs) from the same content.

Caveats to plan for:

1. **Constrain the modules.** A small, opinionated set of sections with validation (one hero, h2–h4 only, required alt text, required iframe titles) keeps pages accessible and on brand. Avoid free-form "columns/spacing/color" controls that turn the CMS into a design tool.
2. **Legal pages need versioning.** Show `effectiveDate` and `version`; keep Sanity history (and an exported copy per version in Storage); record the Terms/Privacy version a user accepted. Have counsel review the content; the builder only manages layout.
3. **Reserved paths.** The catch-all must never shadow app routes: slugs are validated against `RESERVED_ROOT_SEGMENTS` in Studio, and the router checks the list again.
4. **Stega and metadata.** Visual editing encodes invisible characters into strings in draft mode; fetch with `stega: false` for `generateMetadata`, JSON-LD, `<title>`, OG images and anything compared programmatically.
5. **FAQ rich results are limited.** Google shows FAQ rich results only for a narrow set of authoritative sites, so the `FAQPage` markup mostly helps structure and answer engines rather than adding SERP features. Keep it accurate and visible on the page.
6. **Forms are an app feature.** The contact form needs a server action, spam protection (Turnstile + rate limits), storage (`contact_submissions`), routing, retention rules and a privacy notice. Sanity only configures it.
7. **Performance.** Heavy embeds (maps, social posts) load lazily behind a click-to-load facade; sections are Server Components with no client JS unless interactive.
8. **Ownership.** Studio roles: editors can edit standard pages; only administrators (or a "legal" role on Enterprise) can publish `legal` pages, enforced with a document action check.
---

## 13. Top 25 polls: full lifecycle

### 13.1 Goals

1. **Credible**: approved, named voters; published ballots; documented methodology; conflict disclosures.
2. **Reproducible**: results are a pure function of locked ballots; anyone with the ballots can recompute the poll.
3. **Operable**: weekly cadence runs on schedules with minimal manual work; admins can intervene (extend window, void a ballot, republish).
4. **Extensible**: same engine for FBS, FCS, D-II, D-III, men's and women's basketball (Top 25), with different sizes and calendars.

### 13.2 State machine

```mermaid
stateDiagram-v2
  [*] --> draft: admin or cron creates week
  draft --> open: opens_at reached (cron) or admin
  open --> open: admin extends closes_at
  open --> closed: closes_at reached (cron)
  closed --> open: admin reopens (audit logged)
  closed --> tabulated: tabulate job
  tabulated --> tabulated: re-tabulate after void
  tabulated --> published: publish_at reached or admin
  published --> tabulated: admin unpublishes (rare, audit logged)
  published --> voided: admin voids week (catastrophic only)
  voided --> [*]
  published --> [*]
```

Ballot states: `draft` (autosaved, editable) → `submitted` (counted if still submitted at close; still editable while open) → `locked` (frozen at close) or `voided` (admin, with reason).

### 13.3 Calendar defaults (configurable per poll)

All times America/New_York in config, stored as UTC, displayed in the viewer's local zone with zone label.

| Poll | Opens | Closes | Publishes | Notes |
|---|---|---|---|---|
| FBS Top 25 | Sunday 08:00 ET | Monday 12:00 ET | Monday or Tuesday at a set hour | Late Saturday games finish after midnight ET; Sunday morning open avoids premature ballots |
| FCS Top 25 | Sunday 08:00 ET | Monday 12:00 ET | Monday or Tuesday | Same cadence |
| D-II / D-III Top 25 | Sunday 10:00 ET | Monday 18:00 ET | Tuesday | Smaller voter pools, give more time |
| Preseason | Admin-set window in summer | | Admin-set | `week_number = 0` |
| Final | After title game | +48 h | Admin | Label "Final" |
| MBB/WBB Top 25 | Sunday 18:00 ET | Monday 10:00 ET | Monday afternoon | Basketball weeks run Monday–Sunday |

A **season generator** (admin action) creates all `poll_weeks` for a season from the `weeks` table and the poll's calendar template, all in `draft`. Weeks the poll admin marks as skipped (holiday, no-poll weeks) are omitted. Weeks are a calendar config, not a feed schedule.

### 13.4 Voter onboarding: invite-only

There is **no public voter application**. Panels are curated: a poll admin invites a specific person by email for a specific poll and season, and only accepting that invite creates a voter. This keeps the panel credible, removes an abuse surface (fake applications, bots, review queues) and makes each season's roster an explicit admin decision.

```mermaid
sequenceDiagram
  participant PA as Poll admin
  participant AD as admin. (staff)
  participant VO as vote. (apps/vote)
  participant DB as Postgres (Drizzle)
  participant R as Resend
  participant V as Invitee
  participant C as Clerk
  participant WH as Clerk webhook
  PA->>AD: Create invite (email, poll, season, optional name/outlet)
  AD->>DB: insert voter_invites (pending, token_hash, expires_at)
  AD->>R: Invite email with link to vote.redshirtsports.com/invite/{token}
  V->>VO: Open /invite/{token}
  VO->>VO: Verify signature + expiry (no DB yet)
  V->>C: Sign in or sign up (email prefilled, shared session)
  V->>VO: Complete profile: public name, outlet, bio, conflicts, code of conduct
  VO->>DB: TX: lock invite row, check pending + hash + email, insert voters, mark accepted, audit
  VO->>C: updateUserMetadata(roles += "voter", isVoter = true)
  C-->>WH: user.updated
  WH->>DB: mirror user_roles (adds "voter")
  VO-->>V: Redirect to /ballot (token refreshed so the new claim is present)
```

#### Token design (signed, single-use, expiring)

- The link is `https://vote.redshirtsports.com/invite/{token}`, where `token = base64url(payload) + "." + base64url(HMAC-SHA256(payload, VOTER_INVITE_SECRET))` and `payload = { v: 1, i: inviteId, n: nonce, e: expiresAtUnix }`. The nonce is 32 random bytes.
- The **signature** lets the server reject tampered or expired links without touching the database (cheap rejection of guessing traffic).
- The database stores only `sha256(nonce)` (`token_hash`) and `status`. **Single use** is enforced by an atomic `update … where status = 'pending' and token_hash = $hash and expires_at > now()`; a second click finds nothing to update.
- **Expiry** defaults to 14 days. A nightly job marks old pending invites `expired`.
- **Resend rotates the nonce**: the old link stops working the moment a new one is sent.
- **Revocation** sets `status = 'revoked'`; the link fails immediately even if the signature is valid.
- **Email binding**: the Clerk account accepting the invite must have a *verified* email equal to the invite email (case-insensitive). An admin can set `allow_any_email` for someone who wants to use a different account; that's audited.
- Voters must enroll **MFA** in Clerk before their first ballot (§13.13).

```ts
// packages/polls/src/invite-token.ts  (pure: no DB, runs in tests)
import { createHmac, randomBytes, createHash, timingSafeEqual } from "node:crypto";

type Payload = { v: 1; i: string; n: string; e: number };
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function createInviteToken(inviteId: string, expiresAt: Date, secret: string) {
  const nonce = randomBytes(32).toString("base64url");
  const payload: Payload = { v: 1, i: inviteId, n: nonce, e: Math.floor(expiresAt.getTime() / 1000) };
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", secret).update(body).digest());
  return { token: `${body}.${sig}`, tokenHash: sha256(nonce) };
}

export function verifyInviteToken(token: string, secret: string, now = new Date()): { inviteId: string; tokenHash: string } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
  if (p.v !== 1 || p.e * 1000 <= now.getTime()) return null;
  return { inviteId: p.i, tokenHash: sha256(p.n) };
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
```

#### Creating invites (admin)

```ts
// apps/admin/app/ops/voters/invites/actions.ts  (staff app)
"use server";
import { z } from "zod";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";
import { adminDb } from "@rs/db";
import { voterInvites, pollAuditLog } from "@rs/db/schema";
import { createInviteToken } from "@rs/polls/invite-token";
import { requireRole } from "@rs/auth/server";
import { sendVoterInvite } from "@rs/emails/send";

const Input = z.object({
  pollId: z.uuid(), seasonId: z.string(),
  invitees: z.array(z.object({ email: z.email(), publicName: z.string().max(80).optional(), outlet: z.string().max(120).optional() })).min(1).max(200),
  expiresInDays: z.number().int().min(1).max(30).default(14),
  note: z.string().max(500).optional(),
});

export async function createInvites(raw: unknown) {
  const adminId = await requireRole("poll_admin");
  const input = Input.parse(raw);
  const expiresAt = addDays(new Date(), input.expiresInDays);
  const toSend: { email: string; token: string }[] = [];

  await adminDb.transaction(async (tx) => {
    for (const inv of input.invitees) {
      const [row] = await tx.insert(voterInvites).values({
        email: inv.email, pollId: input.pollId, seasonId: input.seasonId, publicName: inv.publicName, outlet: inv.outlet,
        note: input.note, tokenHash: "pending", expiresAt, invitedBy: adminId,
      }).onConflictDoNothing().returning({ id: voterInvites.id });   // skips emails that already have a pending invite
      if (!row) continue;
      const { token, tokenHash } = createInviteToken(row.id, expiresAt, process.env.VOTER_INVITE_SECRET!);
      await tx.update(voterInvites).set({ tokenHash }).where(eq(voterInvites.id, row.id));
      await tx.insert(pollAuditLog).values({ inviteId: row.id, actorId: adminId, action: "invite.create", detail: { email: inv.email } });
      toSend.push({ email: inv.email, token });
    }
  });
  // Send after commit: never hold a DB transaction open across a network call
  await Promise.all(toSend.map((t) => sendVoterInvite(t.email, `${process.env.VOTE_URL}/invite/${t.token}`)));
  return { created: toSend.length, skipped: input.invitees.length - toSend.length };
}
```

#### Accepting an invite

```ts
// apps/vote/app/invite/[token]/actions.ts
"use server";
import { and, eq, gt, sql } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { adminDb } from "@rs/db";
import { voterInvites, voters, pollAuditLog } from "@rs/db/schema";
import { InviteInvalidError, InviteEmailMismatchError } from "@rs/db/errors";
import { verifyInviteToken } from "@rs/polls/invite-token";
import { ensureUser } from "@rs/db/queries/users";
import { slugify } from "@rs/seo/slug";

export async function acceptInvite(token: string, profile: { publicName: string; outlet?: string; bio?: string; conflicts: string[]; cocVersion: string }) {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHENTICATED");
  const parsed = verifyInviteToken(token, process.env.VOTER_INVITE_SECRET!);
  if (!parsed) throw new InviteInvalidError();

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  await ensureUser(user);                                     // users row exists even if the webhook hasn't arrived
  const verifiedEmails = user.emailAddresses.filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase());

  const voter = await adminDb.transaction(async (tx) => {
    const [invite] = await tx.select().from(voterInvites).where(eq(voterInvites.id, parsed.inviteId)).for("update");
    if (!invite || invite.status !== "pending" || invite.tokenHash !== parsed.tokenHash || invite.expiresAt <= new Date()) throw new InviteInvalidError();
    if (!invite.allowAnyEmail && !verifiedEmails.includes(invite.email.toLowerCase())) throw new InviteEmailMismatchError();

    const [v] = await tx.insert(voters).values({
      userId, pollId: invite.pollId, seasonId: invite.seasonId, inviteId: invite.id,
      slug: slugify(profile.publicName), publicName: profile.publicName, outlet: profile.outlet, bio: profile.bio,
      conflicts: profile.conflicts, codeOfConductVersion: profile.cocVersion, addedBy: invite.invitedBy,
    }).onConflictDoUpdate({                                   // re-invited after a revocation in the same season
      target: [voters.userId, voters.pollId, voters.seasonId],
      set: { status: "active", inviteId: invite.id, revokedAt: null, revokedBy: null, revokedReason: null, joinedAt: new Date() },
    }).returning();

    await tx.update(voterInvites).set({ status: "accepted", acceptedBy: userId, acceptedAt: new Date() })
      .where(and(eq(voterInvites.id, invite.id), eq(voterInvites.status, "pending")));
    await tx.insert(pollAuditLog).values({ inviteId: invite.id, voterId: v.id, actorId: userId, action: "invite.accept" });
    return v;
  });

  // After commit: grant the coarse role in Clerk. The user.updated webhook mirrors it into user_roles.
  const roles = new Set<string>((user.publicMetadata.roles as string[] | undefined) ?? []);
  roles.add("voter");
  await clerk.users.updateUserMetadata(userId, { publicMetadata: { roles: [...roles], isVoter: true } });
  return { voterId: voter.id };
}
```

The client calls `session.reload()` (or `getToken({ skipCache: true })`) after acceptance so the new `roles` claim is in the session token immediately; otherwise it appears on the next token refresh. **Authorization never depends on the claim alone**: every ballot action checks the `voters` row for that poll and season (§13.7). The Clerk role is a coarse gate for navigation and RLS.

> **Clerk Invitations API, optionally.** Clerk can create its own invitations (with `publicMetadata` and a redirect URL) for people who don't have an account yet. It doesn't scope access to a poll and season or handle people who already have accounts, so the signed token above stays the source of truth. If you want Clerk's sign-up email for brand-new users, create a Clerk invitation *and* include the Redshirt invite token in its `redirectUrl`.

#### Revocation, suspension and the role sync

| Action | Database | Clerk | Effect on ballots |
|---|---|---|---|
| Revoke a pending invite | `voter_invites.status = 'revoked'` | none | Link stops working |
| Suspend a voter (temporary) | `voters.status = 'suspended'` | keep role if active elsewhere | Can't submit while suspended; current open-week ballot is excluded at close unless reinstated |
| Revoke a voter (for the season) | `voters.status = 'revoked'`, reason required | If the user has no other `active` voter rows: remove `voter` from `publicMetadata.roles`, `isVoter = false` | Open-week ballot is voided (audited). Already-published ballots stay published with their history (polls must remain reproducible) |
| Reinstate | `status = 'active'` | Re-add role | Can vote in open weeks again |

Clerk `user.updated` webhooks keep `user_roles` in sync (§8.5). A nightly reconcile job compares `voters` (active rows) with Clerk metadata and fixes drift in either direction, logging every correction.

#### Seasonal rosters

Approval is per **poll + season**. Before each season:

1. Admin opens **Roster builder** for the new season: the previous season's active voters are listed with participation (ballots submitted / weeks), missed weeks and outlier stats.
2. Admin selects returning voters → **Renew** creates new invites for the new season (prefilled public name and outlet). Returning voters accept in one click but must re-confirm conflicts and the current code-of-conduct version.
3. Admin adds new invitees (single or bulk paste of `email, name, outlet`).
4. Admin sets the target panel size and the **roster publish** toggle; the public voter panel page shows only active voters for the season, once published.
5. Rosters for past seasons are frozen and stay public alongside their ballots.

#### Admin tools (apps/admin)

| Screen | Route | Capabilities |
|---|---|---|
| Voter roster | `/ops/voters?poll=cfb-fcs&season=2026` | Active/suspended/revoked voters, participation %, missed weeks, MFA status, conflicts, last ballot, quick actions |
| Invites | `/ops/voters/invites` | Create single or bulk invites, filter by status (pending, accepted, expired, revoked), resend (rotates token), revoke, copy link (audited), change expiry |
| Roster builder | `/ops/voters/rosters/{poll}/{season}` | Carry forward from previous season, renew selected, add new, panel-size target, publish toggle |
| Voter detail | `/ops/voters/{voterId}` | Profile and disclosures, ballot history, outlier history, suspend/revoke/reinstate with reason, audit timeline, link to a Sanity `person` profile |
| Reconcile | `/ops/voters/reconcile` | Drift between `voters` and Clerk roles, one-click fix |

#### What the voter provides (at acceptance, not before)

Public display name; outlet/affiliation with URL; short bio; social handles; conflicts disclosure (employer, alma mater, family ties, paid relationships), shown publicly next to their ballots; acceptance of the methodology and code of conduct (version stored); optional avatar uploaded to Supabase Storage via a signed URL.

**Selection criteria (for admins, published on the methodology page):** regularly covers the division; no athletics-department employees; team broadcasters only with disclosure; one ballot per person; season-scoped membership; participation expectations (missing 2 consecutive weeks triggers a warning, 3 triggers a roster review).

**Panel size**: aim for enough voters per poll that one outlier ballot cannot move a team more than a couple of spots; publish the count every week. With small panels (under ~15), show a note.

### 13.5 Ballot entry UX (`apps/vote` at `vote.redshirtsports.com/ballot/[poll]/[season]/[week]`)

- Two columns: **search + filter list of eligible teams** (division teams for that season with admin-entered record if present, last week's rank in the Redshirt poll) and **your ballot 1–25** (drag-and-drop with keyboard support: up/down buttons and "move to rank N" input).
- **Prefill** from the voter's previous week ballot (optional toggle), with teams that lost highlighted.
- **Autosave** drafts every change (debounced 1 s) to `ballots.status='draft'`; explicit **Submit** button validates and marks `submitted`.
- Countdown to close in the voter's local zone, with ET also shown.
- Optional 280-char note per team and a ballot note.
- After close: read-only view; after publish: link to public transparency page.
- Mobile first: many voters fill ballots on phones Sunday morning.

### 13.6 Validation rules

| Rule | Where enforced | Error |
|---|---|---|
| Exactly `poll.size` entries for a submit (drafts may be partial) | zod + SQL function | `BALLOT_INCOMPLETE` |
| Ranks 1..N contiguous and unique | PK `(ballot_id, rank)` + function check | `BALLOT_RANKS_INVALID` |
| Each team at most once | unique `(ballot_id, team_id)` | `BALLOT_DUPLICATE_TEAM` |
| Team belongs to poll division for that season | function joins `team_seasons` | `BALLOT_TEAM_NOT_ELIGIBLE` |
| Transitional/ineligible team allowed only if `polls.allow_ineligible` | function | `BALLOT_TEAM_INELIGIBLE` |
| Voter active for poll+season | function | `NOT_A_VOTER` |
| Window open (`now() between opens_at and closes_at` and status `open`) | function, `for update` lock on poll week | `POLL_WEEK_CLOSED` |
| Rate limit (e.g. 30 saves/min per voter) | Upstash or Postgres token bucket | `RATE_LIMITED` |
| Soft warnings (not errors): ranked a team that lost to an unranked team below that team; ranked an 0-3 team; big jump (> 10 spots) vs previous own ballot | TS heuristics in `@rs/polls` | shown as warnings before submit |

### 13.7 Submit ballot (Drizzle transaction; lock enforced inside it)

```ts
// packages/db/src/queries/ballots.ts
import { and, eq, inArray, sql } from "drizzle-orm";
import { adminDb } from "../client";
import { ballots, ballotEntries, ballotRevisions, pollAuditLog, pollWeeks, polls, teamSeasons, voters } from "../schema";
import { BallotInvalidError, NotAVoterError, PollWeekClosedError } from "../errors";

export type BallotInput = { pollWeekId: string; entries: { rank: number; teamId: string }[]; final: boolean; fingerprint?: string };

export async function submitBallot(userId: string, input: BallotInput) {
  return adminDb.transaction(async (tx) => {
    // 1. Serialize against the close job: both take a row lock on the poll week
    const [week] = await tx.select().from(pollWeeks).where(eq(pollWeeks.id, input.pollWeekId)).for("update");
    const now = new Date();
    if (!week || week.status !== "open" || now < week.opensAt || now >= week.closesAt) throw new PollWeekClosedError();
    const [poll] = await tx.select().from(polls).where(eq(polls.id, week.pollId));

    // 2. Authorization from the database, not from the session claim
    const [voter] = await tx.select().from(voters).where(and(
      eq(voters.userId, userId), eq(voters.pollId, week.pollId), eq(voters.seasonId, week.seasonId), eq(voters.status, "active")));
    if (!voter) throw new NotAVoterError();

    // 3. Shape validation (zod already checked types in the action)
    const n = input.entries.length;
    const ranks = new Set(input.entries.map((e) => e.rank));
    const teamIds = new Set(input.entries.map((e) => e.teamId));
    if (n > poll.size) throw new BallotInvalidError("BALLOT_TOO_LONG");
    if (input.final && n !== poll.size) throw new BallotInvalidError("BALLOT_INCOMPLETE");
    if (ranks.size !== n || teamIds.size !== n || Math.min(...ranks) !== 1 || Math.max(...ranks) !== n) throw new BallotInvalidError("BALLOT_RANKS_INVALID");

    // 4. Eligibility: every team is in the poll's division this season
    if (n > 0) {
      const eligible = await tx.select({ teamId: teamSeasons.teamId }).from(teamSeasons).where(and(
        eq(teamSeasons.seasonId, week.seasonId), eq(teamSeasons.division, poll.division), inArray(teamSeasons.teamId, [...teamIds]),
        poll.allowIneligible ? sql`true` : eq(teamSeasons.postseasonEligible, true)));
      if (eligible.length !== n) throw new BallotInvalidError("BALLOT_TEAM_NOT_ELIGIBLE");
    }

    // 5. Upsert ballot; saving a draft never un-submits
    const [ballot] = await tx.insert(ballots).values({
      pollWeekId: week.id, voterId: voter.id, status: input.final ? "submitted" : "draft",
      submittedAt: input.final ? now : null, clientFingerprint: input.fingerprint,
    }).onConflictDoUpdate({
      target: [ballots.pollWeekId, ballots.voterId],
      set: {
        status: input.final ? sql`'submitted'` : sql`case when ${ballots.status} = 'submitted' then 'submitted' else 'draft' end`,
        submittedAt: input.final ? now : sql`${ballots.submittedAt}`,
        revision: sql`${ballots.revision} + 1`,
        clientFingerprint: sql`coalesce(${input.fingerprint ?? null}, ${ballots.clientFingerprint})`,
      },
    }).returning();

    // 6. Replace entries, keep immutable revision history, audit
    await tx.delete(ballotEntries).where(eq(ballotEntries.ballotId, ballot.id));
    if (n > 0) await tx.insert(ballotEntries).values(input.entries.map((e) => ({ ballotId: ballot.id, rank: e.rank, teamId: e.teamId })));
    await tx.insert(ballotRevisions).values({ ballotId: ballot.id, revision: ballot.revision, entries: input.entries, savedBy: userId });
    await tx.insert(pollAuditLog).values({ pollWeekId: week.id, ballotId: ballot.id, voterId: voter.id, actorId: userId,
      action: input.final ? "ballot.submit" : "ballot.save", detail: { count: n } });
    await tx.update(voters).set({ missedWeeks: 0 }).where(eq(voters.id, voter.id));
    return ballot;
  });
}
```

```ts
// apps/vote/app/ballot/[poll]/[year]/[week]/actions.ts
"use server";
import { z } from "zod";
import { requireUserId } from "@rs/auth/server";
import { submitBallot } from "@rs/db/queries/ballots";
import { ratelimit } from "@/server/ratelimit";

const Input = z.object({
  pollWeekId: z.uuid(),
  entries: z.array(z.object({ rank: z.number().int().min(1).max(50), teamId: z.uuid() })).max(50),
  final: z.boolean(),
});

export async function saveBallot(raw: unknown) {
  const userId = await requireUserId();                // never accept a user id from the client
  const { success } = await ratelimit.limit(`ballot:${userId}`);
  if (!success) return { ok: false as const, error: "RATE_LIMITED" };
  const input = Input.parse(raw);
  const ballot = await submitBallot(userId, input);
  return { ok: true as const, ballotId: ballot.id, status: ballot.status };
}
```

Domain errors (`PollWeekClosedError`, `NotAVoterError`, `BallotInvalidError`) are mapped to user-facing messages in the action.

**Edge case: the "submitted at 11:59:59" race.** The `for update` row lock on `poll_weeks` serializes submits against the close job (which also takes `for update`). Whichever commits first wins; a submit that loses sees `status = 'closed'` and gets `POLL_WEEK_CLOSED`. No grace window; the countdown in the UI is honest.

### 13.8 Close and lock

```ts
// packages/db/src/queries/poll-jobs.ts
export async function closePollWeek(pollWeekId: string) {
  return adminDb.transaction(async (tx) => {
    const [week] = await tx.select().from(pollWeeks).where(and(eq(pollWeeks.id, pollWeekId), eq(pollWeeks.status, "open"))).for("update");
    if (!week) return null;                                            // already closed: idempotent
    const locked = await tx.update(ballots).set({ status: "locked", lockedAt: new Date() })
      .where(and(eq(ballots.pollWeekId, pollWeekId), eq(ballots.status, "submitted"))).returning({ id: ballots.id });
    await tx.update(pollWeeks).set({ status: "closed" }).where(eq(pollWeeks.id, pollWeekId));
    // missed-week counters for active voters without a locked ballot
    await tx.execute(sql`
      update voters v set missed_weeks = missed_weeks + 1
       where v.poll_id = ${week.pollId} and v.season_id = ${week.seasonId} and v.status = 'active'
         and not exists (select 1 from ballots b where b.voter_id = v.id and b.poll_week_id = ${pollWeekId} and b.status = 'locked')`);
    await tx.insert(pollAuditLog).values({ pollWeekId, action: "week.close", detail: { locked: locked.length } });
    return { locked: locked.length };
  });
}
```

Drafts that were never submitted do not count; they are kept for the voter's own history.

### 13.9 Tabulation

**Points**: rank `r` on a ballot earns `size + 1 - r` points (25 for 1st … 1 for 25th). First-place votes = count of ballots ranking the team 1st.

**Order**: points desc. **Ties in points** share the same rank (AP-style "T-12"). Display tie order by first-place votes desc, then alphabetical; rank numbers skip (two teams T-12 → next is 14). This mirrors common poll practice; document it on the methodology page.

**Others receiving votes**: every team with points > 0 not in the top `size`, listed by points desc. Ties at the cutoff: if teams tie for the 25th spot, include all tied teams as T-25 (the published list can exceed 25). Document the choice.

**Movement**: compare to the previous *published* week of the same poll and season (preseason for week 1). `movement = previous_rank - rank`. Unranked last week → `is_new = true`, display "NR" / "New". Dropped out = ranked last week and not ranked now.

**Record snapshot** (optional): staff may enter W-L per team in `poll_week_team_records` from `admin./ops/polls/{weekId}`; tabulation copies them into `poll_results.record_*`. If absent, the poll page hides the record column for that team. There is no `standings` or `games` table.

SQL variant (single statement, idempotent; kept in a custom migration for the optional pg_cron path and as an independent cross-check. The primary path is the TypeScript + Drizzle version further below):

```sql
create or replace function app.tabulate_poll_week(p_poll_week_id uuid) returns void
language plpgsql security definer set search_path = public, app as $$
declare v_size int; v_prev uuid; v_week poll_weeks%rowtype; v_hash text;
begin
  select * into v_week from poll_weeks where id = p_poll_week_id for update;
  if v_week.status not in ('closed','tabulated') then raise exception 'POLL_WEEK_NOT_CLOSED'; end if;
  select size into v_size from polls where id = v_week.poll_id;

  select id into v_prev from poll_weeks
   where poll_id = v_week.poll_id and season_id = v_week.season_id and status = 'published'
     and week_number < v_week.week_number
   order by week_number desc limit 1;

  delete from poll_results where poll_week_id = p_poll_week_id;

  with counted as (
    select be.team_id,
           sum(v_size + 1 - be.rank)::int as points,
           count(*) filter (where be.rank = 1)::int as fpv,
           count(*)::int as listed,
           min(be.rank) as hi, max(be.rank) as lo
      from ballots b join ballot_entries be on be.ballot_id = b.id
     where b.poll_week_id = p_poll_week_id and b.status = 'locked'
     group by be.team_id
  ), ranked as (
    select c.*, rank() over (order by points desc) as pts_rank from counted c
  ), cutoff as (
    select min(points) as min_pts from ranked where pts_rank <= v_size
  )
  insert into poll_results (poll_week_id, team_id, rank, points, first_place_votes, ballots_listed,
                            highest_rank, lowest_rank, previous_rank, movement, is_new)
  select p_poll_week_id, r.team_id,
         case when r.points >= (select min_pts from cutoff) then r.pts_rank end,
         r.points, r.fpv, r.listed, r.hi, r.lo,
         pr.rank,
         case when r.points >= (select min_pts from cutoff) and pr.rank is not null then pr.rank - r.pts_rank end,
         (r.points >= (select min_pts from cutoff) and pr.rank is null)
    from ranked r
    left join poll_results pr on pr.poll_week_id = v_prev and pr.team_id = r.team_id;

  -- record snapshot
  update poll_results res set record_wins = r.wins, record_losses = r.losses, record_ties = r.ties
    from poll_week_team_records r where r.team_id = res.team_id and r.poll_week_id = res.poll_week_id
     and res.poll_week_id = p_poll_week_id;

  select encode(digest(string_agg(b.id::text || ':' || be.rank || ':' || be.team_id::text, ',' order by b.id, be.rank), 'sha256'), 'hex')
    into v_hash
    from ballots b join ballot_entries be on be.ballot_id = b.id
   where b.poll_week_id = p_poll_week_id and b.status = 'locked';

  insert into poll_week_summaries (poll_week_id, ballots_counted, ballots_voided, dropped_out, computed_hash)
  values (p_poll_week_id,
          (select count(*) from ballots where poll_week_id = p_poll_week_id and status = 'locked'),
          (select count(*) from ballots where poll_week_id = p_poll_week_id and status = 'voided'),
          coalesce((select array_agg(pr.team_id) from poll_results pr
                     where pr.poll_week_id = v_prev and pr.rank is not null
                       and not exists (select 1 from poll_results cur where cur.poll_week_id = p_poll_week_id
                                        and cur.team_id = pr.team_id and cur.rank is not null)), '{}'),
          v_hash)
  on conflict (poll_week_id) do update set ballots_counted = excluded.ballots_counted,
     ballots_voided = excluded.ballots_voided, dropped_out = excluded.dropped_out, computed_hash = excluded.computed_hash;

  update poll_weeks set status = 'tabulated', tabulated_at = now() where id = p_poll_week_id;
  insert into poll_audit_log (poll_week_id, action, detail) values (p_poll_week_id, 'week.tabulate', jsonb_build_object('hash', v_hash));
end $$;
```

The same algorithm lives in TypeScript in `@rs/polls` (`tabulate(ballots, size)`). The TS version powers "what if" previews in the admin app and lets anyone verify a published poll from the CSV export.

```ts
// packages/polls/src/tabulate.ts
export type Ballot = { voterId: string; teamIds: string[] }; // index 0 = rank 1
export type Result = { teamId: string; rank: number | null; points: number; fpv: number; listed: number; hi: number; lo: number };

export function tabulate(ballots: Ballot[], size = 25): Result[] {
  const agg = new Map<string, { points: number; fpv: number; listed: number; hi: number; lo: number }>();
  for (const b of ballots) {
    if (b.teamIds.length !== size || new Set(b.teamIds).size !== size) throw new Error(`invalid ballot ${b.voterId}`);
    b.teamIds.forEach((teamId, i) => {
      const r = i + 1;
      const a = agg.get(teamId) ?? { points: 0, fpv: 0, listed: 0, hi: Infinity, lo: 0 };
      a.points += size + 1 - r;
      if (r === 1) a.fpv += 1;
      a.listed += 1;
      a.hi = Math.min(a.hi, r);
      a.lo = Math.max(a.lo, r);
      agg.set(teamId, a);
    });
  }
  const sorted = [...agg.entries()].sort((x, y) => y[1].points - x[1].points);
  // competition ranking (1,2,2,4)
  let lastPts = -1, lastRank = 0;
  const withRank = sorted.map(([teamId, a], i) => {
    const rank = a.points === lastPts ? lastRank : i + 1;
    lastPts = a.points; lastRank = rank;
    return { teamId, ...a, ptsRank: rank };
  });
  const cutoffPts = withRank.filter((r) => r.ptsRank <= size).at(-1)?.points ?? Infinity;
  return withRank.map(({ ptsRank, ...r }) => ({ ...r, rank: r.points >= cutoffPts ? ptsRank : null }));
}
```

**Primary path: TypeScript tabulation stored with Drizzle.** The poll tick runs the pure `tabulate()` from `@rs/polls` on the locked ballots and writes the results in one transaction. The same code powers admin "what if" previews and public verification from the CSV export, so there is exactly one implementation of the rules.

```ts
// packages/db/src/queries/poll-jobs.ts (continued)
import { createHash } from "node:crypto";
import { tabulate } from "@rs/polls";

export async function tabulateAndStore(pollWeekId: string) {
  return adminDb.transaction(async (tx) => {
    const [week] = await tx.select().from(pollWeeks).where(eq(pollWeeks.id, pollWeekId)).for("update");
    if (!week || !["closed", "tabulated"].includes(week.status)) throw new Error("POLL_WEEK_NOT_CLOSED");
    const [poll] = await tx.select().from(polls).where(eq(polls.id, week.pollId));

    const rows = await tx.select({ ballotId: ballots.id, voterId: ballots.voterId, rank: ballotEntries.rank, teamId: ballotEntries.teamId })
      .from(ballots).innerJoin(ballotEntries, eq(ballotEntries.ballotId, ballots.id))
      .where(and(eq(ballots.pollWeekId, pollWeekId), eq(ballots.status, "locked")))
      .orderBy(asc(ballots.id), asc(ballotEntries.rank));
    const byBallot = Map.groupBy(rows, (r) => r.ballotId);
    const input = [...byBallot.values()].map((es) => ({ voterId: es[0].voterId, teamIds: es.map((e) => e.teamId) }));
    const results = tabulate(input, poll.size);

    const [prevWeek] = await tx.select({ id: pollWeeks.id }).from(pollWeeks).where(and(
      eq(pollWeeks.pollId, week.pollId), eq(pollWeeks.seasonId, week.seasonId), eq(pollWeeks.status, "published"), lt(pollWeeks.weekNumber, week.weekNumber)))
      .orderBy(desc(pollWeeks.weekNumber)).limit(1);
    const prev = prevWeek ? await tx.select({ teamId: pollResults.teamId, rank: pollResults.rank }).from(pollResults).where(eq(pollResults.pollWeekId, prevWeek.id)) : [];
    const prevRank = new Map(prev.filter((p) => p.rank !== null).map((p) => [p.teamId, p.rank!]));

    await tx.delete(pollResults).where(eq(pollResults.pollWeekId, pollWeekId));
    if (results.length) await tx.insert(pollResults).values(results.map((r) => ({
      pollWeekId, teamId: r.teamId, rank: r.rank, points: r.points, firstPlaceVotes: r.fpv, ballotsListed: r.listed,
      highestRank: r.hi, lowestRank: r.lo, previousRank: prevRank.get(r.teamId) ?? null,
      movement: r.rank !== null && prevRank.has(r.teamId) ? prevRank.get(r.teamId)! - r.rank : null,
      isNew: r.rank !== null && !prevRank.has(r.teamId),
    })));
    // optional record snapshot from poll_week_team_records (same as SQL variant), then summary + reproducibility hash
    await tx.execute(sql`update poll_results res set record_wins = r.wins, record_losses = r.losses, record_ties = r.ties
      from poll_week_team_records r where r.team_id = res.team_id and r.poll_week_id = res.poll_week_id and res.poll_week_id = ${pollWeekId}`);
    const hash = createHash("sha256").update(rows.map((r) => `${r.ballotId}:${r.rank}:${r.teamId}`).join(",")).digest("hex");
    const ranked = new Set(results.filter((r) => r.rank !== null).map((r) => r.teamId));
    await tx.insert(pollWeekSummaries).values({
      pollWeekId, ballotsCounted: byBallot.size, computedHash: hash,
      droppedOut: [...prevRank.keys()].filter((t) => !ranked.has(t)),
    }).onConflictDoUpdate({ target: pollWeekSummaries.pollWeekId, set: { ballotsCounted: byBallot.size, computedHash: hash,
      droppedOut: [...prevRank.keys()].filter((t) => !ranked.has(t)) } });
    await tx.update(pollWeeks).set({ status: "tabulated", tabulatedAt: new Date() }).where(eq(pollWeeks.id, pollWeekId));
    await tx.insert(pollAuditLog).values({ pollWeekId, action: "week.tabulate", detail: { hash, ballots: byBallot.size } });
  });
}
```

A **property test** asserts that `tabulateAndStore` and the SQL variant produce identical `poll_results` on random ballots.

### 13.10 Publish

- `publish_at` scheduled; the poll tick (§13.14) runs `publishDueWeeks()` (Drizzle: `status='published'`, `published_at=now()`, audit row) and then:
  1. Calls `revalidateTag('poll:cfb-fcs')`, `revalidateTag('poll:cfb-fcs:2026')`, `revalidateTag('poll:cfb-fcs:2026:7')`, and team tags for every ranked team (`team:<id>:rankings`).
  2. Generates OG images for the poll page and for each team's "Ranked No. X" share card.
  3. Sends the newsletter (Resend broadcast to `poll:<slug>` segment) and push to topic subscribers.
  4. Optionally creates a Sanity `pollRelease` draft prefilled with movement facts for the writer to add commentary.
- **Embargo**: until published, results are visible only in the admin app (RLS + server checks). Voters can't see aggregate results early.

### 13.11 Transparency pages

| Page | Route | Content |
|---|---|---|
| Poll week | `/college-football/rankings/fcs/2026/week-7` (current: `/college-football/rankings/fcs`) | Rank, team, record, points, first-place votes, previous rank, movement arrow, others receiving votes, dropped out, ballots counted, published time |
| Voter panel (roster published by admins each season) | `/college-football/rankings/fcs/voters` (archive `/voters/2026`) | Voter names, outlets, bios, disclosed conflicts, ballots submitted this season |
| Voter ballot | `/college-football/rankings/fcs/2026/week-7/ballots/{voter}` | That voter's 1–25 with comments, deviation from consensus per team |
| All ballots grid | `/college-football/rankings/fcs/2026/week-7/ballots` | Matrix of voters × ranks; filter by team ("who ranked Montana State where?") |
| Team poll history | `/teams/montana-state-bobcats/football/rankings` | Line chart of rank by week across seasons |
| Methodology | `/college-football/rankings/methodology` | Points, ties, eligibility, voter rules, schedule, code of conduct |
| Data export | `/api/rankings/cfb/fcs/2026/week-7.csv` | Ballots CSV (voter, rank, team) + results CSV + hash, for independent verification |

**Outlier highlighting**: per-voter deviation = mean absolute difference between voter rank and consensus rank for teams on both lists; highlight teams a voter ranked ≥ 8 spots from consensus. This is a transparency feature, not a punitive one.

### 13.12 Audit

Every state change and every ballot save goes to `poll_audit_log` (who, what, when, hashed IP). Admin actions require a reason string (void, reopen, extend, unpublish). The admin app shows a per-week timeline. Audit rows are append-only (no update/delete grants; a trigger raises on update/delete).

### 13.13 Anti-abuse

| Threat | Mitigation |
|---|---|
| Account takeover of a voter | Require MFA for voters (Clerk), notify voter by email on every submit |
| Unauthorized voters | No public application path; invites are admin-issued, bound to a verified email, signed, single-use, expiring (14 days) and revocable; season-scoped membership |
| Forwarded or leaked invite link | Email binding (verified Clerk email must match), single-use atomic acceptance, resend rotates the token, admin sees who accepted and when |
| Sock puppets / coordinated ballots | Flag ballots with identical top 25s or same fingerprint across voters; review queue |
| Troll ballots | Soft-validation warnings, outlier report before publish, admin void with reason (published) |
| Conflict of interest | Required disclosures shown publicly next to ballot; optional rule to forbid ranking own employer |
| Script abuse on endpoints | Rate limits on ballot saves and invite acceptance, CSRF-safe server actions, signature check before any DB work on invite links |
| Insider early leak | Results embargoed by RLS; admin view access logged |
| Post-close edits | Database lock in function + `ballots.status='locked'`; any reopen is audited and displayed on the poll page ("window extended 30 min due to late game") |

### 13.14 Jobs and schedules

A single **poll tick** job runs every minute and is idempotent: it opens due weeks, closes due weeks, tabulates closed weeks and publishes due weeks, all through the Drizzle functions above. Running it twice does nothing extra because each step is guarded by status and row locks.

| Job | Schedule | Runs where | Action |
|---|---|---|---|
| `poll-tick` | every minute | Vercel Cron → `/api/jobs/poll-tick` (bearer `CRON_SECRET`) | `openDueWeeks()`, `closePollWeek()` for due weeks, `tabulateAndStore()` for closed weeks, `publishDueWeeks()` then revalidate tags, OG images, notifications |
| `poll-remind` | hourly | Vercel Cron | Email/push voters without a submitted ballot at T-12 h and T-2 h |
| `invite-expire` | nightly | Vercel Cron | Mark pending invites past `expires_at` as `expired` |
| `voter-reconcile` | nightly | Vercel Cron | Sync `voters` ↔ Clerk roles drift |
| `voter-missed` | inside close | | Increments missed counters; queues warnings at 2 and roster review at 3 |

```ts
// apps/admin/app/api/cron/poll-tick/route.ts   (admin app owns poll operations)
import { safeCompare } from "@/lib/safe-compare";
import { openDueWeeks, closeDueWeeks, tabulateClosedWeeks, publishDueWeeks } from "@rs/db/queries/poll-jobs";
import { afterPublish } from "@/server/poll-publish";   // revalidate web tags via a signed call, OG, Resend, push
import * as Sentry from "@sentry/nextjs";

export async function GET(req: Request) {
  if (!safeCompare(req.headers.get("authorization") ?? "", `Bearer ${process.env.CRON_SECRET}`)) return new Response("unauthorized", { status: 401 });
  return Sentry.withMonitor("poll-tick", async () => {
    const opened = await openDueWeeks();
    const closed = await closeDueWeeks();
    const tabulated = await tabulateClosedWeeks();
    const published = await publishDueWeeks();
    for (const w of published) await afterPublish(w);
    return Response.json({ opened, closed, tabulated, published: published.length });
  });
}
```

Because `apps/admin` and `apps/web` are separate deployments, `afterPublish` calls a bearer-protected `POST /api/revalidate/tags` on `apps/web` with the list of tags to expire.

**Alternative:** if you prefer in-database scheduling, `pg_cron` can call the same endpoint through `pg_net` (with the bearer token read from Supabase Vault), or call SQL versions of open/close (the SQL tabulation function above is kept for this path and for cross-checking).

### 13.15 Poll page component sketch

```tsx
// apps/web/src/routes/rankings.tsx (pollWeek factory; stub at app/(site)/college-football/rankings/[division]/[year]/[week]/page.tsx)
import { cacheLife, cacheTag } from "next/cache";
import { getPollWeek } from "@rs/db/queries/polls";
import { pollSlugFor, parseWeekSegment } from "@rs/seo/urls";
import { PollTable } from "@rs/ui/components/poll-table";
import { pollTags } from "@rs/db/cache-tags";

export default async function Page({ params }: { params: Promise<{ sport: string; division: string; year: string; week: string }> }) {
  const p = await params;
  const data = await loadPoll(p.sport, p.division, Number(p.year), p.week);
  return <PollTable data={data} />;
}

async function loadPoll(sport: string, division: string, year: number, week: string) {
  "use cache";
  cacheLife("days");
  const tags = pollTags({ sport, division, year, week });
  tags.forEach((t) => cacheTag(t));
  return getPollWeek({ pollSlug: pollSlugFor(sport, division), year, weekNumber: parseWeekSegment(week) }); // 'week-7' → 7, 'preseason' → 0
}
```

URLs follow §17: the current poll lives at `/{sport}/rankings/{division}` and each archived week at `/{sport}/rankings/{division}/{year}/week-N` (`preseason`, `final`). New divisions and sports need no new routes, only new `polls` rows, e.g. `/college-football/rankings/d2`, `/mens-college-basketball/rankings/d1`, `/womens-college-basketball/rankings/d1`.

---

## 14. Bracket Challenge: full design

### 14.1 Product scope

| Event | Format code | Teams | Games | Rounds | Byes | First available |
|---|---|---|---|---|---|---|
| FCS Championship (division **`fcs`**) | `fcs24` | 24 | 23 | 5 | Seeds 1–8 skip round 1 | P0 |
| College Football Playoff (division **`fbs`**) | `cfp12` | 12 | 11 | 4 | Seeds 1–4 skip round 1 | P1 |
| NCAA Division II Football (division **`d2`**) | `d2_28` | 28 | 27 | 5 | No. 1 seed in each of 4 super regions | P1 |
| NCAA Division III Football (division **`d3`**) | `d3_32` | 32 | 31 | 5 | None | P1 |
| NCAA Men's / Women's Basketball | `ncaab68` | 68 | 67 | 7 (incl. First Four) | None (First Four play-ins) | P2 |
| Conference tournaments (optional) | `custom_N` | Varies | | | Configurable | P3 |

> Field sizes and seeding rules are set by the NCAA and the CFP and change from time to time. Verify every format against the official selection announcement each season before opening an event; formats are versioned so an old season's brackets remain correct after a rule change.

Feature list:

- Pick every game in the bracket before the lock; byes auto-advance.
- Multiple named entries per user per event (configurable cap, default 1 for the national leaderboard; groups can allow more).
- Groups (private leagues) with invite links/codes; public groups; one "Redshirt Sports National" system group per event.
- Leaderboards: national, per group, friends (users you share any group with), per school fan base (optional: "Montana State fans" based on favorite team).
- Possible points remaining and elimination status, updated when staff enter results.
- Shareable bracket images (OG) and a printable view.
- **One event per division per season** (`unique (sport, division, season_id)`), URL `/college-football/bracket-challenge/{division}/{year}`.
- Sponsored brackets: sponsor branding on landing page, group, and share images; disclosure.
- No entry fees and no prizes in the free game unless legal review approves a sweepstakes structure (see §20.5).

### 14.2 Format registry (pure TypeScript)

Each format is defined as a list of **slots** (team positions known before the event) and **games** (each side is fed by a slot or by the winner of an earlier game). Everything else (rendering, validation, scoring) is derived.

```ts
// packages/brackets/src/types.ts
export type Side = { slot: string } | { winnerOf: string };
export type GameDef = { code: string; round: number; region?: string; top: Side; bottom: Side; label?: string };
export type FormatDef = {
  code: string;
  version: number;
  name: string;
  rounds: { round: number; name: string; short: string }[];
  slots: { code: string; seed?: number; region?: string; label: string }[];
  games: GameDef[];
  finalGame: string;
};
```

#### FCS 24 (`fcs24`)

Structure: 16 unseeded teams play 8 first-round games; the 8 seeds host second-round games against those winners; then quarterfinals, semifinals, final. The committee pairs unseeded first-round games partly on geography, so the format uses **slot codes for unseeded teams by bracket position**, not by seed.

```ts
// packages/brackets/src/formats/fcs24.ts
import type { FormatDef, GameDef } from "../types";

// Bracket order of seeds top to bottom (1 v 8 side, 4 v 5, 3 v 6, 2 v 7)
const SEED_ORDER = [1, 8, 4, 5, 3, 6, 2, 7] as const;

const slots = [
  ...SEED_ORDER.map((s) => ({ code: `S${s}`, seed: s, label: `No. ${s} seed` })),
  ...Array.from({ length: 16 }, (_, i) => ({ code: `U${i + 1}`, label: `First round team ${i + 1}` })),
];

const r1: GameDef[] = Array.from({ length: 8 }, (_, i) => ({
  code: `R1G${i + 1}`, round: 1, top: { slot: `U${2 * i + 1}` }, bottom: { slot: `U${2 * i + 2}` },
}));
const r2: GameDef[] = SEED_ORDER.map((seed, i) => ({
  code: `R2G${i + 1}`, round: 2, top: { slot: `S${seed}` }, bottom: { winnerOf: `R1G${i + 1}` },
}));
const qf: GameDef[] = Array.from({ length: 4 }, (_, i) => ({
  code: `QF${i + 1}`, round: 3, top: { winnerOf: `R2G${2 * i + 1}` }, bottom: { winnerOf: `R2G${2 * i + 2}` },
}));
const sf: GameDef[] = [
  { code: "SF1", round: 4, top: { winnerOf: "QF1" }, bottom: { winnerOf: "QF2" } },
  { code: "SF2", round: 4, top: { winnerOf: "QF3" }, bottom: { winnerOf: "QF4" } },
];
const final: GameDef = { code: "F", round: 5, top: { winnerOf: "SF1" }, bottom: { winnerOf: "SF2" }, label: "FCS Championship" };

export const fcs24: FormatDef = {
  code: "fcs24", version: 1, name: "FCS Championship (24 teams)",
  rounds: [
    { round: 1, name: "First Round", short: "R1" },
    { round: 2, name: "Second Round", short: "R2" },
    { round: 3, name: "Quarterfinals", short: "QF" },
    { round: 4, name: "Semifinals", short: "SF" },
    { round: 5, name: "Championship", short: "F" },
  ],
  slots, games: [...r1, ...r2, ...qf, ...sf, final], finalGame: "F",
};
```

> The exact mapping of which first-round game feeds which seed is announced on selection day. The admin "Set field" screen therefore assigns teams to `U1..U16` in the order that makes `R1G(i)` feed `R2G(i)` as announced, rather than assuming a fixed pairing.

#### CFP 12 (`cfp12`)

Seeds 1–4 get byes; first round is 5v12, 6v11, 7v10, 8v9 (higher seed hosts); quarterfinals pair 1 with the 8/9 winner, 2 with 7/10, 3 with 6/11, 4 with 5/12.

```ts
// packages/brackets/src/formats/cfp12.ts
const slots = Array.from({ length: 12 }, (_, i) => ({ code: `S${i + 1}`, seed: i + 1, label: `No. ${i + 1} seed` }));
const R1 = [[8, 9], [5, 12], [6, 11], [7, 10]] as const;    // bracket order: feeds QF vs 1, 4, 3, 2
const QF_TOP = [1, 4, 3, 2] as const;
export const cfp12: FormatDef = {
  code: "cfp12", version: 1, name: "College Football Playoff (12 teams)",
  rounds: [
    { round: 1, name: "First Round", short: "R1" },
    { round: 2, name: "Quarterfinals", short: "QF" },
    { round: 3, name: "Semifinals", short: "SF" },
    { round: 4, name: "National Championship", short: "F" },
  ],
  slots,
  games: [
    ...R1.map(([a, b], i) => ({ code: `R1G${i + 1}`, round: 1, top: { slot: `S${a}` }, bottom: { slot: `S${b}` } })),
    ...QF_TOP.map((s, i) => ({ code: `QF${i + 1}`, round: 2, top: { slot: `S${s}` }, bottom: { winnerOf: `R1G${i + 1}` } })),
    { code: "SF1", round: 3, top: { winnerOf: "QF1" }, bottom: { winnerOf: "QF2" } },
    { code: "SF2", round: 3, top: { winnerOf: "QF3" }, bottom: { winnerOf: "QF4" } },
    { code: "F", round: 4, top: { winnerOf: "SF1" }, bottom: { winnerOf: "SF2" } },
  ],
  finalGame: "F",
};
```

Quarterfinal and semifinal games are assigned to named bowls; store the bowl name in `bracket_games.label` per event (it rotates each year) instead of in the format.

#### D-II 28 (`d2_28`)

Four super regions of seven teams. Seed 1 in each region has a bye; first round is 2v7, 3v6, 4v5; second round is 1 vs 4/5 winner and 2/7 winner vs 3/6 winner; third round is the regional final (national quarterfinal); then national semifinals and final. The pairing of regions in the semifinals is announced; store it per event.

```ts
// packages/brackets/src/formats/d2_28.ts
const REGIONS = ["1", "2", "3", "4"] as const;
export const d2_28: FormatDef = {
  code: "d2_28", version: 1, name: "NCAA Division II Football (28 teams)",
  rounds: [
    { round: 1, name: "First Round", short: "R1" },
    { round: 2, name: "Second Round", short: "R2" },
    { round: 3, name: "Quarterfinals", short: "QF" },
    { round: 4, name: "Semifinals", short: "SF" },
    { round: 5, name: "Championship", short: "F" },
  ],
  slots: REGIONS.flatMap((r) => [1, 2, 3, 4, 5, 6, 7].map((s) => ({ code: `R${r}S${s}`, seed: s, region: r, label: `Super Region ${r} No. ${s}` }))),
  games: [
    ...REGIONS.flatMap((r) => [
      { code: `R${r}-R1A`, round: 1, region: r, top: { slot: `R${r}S4` }, bottom: { slot: `R${r}S5` } },
      { code: `R${r}-R1B`, round: 1, region: r, top: { slot: `R${r}S3` }, bottom: { slot: `R${r}S6` } },
      { code: `R${r}-R1C`, round: 1, region: r, top: { slot: `R${r}S2` }, bottom: { slot: `R${r}S7` } },
      { code: `R${r}-R2A`, round: 2, region: r, top: { slot: `R${r}S1` }, bottom: { winnerOf: `R${r}-R1A` } },
      { code: `R${r}-R2B`, round: 2, region: r, top: { winnerOf: `R${r}-R1C` }, bottom: { winnerOf: `R${r}-R1B` } },
      { code: `R${r}-QF`, round: 3, region: r, top: { winnerOf: `R${r}-R2A` }, bottom: { winnerOf: `R${r}-R2B` } },
    ]),
    { code: "SF1", round: 4, top: { winnerOf: "R1-QF" }, bottom: { winnerOf: "R2-QF" } },
    { code: "SF2", round: 4, top: { winnerOf: "R3-QF" }, bottom: { winnerOf: "R4-QF" } },
    { code: "F", round: 5, top: { winnerOf: "SF1" }, bottom: { winnerOf: "SF2" } },
  ],
  finalGame: "F",
};
```

#### D-III 32 (`d3_32`)

A plain 32-team single-elimination bracket in four 8-team quadrants, no byes; the NCAA builds pairings largely by geography, so slots are positional (`P1..P32`) like the FCS unseeded slots. Generated by a helper `singleElimination({ code, size: 32, regions: 4 })` that also powers conference tournaments and the basketball 64-team core.

#### NCAA basketball 68 (`ncaab68`)

Four regions of 16 seeds plus a First Four (four play-in games: two among 16-seeds, two among last at-large teams, whose seeds vary by year). Implement as `singleElimination(64)` plus four `FF` games whose winners feed specific `slot`s; the First Four slot targets are set per event on selection day. Standard 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15 order inside each region. Many bracket games let users skip picking First Four games (the slot is "winner of FF1" and either team's advancement counts); offer that as the default.

### 14.3 Resolution and validation

```ts
// packages/brackets/src/resolve.ts
import type { FormatDef, Side } from "./types";

export type Field = Record<string, string | null>;          // slot code -> teamId
export type Picks = Record<string, string>;                  // game code -> picked teamId

/** Teams that could appear on a side given the field and the user's picks (for UI and validation). */
export function sideTeam(fmt: FormatDef, side: Side, field: Field, picks: Picks): string | null {
  if ("slot" in side) return field[side.slot] ?? null;
  return picks[side.winnerOf] ?? null;
}

export function validatePicks(fmt: FormatDef, field: Field, picks: Picks): { ok: boolean; errors: string[]; complete: boolean } {
  const errors: string[] = [];
  for (const g of fmt.games) {
    const pick = picks[g.code];
    if (!pick) continue;
    const top = sideTeam(fmt, g.top, field, picks);
    const bottom = sideTeam(fmt, g.bottom, field, picks);
    if (pick !== top && pick !== bottom) errors.push(`${g.code}: pick is not a participant`);
  }
  const unknown = Object.keys(picks).filter((c) => !fmt.games.some((g) => g.code === c));
  if (unknown.length) errors.push(`unknown games: ${unknown.join(",")}`);
  const complete = errors.length === 0 && fmt.games.every((g) => picks[g.code]);
  return { ok: errors.length === 0, errors, complete };
}

/** When a user changes an earlier pick, clear every downstream pick that depended on the old team. */
export function cascadeClear(fmt: FormatDef, picks: Picks, changedGame: string, oldTeam: string): Picks {
  const next = { ...picks };
  let frontier = [changedGame];
  while (frontier.length) {
    const g = frontier.pop()!;
    for (const d of fmt.games.filter((x) => ("winnerOf" in x.top && x.top.winnerOf === g) || ("winnerOf" in x.bottom && x.bottom.winnerOf === g))) {
      if (next[d.code] === oldTeam) { delete next[d.code]; frontier.push(d.code); }
    }
  }
  return next;
}
```

Server-side, the same `validatePicks` runs in the server action before calling the SQL save function; SQL additionally enforces lock time and ownership. Byes need no special code: a seed in a bye is a `slot` side of a round-2 game.

### 14.4 Lock rules

| Mode | Lock behavior | Use |
|---|---|---|
| `full` (only mode in v1.2) | All picks lock at `lock_at` = first kickoff of round 1. After lock: no new entries, no edits, no joining groups with new entries. | Standard bracket challenge |

Per-round locks and Second Chance brackets are **dropped**: with one event per division per season, a Second Chance would need a second event and break the URL key. Revisit only with a `/second-chance` sub-route on the same event.

`lock_at` is **entered by staff** from the official kickoff time when the field is set (there is no feed). The admin UI shows it in ET and the user's zone, and warns if any `bracket_games.starts_at` the admin typed is earlier than `lock_at`.

Saving an entry is a Drizzle transaction. Pick validity (participants, cascade) is checked with the pure engine **before** the transaction; the lock and ownership are checked **inside** it.

```ts
// packages/db/src/queries/brackets.ts (continued)
import { and, count, eq, sql } from "drizzle-orm";
import { adminDb } from "../client";
import { bracketAuditLog, bracketEntries, bracketEvents, bracketFormats, bracketGroupMembers, bracketGroups, bracketPicks, bracketSlots } from "../schema";
import { BracketLockedError, EntryLimitError, EntryNotFoundError } from "../errors";
import { getFormat, validatePicks } from "@rs/brackets";

export async function saveBracketEntry(userId: string, input: {
  eventId: string; entryId?: string; name: string; picks: Record<string, string>; tiebreaker: number | null;
}) {
  return adminDb.transaction(async (tx) => {
    const [event] = await tx.select().from(bracketEvents).where(eq(bracketEvents.id, input.eventId)).for("share");
    if (!event || event.status !== "open" || new Date() >= event.lockAt) throw new BracketLockedError();

    const fmt = getFormat(event.formatCode);
    const slots = await tx.select().from(bracketSlots).where(eq(bracketSlots.eventId, event.id));
    const field = Object.fromEntries(slots.map((s) => [s.slotCode, s.teamId]));
    const v = validatePicks(fmt, field, input.picks);
    if (!v.ok) throw new Error(`INVALID_PICKS: ${v.errors.join("; ")}`);

    let entryId = input.entryId;
    if (!entryId) {
      const [{ n }] = await tx.select({ n: count() }).from(bracketEntries)
        .where(and(eq(bracketEntries.eventId, event.id), eq(bracketEntries.userId, userId)));
      if (n >= event.maxEntriesPerUser) throw new EntryLimitError();
      const [created] = await tx.insert(bracketEntries).values({ eventId: event.id, userId, name: input.name, tiebreakerValue: input.tiebreaker })
        .returning({ id: bracketEntries.id });
      entryId = created.id;
      // auto-join the national system group
      const [national] = await tx.select({ id: bracketGroups.id }).from(bracketGroups)
        .where(and(eq(bracketGroups.eventId, event.id), eq(bracketGroups.visibility, "system")));
      if (national) await tx.insert(bracketGroupMembers).values({ groupId: national.id, entryId, userId }).onConflictDoNothing();
    } else {
      const updated = await tx.update(bracketEntries).set({ name: input.name, tiebreakerValue: input.tiebreaker })
        .where(and(eq(bracketEntries.id, entryId), eq(bracketEntries.userId, userId), eq(bracketEntries.eventId, event.id)))
        .returning({ id: bracketEntries.id });
      if (!updated.length) throw new EntryNotFoundError();
    }

    await tx.delete(bracketPicks).where(eq(bracketPicks.entryId, entryId));
    const pickRows = Object.entries(input.picks).map(([gameCode, pickedTeamId]) => ({ entryId: entryId!, gameCode, pickedTeamId }));
    if (pickRows.length) await tx.insert(bracketPicks).values(pickRows);

    const complete = v.complete && input.tiebreaker !== null;
    await tx.update(bracketEntries).set({ status: complete ? "complete" : "incomplete", submittedAt: new Date() })
      .where(eq(bracketEntries.id, entryId));
    await tx.insert(bracketAuditLog).values({ eventId: event.id, entryId, actorId: userId, action: "entry.save", detail: { picks: pickRows.length } });
    return { entryId, complete };
  });
}
```

`for("share")` on the event row lets many saves run concurrently while the lock job (which takes `for update` to flip the status to `locked`) waits for in-flight saves and blocks new ones. Server time is authoritative.

At lock, a job sets `bracket_events.status='locked'` and `bracket_entries.status='locked'` for complete entries. **Incomplete entries at lock** are kept and scored on the picks they have (an unpicked game earns 0); show "Incomplete" on leaderboards. (Alternative: exclude them from the national board. Pick one and state it in the rules.)

### 14.5 Scoring systems

All scoring is a pure function `score(format, results, picks, config)`; configs are stored per event.

| System | Rule | FCS 24 max | CFP 12 max | D-II 28 max | D-III 32 max |
|---|---|---|---|---|---|
| `standard` (doubling) | Round points 10 / 20 / 40 / 80 / 160 | 8×10 + 8×20 + 4×40 + 2×80 + 160 = **720** | (4 rounds) 4×10 + 4×20 + 2×40 + 80 = 280 → use `balanced` below | 12×10 + 8×20 + 4×40 + 2×80 + 160 = **760** | 16×10 + 8×20 + 4×40 + 2×80 + 160 = **800** |
| `balanced` (each round worth the same total) | Points per game = round_total / games_in_round | e.g. 160 per round: 20 / 20 / 40 / 80 / 160 = **800** | 160 per round: 40 / 40 / 80 / 160 = **640** | 240 per round: 20 / 30 / 60 / 120 / 240 = **1,200** | 160 per round: 10 / 20 / 40 / 80 / 160 = **800** |
| `seed_bonus` | Standard + (winner seed − loser seed) when an underdog you picked wins, capped | Varies | Varies | Varies | n/a (unseeded) |
| `upset_multiplier` | Round points × winner seed (ESPN-style "seed multiplier" variant) | Seeded games only | Varies | Varies | n/a |

Recommendation: **`standard` for FCS 24, D-II 28 and D-III 32; `balanced` 40/40/80/160 for CFP 12** so the first round isn't nearly worthless.

```ts
// packages/brackets/src/scoring.ts
import type { FormatDef } from "./types";
export type ScoringConfig = { roundPoints: number[]; seedBonus?: { cap: number } };
export type Results = Record<string, { winner: string; loser: string } | undefined>;

export function scoreEntry(fmt: FormatDef, cfg: ScoringConfig, results: Results, picks: Record<string, string>, seeds: Record<string, number>) {
  let score = 0, correct = 0, maxPossible = 0;
  const roundPoints = new Array(fmt.rounds.length).fill(0);
  const eliminated = new Set(Object.values(results).filter(Boolean).map((r) => r!.loser));
  for (const g of fmt.games) {
    const pts = cfg.roundPoints[g.round - 1];
    const res = results[g.code];
    const pick = picks[g.code];
    if (!pick) continue;
    if (res) {
      if (res.winner === pick) {
        let p = pts;
        if (cfg.seedBonus && seeds[res.winner] && seeds[res.loser] && seeds[res.winner] > seeds[res.loser]) {
          p += Math.min(cfg.seedBonus.cap, seeds[res.winner] - seeds[res.loser]);
        }
        score += p; correct += 1; roundPoints[g.round - 1] += p;
      }
    } else if (!eliminated.has(pick)) {
      maxPossible += pts;
    }
  }
  return { score, correct, roundPoints, maxPossible: score + maxPossible };
}
```

### 14.6 Tiebreakers (strict, deterministic order)

1. Total score (desc).
2. Points in the latest round, then each earlier round, compared backwards (desc). Rewards getting late rounds right.
3. Championship-game tiebreaker: absolute difference between predicted **combined total points** in the final and the actual total (asc). Collected at entry time (0–200).
4. Correct champion pick (true first).
5. Earliest `submitted_at` of the final version (asc).
6. Entry `id` (asc) as a last resort so ordering is always total.

Ties on rank display: entries tied on (1) share a displayed rank only until the final is complete; after that, the full tiebreak order produces unique ranks. Show the tiebreak reason in a tooltip ("Tied on points; ahead on title-game total").

### 14.7 Groups and invites

- Create group: name, visibility (private by default), optional password for public groups, max members, allow multiple entries per user.
- **Invite code**: 8 characters from a Crockford base32 alphabet (no I, L, O, U), generated server-side with `crypto.getRandomValues`, unique index, rotatable by the manager. Invite link: `/college-football/bracket-challenge/fcs/2026/join/{code}` (on `www`).
- Join flow: open link → sign in if needed → choose which of your entries to add (or create one) → joined. Rate limit join attempts per user and per IP to make code guessing infeasible.
- Manager tools (before lock): rename, rotate code, remove member, set message; after lock: view only. Transfer manager on manager account deletion.
- **Entries hidden until lock** to prevent copying (other members see names and "picks hidden until kickoff").
- System groups: "Redshirt Sports National" per event; optional fan-base groups auto-created per school (`Montana State Fans`) that users can join from the team hub.

### 14.8 Leaderboards with materialized views

Scores are written to `bracket_entries` by the scoring job (one UPDATE per event recompute). Group ranks are computed by a materialized view refreshed after each scoring run:

```sql
create materialized view bracket_group_standings as
select m.group_id,
       e.id as entry_id,
       e.user_id,
       e.name,
       e.score, e.max_possible, e.correct_picks, e.round_points,
       e.tiebreaker_value,
       row_number() over (
         partition by m.group_id
         order by e.score desc,
                  e.round_points[5] desc nulls last, e.round_points[4] desc nulls last,
                  e.round_points[3] desc nulls last, e.round_points[2] desc nulls last,
                  abs(coalesce(e.tiebreaker_value, 999) - coalesce(ev.title_total, 0)) asc,
                  e.submitted_at asc, e.id asc
       ) as position,
       rank() over (partition by m.group_id order by e.score desc) as score_rank,
       count(*) over (partition by m.group_id) as group_size
  from bracket_group_members m
  join bracket_entries e on e.id = m.entry_id
  join (select be.id as event_id,
               (select home_score + away_score from bracket_games bg
                 where bg.event_id = be.id and bg.game_code = 'F' and bg.status = 'final') as title_total
          from bracket_events be) ev on ev.event_id = e.event_id
 where e.status <> 'disqualified';

create unique index on bracket_group_standings (group_id, entry_id);
create index on bracket_group_standings (group_id, position);

-- after each scoring run:
refresh materialized view concurrently bracket_group_standings;
```

The view lives in a custom drizzle-kit migration; Drizzle reads it through the typed `bracketGroupStandings` declaration (`pgMaterializedView(...).existing()`, §10.12), and the scoring job refreshes it with ``adminDb.execute(sql`refresh materialized view concurrently bracket_group_standings`)``.

Notes:
- The `round_points[n]` indices should be generated per format (CFP has 4 rounds); the scoring job writes `round_points` padded to 7 elements so the view works for every format.
- The national group can have a very large number of rows; `refresh concurrently` rewrites the whole view. When one event's entry count grows large, switch the national board to a **dedicated table** updated by the scoring job with a single `insert … on conflict update` computed by window functions per event, and keep the MV for small groups. Also cache leaderboard pages (`cacheTag('bracket:<event>:leaderboard')`) for 30–60 s.
- Percentile ("You're in the 92nd percentile") = `1 - position / group_size` from the national board.
- Pages read standings with RLS: a materialized view does not support RLS, so expose it through a `security_invoker` function or read it server-side only (recommended).

### 14.9 Manual results and rescoring (no live feed)

Bracket results are **entered by staff** in `apps/admin`. There is no sports-data poller, no linking of `bracket_games` to an external game id, and no automatic score updates.

```mermaid
sequenceDiagram
  participant SA as Staff (admin.)
  participant A as apps/admin
  participant DB as Postgres (Drizzle)
  participant W as apps/web revalidate
  SA->>A: Set winner for game R1G3 (+ optional scores)
  A->>DB: setBracketGameResult() TX: validate participants, set final, rescore all entries, refresh MV
  A->>W: POST /api/revalidate/tags (bearer)
  W-->>W: expire bracket:<sport>:<division>:<year>:*
  Note over A: Optional: Broadcast "scored" for open group pages
```

```ts
// packages/db/src/queries/brackets.ts
import { and, eq, sql } from "drizzle-orm";
import { adminDb } from "../client";
import { bracketAuditLog, bracketEntries, bracketEvents, bracketGames, bracketPicks, bracketSlots } from "../schema";
import { getFormat, scoreEntry, sideTeam, type Results } from "@rs/brackets";
import type { Tx } from "../client";
import { BracketInvalidResultError } from "../errors";

export async function setBracketGameResult(staffId: string, input: {
  eventId: string; gameCode: string; winnerTeamId: string; loserTeamId?: string;
  homeScore?: number | null; awayScore?: number | null; clear?: boolean;
}) {
  return adminDb.transaction(async (tx) => {
    const [event] = await tx.select().from(bracketEvents).where(eq(bracketEvents.id, input.eventId)).for("update");
    // Results can only be entered after the pick lock; picks and results never overlap.
    if (!event || new Date() < event.lockAt || event.status === "archived") throw new Error("BRACKET_NOT_LOCKED");

    const fmt = getFormat(event.formatCode);
    const game = fmt.games.find((g) => g.code === input.gameCode);
    if (!game) throw new BracketInvalidResultError("unknown game");

    const slots = await tx.select().from(bracketSlots).where(eq(bracketSlots.eventId, event.id));
    const field = Object.fromEntries(slots.map((s) => [s.slotCode, s.teamId]));
    // Build "results so far" + treat earlier winners as resolved picks for side resolution
    const prior = await tx.select().from(bracketGames).where(eq(bracketGames.eventId, event.id));
    const picksProxy: Record<string, string> = {};
    for (const g of prior) if (g.winnerTeamId && g.gameCode !== input.gameCode) picksProxy[g.gameCode] = g.winnerTeamId;

    if (input.clear) {
      await tx.update(bracketGames).set({
        winnerTeamId: null, loserTeamId: null, homeScore: null, awayScore: null, status: "pending",
        resultSetBy: staffId, resultSetAt: new Date(),
      }).where(and(eq(bracketGames.eventId, event.id), eq(bracketGames.gameCode, input.gameCode)));
    } else {
      const top = sideTeam(fmt, game.top, field, picksProxy);
      const bottom = sideTeam(fmt, game.bottom, field, picksProxy);
      if (input.winnerTeamId !== top && input.winnerTeamId !== bottom) throw new BracketInvalidResultError("winner not a participant");
      const loser = input.loserTeamId ?? (input.winnerTeamId === top ? bottom : top);
      await tx.insert(bracketGames).values({
        eventId: event.id, gameCode: input.gameCode, round: game.round, winnerTeamId: input.winnerTeamId, loserTeamId: loser ?? null,
        homeScore: input.homeScore ?? null, awayScore: input.awayScore ?? null, status: "final",
        resultSetBy: staffId, resultSetAt: new Date(),
      }).onConflictDoUpdate({
        target: [bracketGames.eventId, bracketGames.gameCode],
        set: {
          winnerTeamId: input.winnerTeamId, loserTeamId: loser ?? null, homeScore: input.homeScore ?? null, awayScore: input.awayScore ?? null,
          status: "final", resultSetBy: staffId, resultSetAt: new Date(),
        },
      });
    }

    await rescoreEventTx(tx, event);
    await tx.insert(bracketAuditLog).values({
      eventId: event.id, actorId: staffId, action: input.clear ? "result.clear" : "result.set",
      detail: { gameCode: input.gameCode, winnerTeamId: input.winnerTeamId ?? null },
    });
    if (event.status === "locked") await tx.update(bracketEvents).set({ status: "in_progress" }).where(eq(bracketEvents.id, event.id));
  });
}

async function rescoreEventTx(tx: Tx, event: typeof bracketEvents.$inferSelect) {
  const fmt = getFormat(event.formatCode);
  const cfg = event.scoringConfig as { roundPoints: number[] };
  const games = await tx.select().from(bracketGames).where(eq(bracketGames.eventId, event.id));
  const results: Results = {};
  for (const g of games) if (g.status === "final" && g.winnerTeamId && g.loserTeamId) {
    results[g.gameCode] = { winner: g.winnerTeamId, loser: g.loserTeamId };
  }
  const slots = await tx.select().from(bracketSlots).where(eq(bracketSlots.eventId, event.id));
  const seeds = Object.fromEntries(slots.filter((s) => s.teamId && s.seed != null).map((s) => [s.teamId!, s.seed!]));

  const entries = await tx.select().from(bracketEntries).where(eq(bracketEntries.eventId, event.id));
  for (const entry of entries) {
    const picksRows = await tx.select().from(bracketPicks).where(eq(bracketPicks.entryId, entry.id));
    const picks = Object.fromEntries(picksRows.map((p) => [p.gameCode, p.pickedTeamId]));
    const scored = scoreEntry(fmt, cfg, results, picks, seeds);
    await tx.update(bracketEntries).set({
      score: scored.score, maxPossible: scored.maxPossible, correctPicks: scored.correct,
      roundPoints: scored.roundPoints, scoredAt: new Date(),
    }).where(eq(bracketEntries.id, entry.id));
  }
  await tx.execute(sql`refresh materialized view concurrently bracket_group_standings`);
}
```

**Admin UI (`apps/admin/ops/brackets/[sport]/[division]/[year]/results`)**

- List of games in round order; each row shows the two participants (resolved from slots + prior winners), radio buttons for the winner, optional score inputs, Save.
- "Clear result" for a game (re-scores).
- Bulk: paste a simple CSV (`game_code,winner_slug`) for selection Sunday speed after the first round.
- Audit log of every change.
- The championship (`F`) requires both scores when the tiebreaker is `title_total`/`title_margin`; other games' scores are optional.
- After the championship is set, a "Mark complete" action freezes the event.

**Client refresh:** the public site does not need Realtime for MVP. Tag revalidation (30–60 s ISR on leaderboards) is enough; optional Broadcast for group pages that are open during a results session.

**Removed from v1.1:** ingestion worker, linking `bracket_games.game_id` → `games`, live score broadcast, "if it holds" provisional scoring from a feed.


### 14.10 Bracket UX details

- **Mobile**: round-by-round tabs with swipe; desktop: full bracket canvas with horizontal scroll and a mini-map. FCS 24 on desktop shows byes as seed cards entering at round 2.
- **Pick interaction**: tap a team to advance it; changing a pick cascades clears downstream picks with an undo toast.
- **Autofill helpers**: "Pick all higher seeds", "Randomize", "Clear".
- **Countdown**: lock time in local zone plus ET, persistent banner in the last 24 h.
- **Save state**: autosave drafts to `localStorage` for signed-out users; on sign-in, offer to save to account.
- **After lock**: show correct (green), wrong (red, struck through), eliminated future picks (gray), possible points, rank movement.
- **Share**: OG image route `/college-football/bracket-challenge/fcs/2026/entries/{id}/opengraph-image` renders the champion and final four picks.
- **Accessibility**: the bracket is an ordered list of games per round with buttons; the visual tree is decoration. Screen readers announce "Second round, game 3: No. 3 seed Montana State versus winner of first-round game 5. Your pick: Montana State."

### 14.11 Admin flows

1. **Create event** (status `draft`): choose `sport`, `division` (`fbs|fcs|d2|d3`), season/year, format (default mapped: fbs→cfp12, fcs→fcs24, d2→d2_28, d3→d3_32); scoring config; sponsor. DB rejects a second event for the same sport/division/season.
2. **Selection day**: "Set field" assigns teams to slots (search by school; validates division membership and no duplicates); set informational `starts_at` / `lock_at`; status → `field_set` → `open` at the public URL `/college-football/bracket-challenge/{division}/{year}`.
3. **During the event**: **Results** screen (§14.9) — staff enter winners; each save rescores; optional Broadcast.
4. **After the final**: status `complete`; standings frozen; Sanity announcement optional.
5. **Archive**: leaderboards stay public indefinitely.

### 14.12 Abuse and fairness

- One national entry per user (default); Clerk bot protection on sign-up; disposable-email blocking optional.
- Entries hidden pre-lock; the API never returns other users' picks before `lock_at` (RLS + server checks).
- Server time is authoritative; client clocks are ignored.
- Rate limits on save (e.g. 60/min) and join (10/min per user, 30/min per IP).
- Disqualify tool (admin) with reason, audited.

## 15. External links instead of a sports-data product

Redshirt does **not** ingest schedules, scores, standings, box scores or play-by-play. Building and licensing that stack is expensive and commodity. Hubs instead show curated **outbound links** to authoritative sources, and editorial coverage (recaps, previews, analysis) lives in Sanity articles.

### 15.1 What hubs show

| Hub | On-site | Outbound (editor-managed URLs on the Sanity doc) |
|---|---|---|
| Team | News, Redshirt poll history, bracket appearances, beat writers (`person` beats), next poll week teaser | Official athletics site, schedule, roster, stats, tickets, conference page |
| Conference | News, member teams, poll snapshot of conference teams | Conference standings, schedule, official site |
| Division / sport | News, rankings, bracket challenge CTAs | NCAA.com / CFP / relevant scoreboards |
| Article | Full body | Inline links as the writer chooses |

```ts
// Sanity school (excerpt)
defineField({
  name: "links", type: "object",
  fields: [
    defineField({ name: "officialSite", type: "url" }),
    defineField({ name: "scheduleUrl", type: "url", description: "Official schedule / scoreboard" }),
    defineField({ name: "rosterUrl", type: "url" }),
    defineField({ name: "statsUrl", type: "url" }),
    defineField({ name: "ticketsUrl", type: "url" }),
  ],
});
```

Render with `OutboundLinkCard` (opens in a new tab, `rel="noopener noreferrer"`, clear "Opens on {host}" label). Do not iframe third-party scoreboards.

### 15.2 What not to do

- Do not scrape ESPN unofficial JSON endpoints for production features.
- Do not add `games` / `players` tables "just in case" — they will rot unused. If a future product needs them, add them in a new major version with a full ingestion design.
- Do not block publishing an article because a schedule URL is missing; links are optional.

### 15.3 Optional later: manual "key dates" only

If editors want a tiny "this week" strip without a feed, add a Sanity object `keyDates[]` on the division hub (date, label, link). That is still editorial content, not a sports-data product.

---

## 16. Transfer portal and recruiting hubs (article-driven)

Hub pages for the two highest-intent off-field topics, with no player databases. Each hub is editorial: Sanity articles tagged with a `topic` (`transfer-portal`, `recruiting`) plus schools. v1.5 adds a real **Transfer Portal Tracker** whose rows are Sanity `portalEntry` documents maintained by editors. There are still **no Postgres player, recruit or portal tables** and no external data feed.

| Page | URL | Content |
|---|---|---|
| Portal hub | `/college-football/transfer-portal` (`?page=n`), same for basketball | Lead story, storylines (Sanity `storyline`), river of portal-tagged articles, a 4-row **tracker preview** (same `PortalRow`), link to the full tracker |
| **Portal tracker** | `/transfer-portal` with `?sport=&division=&status=&position=&conference=&school=&sort=&page=` | Filterable list of `portalEntry` rows (§16.1) |
| Recruiting hub | `/college-football/recruiting` (`?page=n`) | Commits coverage cards, signing-day package, storylines, river, optional curated commits list (`curatedTracker`, kind `recruiting`) |
| Team view | `/teams/{slug}/football/news` | Team's portal/recruiting stories via tags; the team's portal entries in a small `PortalRow` list |

Do not build: player profile pages, player photos, star ratings or grades, NIL valuations, prediction percentages, class rankings, or any ingestion of portal data.

### 16.1 Portal tracker

> **Status: in scope, UI redesign required before build.** The URL design, `searchParams` rules, Sanity schema, GROQ, caching and the named-`grid-template-areas` technique below are approved for planning. The *visual* design (the `PortalRow` card, filter bar and summary cards shown in the screenshots) will be redone before implementation. Do not build tracker UI from these mockups until James signs off on the redesign; the schema, query and route plumbing can be built first.
>
> **Story link: under review.** v1.5 required every entry to link a Redshirt story. James notes not every player has a story, so `story` is **optional** until Open Decision #16 is settled: Studio shows a warning (not an error) when it is empty, the GROQ no longer filters out story-less entries, and `PortalRow` hides the Story link when there is none.

**Why one root URL with query filters.** The tracker is a *view over one dataset* with many filter combinations, so filters are `searchParams` (as asked), including sport. It lives in its own static root folder, `app/(site)/transfer-portal/page.tsx` (folder = URL, no rewrites; `transfer-portal` is added to `RESERVED_ROOT_SEGMENTS`). Sport hubs link in with the sport preselected (`/transfer-portal?sport=mens-basketball`). Football is the default, so it carries no `sport` param.

| Param | Values | Default | Indexable? |
|---|---|---|---|
| `sport` | `football`, `mens-basketball`, `womens-basketball` | `football` | Yes |
| `division` | football `fbs fcs d2 d3 naia`; basketball `d1 d2 d3` | all | Yes |
| `status` | `entered`, `committed`, `withdrawn` | all | No |
| `position` | per sport (`qb rb wr te ol dl edge lb cb s k p ls` / `g f c`) | all | No |
| `conference` | conference slug (matches previous **or** new school) | all | No |
| `school` | free text, 2–40 chars (matches previous or new school name) | none | No |
| `sort` | `newest`, `oldest`, `name`, `school` | `newest` | No |
| `page` | 1–500 (§17.6) | 1 | Yes |

- **Canonical** = the indexable subset in a fixed order (`sport`, `division`, `page`, defaults dropped). Example: `/transfer-portal?division=fcs&status=committed&sort=name` → canonical `/transfer-portal?division=fcs`, `robots: noindex, follow`. Views with only indexable params are `index, follow` with a self canonical.
- **Invalid values**: an invalid `page` → 404 (as everywhere). An invalid filter value is dropped (treated as "all") and the view is `noindex`. No redirects either way.
- **Filter UI** is a plain `<form method="get">` of shadcn `Select`s + an `Input`, so it works without JS; with JS, changes call `router.replace(`?${params}`, { scroll: false })` (client navigation, not an HTTP redirect) and reset `page`. Active filters render as removable `Badge` chips plus "Clear all". Mobile collapses the filters into a `Sheet` ("Filters · 2") with the sort `Select` beside it.
- **Summary cards**: Entered / Committed / Withdrawn counts for the current filters (ignoring `status`), labelled as Redshirt-tracked entries, not totals.
- **Caching** (Cache Components): the page shell is static; the list and counts sit in `<Suspense>` and call `getPortalEntries(filters)`, a `"use cache"` function whose arguments are the normalized filter object, so every combination is cached and shared. Tags `portal` and `portal:<sport>`; the Sanity webhook (§18.4) expires them when a `portalEntry` is published. `cacheLife("minutes")` as a backstop.

#### Sanity schema: `portalEntry`

```ts
// packages/sanity/src/schemas/portal-entry.ts
import { defineType, defineField } from "sanity";
import { UsersIcon } from "@sanity/icons";

const POSITIONS = {
  cfb: ["QB", "RB", "WR", "TE", "OL", "DL", "EDGE", "LB", "CB", "S", "K", "P", "LS"],
  mbb: ["G", "F", "C"],
  wbb: ["G", "F", "C"],
} as const;
const DIVISIONS = { cfb: ["fbs", "fcs", "d2", "d3", "naia"], mbb: ["d1", "d2", "d3"], wbb: ["d1", "d2", "d3"] } as const;

export const portalEntry = defineType({
  name: "portalEntry",
  title: "Portal entry",
  type: "document",
  icon: UsersIcon,
  fields: [
    defineField({ name: "playerName", type: "string", validation: (r) => r.required().max(80) }),
    defineField({ name: "sport", type: "string", initialValue: "cfb", options: { list: ["cfb", "mbb", "wbb"], layout: "radio" }, validation: (r) => r.required() }),
    defineField({ name: "season", type: "number", description: "Portal cycle year, e.g. 2026", validation: (r) => r.required().integer().min(2024) }),
    defineField({
      name: "position", type: "string",
      options: { list: [...new Set(Object.values(POSITIONS).flat())] },
      validation: (r) => r.required().custom((v, { document }) =>
        !v || (POSITIONS as any)[document?.sport as string]?.includes(v) || "Position doesn't match the sport"),
    }),
    defineField({ name: "classYear", title: "Class", type: "string", options: { list: ["FR", "SO", "JR", "SR", "GR"] }, validation: (r) => r.required() }),
    defineField({ name: "redshirt", type: "boolean", initialValue: false }),
    defineField({ name: "eligibilityRemaining", title: "Years of eligibility left", type: "number", validation: (r) => r.integer().min(0).max(5) }),
    defineField({ name: "heightInches", title: "Height (inches)", type: "number", description: "Optional. 74 = 6-2", validation: (r) => r.integer().min(60).max(90) }),
    defineField({ name: "weightLbs", title: "Weight (lb)", type: "number", description: "Optional", validation: (r) => r.integer().min(120).max(400) }),
    defineField({ name: "previousSchool", type: "reference", to: [{ type: "school" }], validation: (r) => r.required() }),
    defineField({
      name: "division", type: "string", description: "Division of the previous program",
      options: { list: [...new Set(Object.values(DIVISIONS).flat())] },
      validation: (r) => r.required().custom((v, { document }) =>
        !v || (DIVISIONS as any)[document?.sport as string]?.includes(v) || "Division doesn't match the sport"),
    }),
    defineField({ name: "status", type: "string", initialValue: "entered", options: { list: ["entered", "committed", "withdrawn"], layout: "radio" }, validation: (r) => r.required() }),
    defineField({
      name: "newSchool", type: "reference", to: [{ type: "school" }],
      hidden: ({ document }) => document?.status !== "committed",
      validation: (r) => r.custom((v, { document }) => document?.status !== "committed" || !!v || "Committed entries need a new school"),
    }),
    defineField({ name: "enteredOn", type: "date", validation: (r) => r.required() }),
    defineField({ name: "committedOn", type: "date", hidden: ({ document }) => document?.status !== "committed",
      validation: (r) => r.custom((v, { document }) => document?.status !== "committed" || !!v || "Required when committed") }),
    defineField({ name: "withdrawnOn", type: "date", hidden: ({ document }) => document?.status !== "withdrawn",
      validation: (r) => r.custom((v, { document }) => document?.status !== "withdrawn" || !!v || "Required when withdrawn") }),
    defineField({
      name: "story", title: "Redshirt story", type: "reference", to: [{ type: "post" }],
      description: "The Redshirt article this entry comes from, if there is one. Optional pending Open Decision #16 (§30).",
      // Optional pending Open Decision #16. Do NOT switch this to r.required() until James decides.
      validation: (r) => r.custom((v) => (v ? true : "No Redshirt story linked yet")).warning(),
    }),
    defineField({ name: "moreStories", type: "array", of: [{ type: "reference", to: [{ type: "post" }] }], validation: (r) => r.max(5) }),
    defineField({ name: "note", type: "string", description: "Optional one-line context", validation: (r) => r.max(160) }),
  ],
  orderings: [{ title: "Latest status", name: "latest", by: [{ field: "_updatedAt", direction: "desc" }] }],
  preview: {
    select: { name: "playerName", pos: "position", status: "status", from: "previousSchool.shortName", to: "newSchool.shortName" },
    prepare: ({ name, pos, status, from, to }) => ({ title: `${name} · ${pos}`, subtitle: `${from ?? "?"} → ${to ?? status}` }),
  },
});
```

Notes: no `slug` (there are no player pages) and no image field (initials avatar only, which avoids photo-rights questions). Studio gets a "Portal tracker" desk list filtered by sport/season/status, and the post editor shows "Portal entries citing this story" so editors update both together.

#### GROQ

```ts
// packages/sanity/src/queries/portal.ts
import { defineQuery } from "next-sanity";

// Shared filter. Params left null mean "all". $school is pre-formatted server-side as "montana*".
// Reading $sort inside order() keeps this one static query (typegen-friendly); the server only ever passes a whitelisted value.
export const portalEntriesQuery = defineQuery(`{
  "items": *[_type == "portalEntry" && sport == $sport && season == $season
    && ($division == null || division == $division)
    && ($status == null || status == $status)
    && ($position == null || position == $position)
    && ($conference == null || previousSchool->conference->slug.current == $conference || newSchool->conference->slug.current == $conference)
    && ($school == null || previousSchool->name match $school || previousSchool->shortName match $school
                        || newSchool->name match $school || newSchool->shortName match $school)
  ]{
    _id, playerName, position, classYear, redshirt, eligibilityRemaining, heightInches, weightLbs, division, status, note,
    "statusDate": coalesce(committedOn, withdrawnOn, enteredOn),
    "from": previousSchool->{ "slug": slug.current, name, shortName, "conference": conference->shortName, logo },
    "to": newSchool->{ "slug": slug.current, name, shortName, "conference": conference->shortName, logo },
    // null when no story is linked (story is optional pending §30 #16)
    "story": story->{ title, "slug": slug.current, primarySport, publishedAt }
  } | order(
      select($sort == "oldest" => statusDate, $sort == "name" => playerName, $sort == "school" => from.shortName, null) asc,
      select($sort == "newest" => statusDate, null) desc,
      _id asc
    )[$start...$end],
  "counts": {
    "entered":   count(*[_type == "portalEntry" && sport == $sport && season == $season && status == "entered"   && ($division == null || division == $division)]),
    "committed": count(*[_type == "portalEntry" && sport == $sport && season == $season && status == "committed" && ($division == null || division == $division)]),
    "withdrawn": count(*[_type == "portalEntry" && sport == $sport && season == $season && status == "withdrawn" && ($division == null || division == $division)])
  },
  "total": count(*[_type == "portalEntry" && sport == $sport && season == $season
    && ($division == null || division == $division) && ($status == null || status == $status)
    && ($position == null || position == $position)
    && ($conference == null || previousSchool->conference->slug.current == $conference || newSchool->conference->slug.current == $conference)
    && ($school == null || previousSchool->name match $school || previousSchool->shortName match $school
                        || newSchool->name match $school || newSchool->shortName match $school)])
}`);
```

(If the `select()`-in-`order()` pattern gives you trouble on your API version, use four literal queries, one per sort, chosen from a whitelist map. Never interpolate user input into GROQ.) Counts here ignore position/conference/school for speed; extend them with the same filter if editors want exact counts. At editor-maintained volumes (hundreds to low thousands per season) these queries are fast; they're cached anyway.

#### Params, data function and page

```ts
// packages/seo/src/portal-params.ts
import { z } from "zod";
const SPORT = { football: "cfb", "mens-basketball": "mbb", "womens-basketball": "wbb" } as const;
const opt = <T extends z.ZodTypeAny>(s: T) => s.optional().catch(undefined);   // invalid → dropped

export const PortalParams = z.object({
  sport: z.enum(["football", "mens-basketball", "womens-basketball"]).catch("football"),
  division: opt(z.enum(["fbs", "fcs", "d2", "d3", "naia", "d1"])),
  status: opt(z.enum(["entered", "committed", "withdrawn"])),
  position: opt(z.string().regex(/^[a-z]{1,4}$/)),
  conference: opt(z.string().regex(/^[a-z0-9-]{2,40}$/)),
  school: opt(z.string().trim().min(2).max(40)),
  sort: z.enum(["newest", "oldest", "name", "school"]).catch("newest"),
});
export type PortalFilters = z.infer<typeof PortalParams> & { page: number };

export function parsePortal(sp: Record<string, string | string[] | undefined>) {
  const raw = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const f = PortalParams.parse(raw);
  const dropped = ["division", "status", "position", "conference", "school", "sort"].some((k) => raw[k] !== undefined && (f as any)[k] !== raw[k]);
  return { filters: f, sportCode: SPORT[f.sport], dropped };
}

export function portalCanonical(f: PortalFilters) {
  const q = new URLSearchParams();
  if (f.sport !== "football") q.set("sport", f.sport);
  if (f.division) q.set("division", f.division);
  if (f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return `/transfer-portal${s ? `?${s}` : ""}`;
}
export const portalIndexable = (f: PortalFilters, dropped: boolean) =>
  !dropped && !f.status && !f.position && !f.conference && !f.school && f.sort === "newest";
```

```ts
// packages/sanity/src/data/portal.ts
import { cacheTag, cacheLife } from "next/cache";
import { client } from "../client";
import { portalEntriesQuery } from "../queries/portal";

export async function getPortalEntries(f: PortalFilters & { sportCode: "cfb" | "mbb" | "wbb"; season: number }) {
  "use cache";
  cacheTag("portal", `portal:${f.sportCode}`);
  cacheLife("minutes");
  const size = 25, start = (f.page - 1) * size;
  return client.fetch(portalEntriesQuery, {
    sport: f.sportCode, season: f.season, division: f.division ?? null, status: f.status ?? null,
    position: f.position?.toUpperCase() ?? null, conference: f.conference ?? null,
    school: f.school ? `${f.school.replace(/[*"\\]/g, "")}*` : null,
    sort: f.sort, start, end: start + size,
  });
}
```

```tsx
// apps/web/app/(site)/transfer-portal/page.tsx
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { parsePage } from "@rs/seo/pagination";
import { parsePortal, portalCanonical, portalIndexable } from "@rs/seo/portal-params";
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(typeof sp.page === "string" ? sp.page : undefined) ?? 1;
  const { filters, dropped } = parsePortal(sp);
  const f = { ...filters, page };
  return {
    title: `Transfer Portal Tracker${filters.division ? ` · ${filters.division.toUpperCase()}` : ""}${page > 1 ? ` – Page ${page}` : ""}`,
    alternates: { canonical: portalCanonical(f) },
    robots: portalIndexable(f, dropped) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default function Page({ searchParams }: { searchParams: SP }) {
  return (
    <TrackerShell>                                        {/* static: title, intro, rail, ad slots */}
      <Suspense fallback={<TrackerSkeleton />}><Tracker searchParams={searchParams} /></Suspense>
    </TrackerShell>
  );
}

async function Tracker({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const page = parsePage(typeof sp.page === "string" ? sp.page : undefined);
  if (page === null) notFound();
  const { filters, sportCode } = parsePortal(sp);
  const data = await getPortalEntries({ ...filters, page, sportCode, season: currentPortalSeason(sportCode) });
  const totalPages = Math.max(1, Math.ceil(data.total / 25));
  if (page > totalPages) notFound();
  return (
    <>
      <PortalFilters value={filters} />                   {/* GET form + router.replace; chips; mobile Sheet */}
      <PortalSummary counts={data.counts} />
      <PortalRowHead />
      <ol className="grid gap-2">{data.items.map((e) => <PortalRow key={e._id} entry={e} />)}</ol>
      <Pagination page={page} totalPages={totalPages} hrefFor={(n) => withParam(sp, "page", n > 1 ? String(n) : null)} />
    </>
  );
}
```

#### `PortalRow`: named grid areas

The row is one CSS grid with named areas. Mobile stacks a card; at `lg` the same element becomes a single wide row whose columns line up with a header row. Children only declare *which area* they occupy, so the layout lives in one place. Defined once as a Tailwind v4 `@utility` in `packages/ui/src/styles/globals.css`:

```css
/* packages/ui/src/styles/globals.css (excerpt) */
@utility portal-row {
  display: grid;
  grid-template-areas:
    "avatar  name    status"
    "avatar  meta    meta"
    "schools schools schools"
    "date    date    story";
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  column-gap: 0.75rem;
  row-gap: 0.375rem;
  align-items: center;
  @variant lg {
    grid-template-areas:
      "avatar name pos schools status story"
      "avatar meta pos schools date   story";
    grid-template-columns: 2.75rem minmax(0, 1.35fr) 3.25rem minmax(0, 2fr) 6.5rem 7rem;
    column-gap: 1rem;
    row-gap: 0.125rem;
  }
}
@utility portal-row-head {            /* column labels, desktop only, same columns */
  display: none;
  @variant lg {
    display: grid;
    grid-template-areas: "avatar name pos schools status story";
    grid-template-columns: 2.75rem minmax(0, 1.35fr) 3.25rem minmax(0, 2fr) 6.5rem 7rem;
    column-gap: 1rem;
  }
}
```

```tsx
// packages/ui/src/components/portal-row.tsx
import { Badge } from "@rs/ui/components/ui/badge";
import { Avatar, AvatarFallback } from "@rs/ui/components/ui/avatar";
import { ChevronRight, Newspaper } from "lucide-react";
import { SchoolChip } from "./school-chip";
import { urls } from "@rs/seo/urls";

const STATUS = {
  entered:   { label: "Entered",   variant: "outline" as const, className: "border-new/50 text-new" },
  committed: { label: "Committed", variant: "default" as const, className: "" },
  withdrawn: { label: "Withdrawn", variant: "secondary" as const, className: "text-muted-foreground" },
};
const ht = (i?: number) => (i ? `${Math.floor(i / 12)}-${i % 12}` : null);

export function PortalRow({ entry: e }: { entry: PortalEntryRow }) {
  const s = STATUS[e.status];
  const initials = e.playerName.split(" ").slice(-2).map((w) => w[0]).join("");
  const size = [ht(e.heightInches), e.weightLbs].filter(Boolean).join(" / ");
  return (
    <li className="portal-row rounded-xl border bg-card px-4 py-3 shadow-xs transition-colors hover:bg-accent/30">
      <Avatar className="[grid-area:avatar] size-10 self-start lg:size-11 lg:self-center">
        <AvatarFallback className="bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <div className="[grid-area:name] min-w-0 truncate font-display text-lg font-bold leading-none">{e.playerName}</div>
      <div className="[grid-area:meta] flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground lg:hidden">{e.position}</span>
        <span>{e.redshirt ? "R-" : ""}{e.classYear}{e.eligibilityRemaining != null && ` · ${e.eligibilityRemaining} yr left`}{size && ` · ${size}`}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] uppercase">{e.division}</Badge>
      </div>
      {/* hidden below lg: the mobile template has no "pos" area, so this must not render there */}
      <div className="[grid-area:pos] hidden font-display text-base font-bold lg:block">{e.position}</div>
      <div className="[grid-area:schools] grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 lg:bg-transparent lg:p-0">
        <SchoolChip school={e.from} muted />
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        {e.status === "committed" && e.to ? <SchoolChip school={e.to} /> :
         e.status === "entered" ? <span className="text-sm text-muted-foreground">Undecided</span> :
         <span className="text-sm text-muted-foreground">Returning</span>}
      </div>
      <Badge variant={s.variant} className={`[grid-area:status] justify-self-end lg:justify-self-start ${s.className}`}>{s.label}</Badge>
      <time dateTime={e.statusDate} className="[grid-area:date] text-xs tabular text-muted-foreground">
        <span className="lg:hidden">{s.label} </span>{formatDate(e.statusDate)}
      </time>
      {e.story?.slug ? (
      <a href={urls.article({ primarySport: e.story.primarySport, slug: e.story.slug })} title={e.story.title}
         className="[grid-area:story] inline-flex items-center gap-1 justify-self-end rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-accent">
        <Newspaper className="size-3.5" aria-hidden /> Story <ChevronRight className="size-3" aria-hidden />
        <span className="sr-only">: {e.story.title}</span>
      </a>
      ) : null /* story optional pending §30 #16 */}
    </li>
  );
}
```

**Alternative without `@utility`** (fine for a one-off, harder to read): Tailwind arbitrary properties, with `_` for spaces inside the value:

```tsx
<li className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto]
  [grid-template-areas:'avatar_name_status'_'avatar_meta_meta'_'schools_schools_schools'_'date_date_story']
  lg:grid-cols-[2.75rem_minmax(0,1.35fr)_3.25rem_minmax(0,2fr)_6.5rem_7rem]
  lg:[grid-template-areas:'avatar_name_pos_schools_status_story'_'avatar_meta_pos_schools_date_story']">
```

Prefer the `@utility`: one named class, readable area maps, and the header row shares the column definition. Accessibility: the list is an `<ol>` of `<li>`s (not a table, because the mobile layout reflows cells); the header row is `aria-hidden` and each row's text reads in a sensible order (name, details, position, previous → new, status, date, story).

#### What we borrowed from On3's Transfer Portal Wire

I fetched `on3.com/transfer-portal/wire/football/` and took Playwright screenshots (desktop 1440×900 and mobile 390×844, kept outside this handoff for study only; they contain On3's real players, photos and data, so they are **not** embedded here). With a normal browser window I inspected the row's computed styles: on desktop, each row is a 5-column grid (player · pos · grades/NIL · status · last → new) under a matching header row; on mobile the same row redefines `grid-template-areas` to `"player" "rating" "status" "flow"`, stacking cells into a card and hiding the position cell (it moves into the player meta line).

| On3 element | Redshirt version |
|---|---|
| Row card that is one CSS grid; mobile redefines `grid-template-areas` to stack | `portal-row` `@utility` with named areas; mobile 3-column card, `lg` single row; children only set `[grid-area:…]` |
| Header row aligned to the row columns | `portal-row-head` sharing the same column template |
| Player cell: name, then a meta line with position, height/weight, class chip | Name in Barlow Condensed, meta line with class, eligibility, optional height/weight and a division `Badge`; position gets its own column on desktop and joins the meta line on mobile, as On3 does |
| Status pill with date stacked under it | `Badge` (Entered = outline "new" blue, Committed = primary, Withdrawn = muted) over the date |
| "Last → new" school flow with arrows; "?" when undecided | Previous → new school chips (neutral marks + conference); dashed "?" + "Undecided" when entered; "Returning" when withdrawn. Only previous → new; no multi-school chains |
| Filter selects above the list (year, sport, team, status, position) | Sport, Division, Status, Position, Conference, School search, Sort, all in `searchParams`, plus removable chips and "Clear all"; mobile `Sheet` |
| Summary stat cards (in portal, committed, withdrawn) | Same three counts, from Redshirt's own entries and labelled "tracked, not exhaustive" |
| Not borrowed | Player photos, star ratings, transfer/HS grades, NIL valuations, prediction percentages, ads between rows. (v1.5 also required every row to link a Redshirt story; that rule is under review, §30 #16) |

![Portal tracker, desktop (1440×900)](../mockups/screenshots/portal-tracker-desktop.png)

<p class="shots"><img src="mockups/screenshots/portal-tracker-mobile.png" alt="Portal tracker, mobile"><img src="mockups/screenshots/transfer-portal-mobile.png" alt="Portal hub, mobile"></p>

*Above: the tracker on mobile (named areas restacked into a card) and the portal hub with its tracker preview. All players are fictional placeholders.*



---

## 17. Route map and URL structure (designed from scratch)

This route map is designed fresh; old Redshirt URLs get optional one-time 301s (§27). Two hard rules from James (v1.4):

1. **Zero rewrites.** No `rewrites()` in any `next.config`, no middleware rewrites, no proxy routing. **App Router folders map 1:1 to public URLs**: if a URL is `/college-football/fcs/news`, the file is `app/(site)/college-football/[division]/news/page.tsx` (route groups like `(site)` don't appear in URLs by definition).
2. **No routing redirects.** The app never redirects one of its own URLs to another (no "current → archive", no "latest year", no slug-change, no internal-path, no `?page=1` redirects). The only redirects are **optional one-time 301s from legacy Redshirt URLs** (§27). Everything else renders in place with a correct canonical, or returns 404.

### 17.1 What the reference sites teach about URLs

These are observed URL *patterns*, described generally. Exact paths change over time.

| Site | Pattern style | Good | Avoid |
|---|---|---|---|
| ESPN | Sport-first paths (`/college-football/...`), sections like rankings; some entity pages use opaque `/_/id/<number>/` segments | Short, keyword-rich sport segment; each view has its own path | Opaque id segments and filters in path params are hard to read and share |
| The Athletic | Sport and team landing pages; articles carry an id plus slug | Stable article URLs | Long numeric ids add nothing for readers |
| 247Sports | Team sites as sub-sites; season-scoped pages | Season in path for rankings | Deep, inconsistent nesting between sections |
| On3 | Sport-agnostic team pages (school + nickname) with sport sections inside | One brand page per school; nickname makes the slug unambiguous and readable | Mixing URL schemes between sections |
| Bleacher Report | Short team "stream" pages | Short team URLs | Ambiguous without a nickname or sport section |
| SI | Team sites under one domain plus sport sections | Shared domain authority | Many sub-brands with different structures |

### 17.0 Sport URL rationale: keep `/college-football/`

Keep the full keyword in the first path segment:

| Choice | Example | Verdict |
|---|---|---|
| **Recommended** | `/college-football/…`, `/mens-college-basketball/…`, `/womens-college-basketball/…` | Matches how people search ("college football rankings", "men's college basketball"); one segment; gender-disambiguated for basketball; no ambiguity with NFL/NBA |
| Alternative | `/college-basketball/…` with a gender tab or query | Shorter, but men's and women's content compete for the same URL space and breadcrumbs; reject for this product |
| Rejected | `/cfb/…`, `/ncaaf/…` | Cryptic; weaker for SEO and for editors linking in Sanity |
| Rejected | `/college/football/…` | Two segments for one idea; the current Redshirt shape — redirected away, not kept |

`SPORT_PATH` in `@rs/seo/urls` is the single place these strings are defined. Basketball stays gendered (`mens-college-basketball`, `womens-college-basketball`). Do not introduce a unisex `/college-basketball/` alias.


### 17.2 Design rules

1. **Sport is the first segment** and is a full keyword: `/college-football`, `/mens-college-basketball`, `/womens-college-basketball` (§17.0). Each is a real static folder.
2. **Section second, scope third, time last**: `/{sport}/{section}/{division}/{season}/{week}`, e.g. `/college-football/rankings/fcs/2026/week-7`.
3. **Readable time segments**: `2026`, `week-7`, `preseason`, `final`. Basketball seasons use the starting year (`2026` = 2026-27).
4. **"Current" URLs have no time segment** and render the latest (`/college-football/rankings/fcs`); archive URLs have it. Both self-canonicalize. No redirect between them.
5. **Articles live at `/{sport}/news/{slug}`**, no id suffix. Slugs are **globally unique** and, together with `primarySport`, **immutable after first publish** (Studio makes both read-only once published; headlines can still change). That removes the need for slug-change redirects. A request whose sport segment doesn't match the article's `primarySport` returns 404 (we never link to it).
6. **The site root is reserved for page-builder pages** (`/about`, `/privacy`, …) via `app/(site)/[...slug]`. Its only extra job: if no Sanity page matches, look up the legacy-redirect table (one-time 301s from old Redshirt root URLs), else 404.
7. **Team hubs are sport-agnostic, On3-style**: `/teams/{school-slug-nickname}` (e.g. `/teams/montana-state-bobcats`) with sport sections inside: `/teams/montana-state-bobcats/football`, `/mens-basketball`, `/womens-basketball` (§17.5).
8. **Pagination uses `?page=n`** (SI / The Athletic pattern), page 1 has no parameter (§17.6).
9. **Tabs are path segments** (`/news`, `/rankings`, `/football`); **query strings are only for pagination and view filters** (`?page=`, `?voters=` on the ballot breakdown).
10. **Lowercase, hyphens, no trailing slash, no file extensions** (except feeds and sitemaps). We never generate other forms; we add no normalization middleware. (Next.js's built-in trailing-slash normalization is framework behavior, not app routing; leave the default.)
11. **Signed-out visits to personal pages render in place**: `/account/*`, `/onboarding`, `…/my-bracket` show an inline Clerk `<SignIn />` card (with `forceRedirectUrl` set to the current path, which is a client navigation after sign-in, not an HTTP redirect) instead of bouncing to `/sign-in`. Middleware does not call `auth.protect()` on `www`.
12. **Personal and interactive URLs are `noindex`**: account, onboarding, pick editor, group join links, search, all of `vote.` and `admin.`.

### 17.3 Folder strategy: explicit sport folders + a route-config factory

**Decision:** every public sport section is a **real static folder** (`app/(site)/college-football/…`, `app/(site)/mens-college-basketball/…`, `app/(site)/womens-college-basketball/…`). The page files inside are **two-line stubs** that bind a sport to a shared route module created by a factory in `apps/web/src/routes/`. The stubs are **generated** from a route manifest so the three sport trees can't drift.

Why this approach:

| Option | URL ↔ folder 1:1 | Rewrites/redirects | Verdict |
|---|---|---|---|
| Internal `sports/[sport]` + `beforeFiles` rewrites (v1.3) | No (folder says `/sports/`) | Rewrite + 308 for the internal path | **Rejected** (violates both rules) |
| Root `[sport]` dynamic segment | Yes | None | **Rejected**: Next.js can't have `[sport]` and the page-builder `[...slug]` as different dynamic siblings at the root; it would also make every unknown root path ambiguous |
| Middleware routing | No | Rewrites | **Rejected** |
| **Explicit static sport folders + route factory + codegen stubs** | **Yes** | **None** | **Chosen**: static segments always win over the root catch-all, so `/college-football/...` never collides with page-builder pages; each folder is exactly the URL; shared logic lives once in `src/routes/*`; adding a sport is one manifest line + `pnpm routes:gen` |

How it works:

```ts
// apps/web/src/routes/manifest.ts — single source of truth for sport sections
export const SPORTS = {
  cfb: { path: "college-football",          teamPath: "football",          divisions: ["fbs", "fcs", "d2", "d3", "naia"] },
  mbb: { path: "mens-college-basketball",   teamPath: "mens-basketball",   divisions: ["d1", "d2", "d3"] },
  wbb: { path: "womens-college-basketball", teamPath: "womens-basketball", divisions: ["d1", "d2", "d3"] },
} as const;
export type Sport = keyof typeof SPORTS;

// Templates that exist under every sport folder (relative path → route module export)
export const SPORT_TEMPLATES = [
  ["page.tsx", "sportHub"],
  ["news/page.tsx", "sportNews"],                       // ?page=n
  ["news/[slug]/page.tsx", "article"],
  ["[division]/page.tsx", "divisionHub"],
  ["[division]/news/page.tsx", "divisionNews"],         // ?page=n
  ["conferences/page.tsx", "conferenceIndex"],
  ["conferences/[conf]/page.tsx", "conferenceHub"],
  ["teams/page.tsx", "teamDirectory"],                  // sport-filtered directory; links to /teams/{slug}/{teamPath}
  ["rankings/page.tsx", "rankingsLanding"],
  ["rankings/methodology/page.tsx", "methodology"],
  ["rankings/[division]/page.tsx", "pollCurrent"],
  ["rankings/[division]/voters/page.tsx", "voterPanel"],
  ["rankings/[division]/voters/[voter]/page.tsx", "voterProfile"],
  ["rankings/[division]/[year]/[week]/page.tsx", "pollWeek"],
  ["rankings/[division]/[year]/[week]/ballots/page.tsx", "ballotBreakdown"],
  ["rankings/[division]/[year]/[week]/ballots/[voter]/page.tsx", "ballot"],
  ["transfer-portal/page.tsx", "portalHub"],            // article-driven (§16)
  ["recruiting/page.tsx", "recruitingHub"],             // article-driven (§16)
  ["bracket-challenge/page.tsx", "bracketSportHub"],
  ["bracket-challenge/[division]/page.tsx", "bracketDivision"],   // landing: current year card + archive (no redirect)
  ["bracket-challenge/[division]/[year]/page.tsx", "bracketEvent"],
  ["bracket-challenge/[division]/[year]/my-bracket/page.tsx", "bracketPicks"],
  ["bracket-challenge/[division]/[year]/leaderboard/page.tsx", "bracketLeaderboard"],  // ?page=n
  ["bracket-challenge/[division]/[year]/entries/[entryId]/page.tsx", "bracketEntry"],
  ["bracket-challenge/[division]/[year]/groups/page.tsx", "bracketGroups"],
  ["bracket-challenge/[division]/[year]/groups/[groupId]/page.tsx", "bracketGroup"],
  ["bracket-challenge/[division]/[year]/join/[code]/page.tsx", "bracketJoin"],
  ["feed.xml/route.ts", "sportFeed"],
] as const;
```

```ts
// apps/web/src/routes/sport-news.tsx — one implementation, bound per sport by the factory
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getNewsPage } from "@rs/sanity/queries/news";
import { parsePage, pageMetadata } from "@rs/seo/pagination";
import { SPORTS, type Sport } from "./manifest";

export function sportNews(sport: Sport) {
  async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    return (
      <SportNewsShell sport={sport}>                      {/* static shell: prerendered */}
        <Suspense fallback={<RiverSkeleton />}>            {/* dynamic hole: reads searchParams */}
          <River sport={sport} searchParams={searchParams} />
        </Suspense>
      </SportNewsShell>
    );
  }
  async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
    const page = parsePage((await searchParams).page);
    return pageMetadata({ base: `/${SPORTS[sport].path}/news`, page, title: `${label(sport)} News` });
  }
  return { Page, generateMetadata };
}

async function River({ sport, searchParams }: { sport: Sport; searchParams: Promise<{ page?: string }> }) {
  const page = parsePage((await searchParams).page);      // invalid → null
  if (page === null) notFound();
  const data = await getNewsPage({ sport, page });         // "use cache" + cacheTag("posts:" + sport)
  if (page > data.totalPages) notFound();
  return <NewsRiver items={data.items} page={page} totalPages={data.totalPages} />;
}
```

```tsx
// apps/web/app/(site)/college-football/news/page.tsx — GENERATED by `pnpm routes:gen`, do not edit
import { sportNews } from "@/routes/sport-news";
const r = sportNews("cfb");
export default r.Page;
export const generateMetadata = r.generateMetadata;
```

```tsx
// apps/web/app/(site)/college-football/[division]/page.tsx — GENERATED
import { divisionHub } from "@/routes/division-hub";
const r = divisionHub("cfb");
export default r.Page;
export const generateMetadata = r.generateMetadata;
export const generateStaticParams = r.generateStaticParams;   // [{division:"fbs"},{division:"fcs"},…]
export const dynamicParams = false;                            // any other value → 404, no catch-all fallthrough
```

`scripts/routes-gen.ts` writes every stub from `SPORTS × SPORT_TEMPLATES` (plus the non-sport routes) and deletes stale ones; CI runs it and fails on `git diff --exit-code`. Shared layouts (`layout.tsx` with sport theming and sub-nav) are stubs too. If James prefers zero codegen, the stubs can be hand-written; the manifest + factory still prevents logic drift.

**Why static siblings are safe:** under `college-football/`, static folders (`news`, `rankings`, `conferences`, `teams`, `transfer-portal`, `recruiting`, `bracket-challenge`) always match before the dynamic `[division]`; `[division]` uses `dynamicParams = false`, so `/college-football/anything-else` is a 404 rather than an accidental division page. At the root, the three sport folders and the other static folders win over `[...slug]`.

### 17.4 Full `apps/web` tree

```text
apps/web/
├── app/
│   ├── layout.tsx                                   # <html>, fonts, ThemeProvider, ClerkProvider, PostHog
│   ├── globals.css                                  # @import "@rs/ui/styles/globals.css" + @source
│   ├── not-found.tsx
│   ├── robots.ts
│   ├── sitemap.ts                                   # sitemap index
│   ├── sitemaps/
│   │   ├── posts/[n]/route.ts                       # ≤ 50k URLs each
│   │   ├── teams/route.ts
│   │   ├── rankings/route.ts
│   │   ├── brackets/route.ts
│   │   ├── pages/route.ts
│   │   └── people/route.ts
│   ├── news-sitemap.xml/route.ts                    # last 48 h
│   ├── manifest.ts                                  # PWA
│   ├── opengraph-image.tsx
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── api/
│   │   ├── webhooks/clerk/route.ts
│   │   ├── webhooks/sanity/route.ts
│   │   ├── webhooks/resend/route.ts
│   │   ├── revalidate/sanity/route.ts
│   │   ├── revalidate/tags/route.ts                 # bearer; called by admin/vote
│   │   ├── draft-mode/enable/route.ts
│   │   ├── draft-mode/disable/route.ts
│   │   ├── river/route.ts                           # "load more" JSON for ?page=n+1 (progressive enhancement)
│   │   └── health/route.ts
│   └── (site)/
│       ├── layout.tsx                               # ticker, header, footer, bottom nav, ads provider
│       ├── page.tsx                                 # /
│       ├── [...slug]/page.tsx                       # Sanity page builder → legacy-301 lookup → 404
│       ├── college-football/                        # ← GENERATED stubs (same tree for the two basketball folders)
│       │   ├── layout.tsx                           # sport sub-nav
│       │   ├── page.tsx                             # /college-football
│       │   ├── feed.xml/route.ts
│       │   ├── news/
│       │   │   ├── page.tsx                         # /college-football/news?page=n
│       │   │   └── [slug]/page.tsx                  # /college-football/news/{slug}
│       │   ├── [division]/
│       │   │   ├── page.tsx                         # /college-football/fcs
│       │   │   └── news/page.tsx                    # /college-football/fcs/news?page=n
│       │   ├── conferences/
│       │   │   ├── page.tsx
│       │   │   └── [conf]/page.tsx
│       │   ├── teams/page.tsx                       # directory → links to /teams/{slug}/football
│       │   ├── rankings/
│       │   │   ├── page.tsx
│       │   │   ├── methodology/page.tsx
│       │   │   └── [division]/
│       │   │       ├── page.tsx                     # current poll
│       │   │       ├── voters/page.tsx
│       │   │       ├── voters/[voter]/page.tsx
│       │   │       └── [year]/[week]/
│       │   │           ├── page.tsx                 # archive poll week
│       │   │           └── ballots/
│       │   │               ├── page.tsx             # Voter Ballot Breakdown (§13, §32)
│       │   │               └── [voter]/page.tsx
│       │   ├── transfer-portal/page.tsx             # article-driven hub ?page=n
│       │   ├── recruiting/page.tsx                  # article-driven hub ?page=n
│       │   └── bracket-challenge/
│       │       ├── page.tsx
│       │       └── [division]/
│       │           ├── page.tsx                     # division landing (current + archive), no redirect
│       │           └── [year]/
│       │               ├── layout.tsx               # loads THE event (sport, division, year) or 404
│       │               ├── page.tsx                 # event landing / bracket view
│       │               ├── opengraph-image.tsx
│       │               ├── my-bracket/page.tsx
│       │               ├── leaderboard/page.tsx     # ?page=n
│       │               ├── entries/[entryId]/page.tsx
│       │               ├── entries/[entryId]/opengraph-image.tsx
│       │               ├── groups/page.tsx
│       │               ├── groups/[groupId]/page.tsx
│       │               └── join/[code]/page.tsx
│       ├── mens-college-basketball/                 # same generated tree (divisions d1|d2|d3)
│       ├── womens-college-basketball/               # same generated tree
│       ├── teams/
│       │   ├── page.tsx                             # all schools A–Z, search
│       │   └── [team]/                              # e.g. montana-state-bobcats
│       │       ├── layout.tsx                       # team header band, sport tabs (only sports the school has)
│       │       ├── page.tsx                         # overview across sports
│       │       ├── news/page.tsx                    # all-sport team news ?page=n
│       │       └── [teamSport]/                     # football | mens-basketball | womens-basketball
│       │           ├── page.tsx                     # sport section overview
│       │           ├── news/page.tsx                # ?page=n
│       │           └── rankings/page.tsx            # poll history for this sport
│       ├── people/[slug]/page.tsx                   # ?page=n on the river
│       ├── topics/[slug]/page.tsx                   # ?page=n
│       ├── podcasts/page.tsx
│       ├── podcasts/[show]/page.tsx
│       ├── podcasts/[show]/[episode]/page.tsx
│       ├── video/page.tsx
│       ├── video/[slug]/page.tsx
│       ├── bracket-challenge/page.tsx               # all sports
│       ├── transfer-portal/page.tsx                 # Portal Tracker, filters in searchParams (§16.1)
│       ├── newsletters/page.tsx
│       ├── onboarding/page.tsx                      # also opens as dialog/drawer
│       ├── search/page.tsx
│       └── account/
│           ├── page.tsx
│           ├── follows/page.tsx
│           ├── saved/page.tsx
│           └── notifications/page.tsx
├── src/
│   ├── routes/                                      # route modules + factory (shared by generated stubs)
│   │   ├── manifest.ts
│   │   ├── sport-hub.tsx  sport-news.tsx  article.tsx  division-hub.tsx  division-news.tsx
│   │   ├── conference.tsx  team-directory.tsx  rankings.tsx  ballots.tsx  portal-hub.tsx  recruiting-hub.tsx
│   │   └── bracket.tsx  feed.ts
│   ├── components/                                  # app-specific compositions (shared UI is in @rs/ui)
│   └── lib/
├── scripts/routes-gen.ts
├── middleware.ts                                    # Clerk only (auth state); no rewrites, no redirects
└── next.config.ts                                   # no rewrites(); redirects() only for legacy patterns (§27)
```

`[teamSport]` uses `generateStaticParams` + `dynamicParams = false` with the three values; the layout also 404s if the school has no team in that sport.

### 17.5 Top-level and section maps

```text
/                                         Home
/college-football                         Sport hub (news, rankings, bracket CTAs, external links)
/mens-college-basketball                  Sport hub
/womens-college-basketball                Sport hub
/teams                                    All schools (search, A–Z)
/teams/{school-slug-nickname}             Team hub across sports, e.g. /teams/montana-state-bobcats
/people/{slug}                            Person profile
/topics/{slug}                            Topic pages
/podcasts, /podcasts/{show}, /podcasts/{show}/{episode}
/video, /video/{slug}
/bracket-challenge                        All active bracket challenges
/transfer-portal                          Portal Tracker (?sport=&division=&status=&position=&conference=&school=&sort=&page=)
/newsletters, /onboarding, /search, /account/...
/sign-in, /sign-up                        Clerk primary sign-in (shared across subdomains)
/{page-slug}                              Page-builder pages (catch-all) → legacy 301 lookup → 404
```

| URL | Page | Notes |
|---|---|---|
| `/college-football` | Sport hub | |
| `/college-football/{fbs\|fcs\|d2\|d3\|naia}` | Division hub | News, poll, bracket CTA, outbound links |
| `/college-football/news` (`?page=n`) | All CFB news | §17.6 |
| `/college-football/news/{slug}` | **Article** | Immutable slug + sport |
| `/college-football/fcs/news` (`?page=n`) | Division news | |
| `/college-football/conferences`, `/conferences/{conf}` | Conference index / hub | |
| `/college-football/teams` | Sport directory | Each row links to `/teams/{slug}/football` |
| `/college-football/rankings` | Rankings landing | |
| `/college-football/rankings/fcs` | **Current FCS Top 25** | |
| `/college-football/rankings/fcs/2026/week-7` | Archive poll week | |
| `/college-football/rankings/fcs/2026/week-7/ballots` | **Voter Ballot Breakdown** | Matrix, outliers, `?voters=a,b` filter (canonical to base) |
| `/college-football/rankings/fcs/2026/week-7/ballots/{voter}` | One voter's ballot | |
| `/college-football/rankings/fcs/voters`, `/voters/{voter}` | Voter panel / profile | |
| `/college-football/rankings/methodology` | Methodology | |
| `/college-football/transfer-portal` (`?page=n`) | **Portal hub** (article-driven) | §16 |
| `/transfer-portal` (`?division=fcs…`) | **Portal Tracker** (all sports, `portalEntry` rows) | Filters are query params; only sport/division/page are indexable (§16.1) |
| `/college-football/recruiting` (`?page=n`) | **Recruiting hub** (article-driven) | §16 |
| `/college-football/bracket-challenge` | Football bracket hub | |
| `/college-football/bracket-challenge/fcs` | Division landing | Current year card + past years; **renders, never redirects** |
| `/college-football/bracket-challenge/fcs/2026` | **Event** (rules/countdown before lock; bracket view after) | |
| `…/fcs/2026/my-bracket`, `/leaderboard?page=n`, `/entries/{id}`, `/groups`, `/groups/{id}`, `/join/{code}` | Bracket sub-pages | |
| `/teams/montana-state-bobcats` | **Team hub** (all sports) | Sport tabs + overview |
| `/teams/montana-state-bobcats/football` | Football section | News, poll history, bracket history, outbound links |
| `/teams/montana-state-bobcats/football/news` (`?page=n`) | Football news for the team | |
| `/teams/montana-state-bobcats/football/rankings` | Poll history | |
| `/teams/montana-state-bobcats/mens-basketball`, `/womens-basketball` | Basketball sections | Same sub-pages |
| `/teams/montana-state-bobcats/news` (`?page=n`) | All-sport team news | |

**Team slug rules.** `schools.slug` is the public hub slug `{school}-{nickname}` (lowercase, hyphenated): `montana-state-bobcats`, `north-dakota-state-bison`, `villanova-wildcats`. It is unique, generated once from `short_name` + `nickname`, and immutable (no redirects); a rare rebrand is handled by a manual one-time legacy 301 entry. `schools.short_slug` (`montana-state`) is kept for internal lookups and display, never in URLs.

Basketball mirrors the sport map, e.g. `/mens-college-basketball/rankings/d1/2026/week-9`, `/womens-college-basketball/news/{slug}`.

### 17.6 Pagination: `?page=n` (SI / The Athletic pattern)

Every list page paginates with a query parameter: `/college-football/news?page=2`, `/college-football/fcs/news?page=3`, `/teams/montana-state-bobcats/news?page=2`, `/topics/{slug}?page=2`, `…/leaderboard?page=4`.

| Rule | Implementation |
|---|---|
| Page 1 | No parameter. `/college-football/news` is page 1 and its canonical. |
| `?page=1` | Renders page 1 with canonical **without** the parameter (no redirect). |
| Page n ≥ 2 | **Self-referencing canonical** including the param: `https://www.redshirtsports.com/college-football/news?page=2`. Title/description get " – Page 2". |
| Invalid (`page=0`, `-1`, `abc`, `2.5`) or > total pages | `notFound()` → 404. Hard cap 500 to avoid crawl traps. |
| Other query params (`utm_*`, unknown) | Ignored for rendering; stripped from the canonical. |
| `rel="prev"/"next"` | **Not needed.** Google stopped using them for indexing in 2019; plain `<a href="?page=n">` links in shadcn `Pagination` are enough. (Harmless to add; we don't.) |
| Indexing deep pages | **Index all valid pages** (`index,follow`), no `noindex` beyond a depth: deep pages are crawl paths to older articles. Discovery mainly runs through the sitemaps anyway (§19). |
| "Load more" | Progressive enhancement: the button fetches `/api/river?sport=cfb&page=3`, appends items and updates the URL with `history.replaceState` to `?page=3`; without JS it's a normal link. |

**Caching with `?page=`** (Next.js Cache Components / PPR):

- Reading `searchParams` makes the part of the tree that awaits it **request-time**, so the page itself is not a fully static file the way `/page/n` was. Keep the cost tiny by structure:
  1. The **shell** (header, hub chrome, rail, ad slots) doesn't touch `searchParams` → prerendered static shell.
  2. The **river** awaits `searchParams` inside `<Suspense>` and calls a **`"use cache"` data function with the page number as an argument**. Cache keys include the arguments, so each `(sport, division, page)` result is cached and shared across all requests, invalidated by `cacheTag("posts:<sport>")` when Sanity publishes.
  3. Rendering the river from cached data is a few milliseconds; the static shell streams immediately (good TTFB/LCP).

```ts
// packages/sanity/src/queries/news.ts
import { cacheTag, cacheLife } from "next/cache";
export async function getNewsPage({ sport, division, page }: { sport: Sport; division?: string; page: number }) {
  "use cache";
  cacheTag(`posts:${sport}`, division ? `posts:${sport}:${division}` : `posts:${sport}:all`);
  cacheLife("hub");
  const size = 24, start = (page - 1) * size;
  const [items, total] = await Promise.all([
    client.fetch(newsPageQuery, { sport, division: division ?? null, start, end: start + size }),
    client.fetch(newsCountQuery, { sport, division: division ?? null }),
  ]);
  return { items, totalPages: Math.max(1, Math.ceil(total / size)) };
}

// packages/seo/src/pagination.ts
export const parsePage = (v?: string) => {
  if (v === undefined) return 1;
  if (!/^\d{1,3}$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= 500 ? n : null;
};
export const pageMetadata = ({ base, page, title }: { base: string; page: number; title: string }) => ({
  title: page > 1 ? `${title} – Page ${page}` : title,
  alternates: { canonical: page > 1 ? `${base}?page=${page}` : base },
  robots: { index: true, follow: true },
});
```

Trade-off accepted: `?page=` pages pay a small per-request render for the river (cached data), whereas `/page/n` could be served as static files. In exchange URLs match SI/The Athletic, there are no extra route folders, and filters can share the same query-string model.

### 17.7 Vote and admin app routes

Same 1:1 rule (no rewrites). **`apps/vote`** (`vote.redshirtsports.com`, noindex): `/` voter home, `/invite/{token}`, `/ballot/{poll}/{year}/{week}`, `/history`, `/profile`. **`apps/admin`** (`admin.redshirtsports.com`, staff only): `/ops/polls`, `/ops/polls/{weekId}`, `/ops/voters`, `/ops/voters/invites`, `/ops/voters/rosters/{poll}/{season}`, `/ops/voters/{voterId}`, `/ops/brackets`, `/ops/brackets/{sport}/{division}/{year}` (settings, field), `/ops/brackets/{sport}/{division}/{year}/results`, `/ops/schools`, `/ops/content/curated-lists` (link to Studio), `/ops/legacy-redirects`, `/ops/users`, `/ops/newsletters`, `/api/cron/*`. Non-staff who reach `admin.` see a **403 page** with a link to `vote.` (no redirect).

```text
apps/vote/app/                               apps/admin/app/
├── layout.tsx, page.tsx                     ├── layout.tsx                       # staff gate → 403 page
├── invite/[token]/{page.tsx,actions.ts}     ├── ops/polls/{page.tsx,[weekId]/page.tsx}
├── ballot/[poll]/[year]/[week]/             ├── ops/voters/{page.tsx,invites/,rosters/[poll]/[season]/,[voterId]/}
│   ├── page.tsx                             ├── ops/brackets/{page.tsx,[sport]/[division]/[year]/{page.tsx,field/,results/}}
│   └── actions.ts                           ├── ops/{schools,legacy-redirects,users,newsletters}/page.tsx
├── history/page.tsx                         ├── api/cron/{poll-tick,invite-expire,reminders,role-reconcile}/route.ts
├── profile/page.tsx                         └── robots.ts
└── robots.ts
```

### 17.8 Route code: article and root catch-all

```tsx
// apps/web/src/routes/article.tsx (bound per sport by the factory)
import { notFound } from "next/navigation";
export function article(sport: Sport) {
  async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);              // "use cache", tag post:<slug>
    if (!post || post.primarySport !== sport) notFound(); // slug + sport immutable → no redirects needed
    return <Article post={post} />;
  }
  return { Page, generateMetadata: articleMetadata(sport), generateStaticParams: recentSlugs(sport, 200) };
}
```

```tsx
// apps/web/app/(site)/[...slug]/page.tsx
import { notFound, permanentRedirect } from "next/navigation";
export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = "/" + (await params).slug.join("/");
  const page = await getPageByPath(path);                 // Sanity page builder
  if (page) return <PageBuilder page={page} />;
  const legacy = await lookupLegacyRedirect(path);        // one-time 301s from old Redshirt URLs only (§27)
  if (legacy) permanentRedirect(legacy);
  notFound();
}
```

- `RESERVED_ROOT_SEGMENTS` (§12.8) is generated from the same manifest plus the static root folders, and shared with Studio slug validation.
- `@rs/seo/urls` is the **only** place URLs are built:

```ts
// packages/seo/src/urls.ts
import { SPORTS, type Sport } from "@rs/web-routes/manifest";   // or a copy in @rs/seo
type Week = number | "preseason" | "final";
const weekSeg = (w: Week) => (typeof w === "number" ? `week-${w}` : w);
const q = (page?: number) => (page && page > 1 ? `?page=${page}` : "");

export const urls = {
  sport: (s: Sport) => `/${SPORTS[s].path}`,
  division: (s: Sport, d: string) => `/${SPORTS[s].path}/${d}`,
  news: (s: Sport, page?: number) => `/${SPORTS[s].path}/news${q(page)}`,
  divisionNews: (s: Sport, d: string, page?: number) => `/${SPORTS[s].path}/${d}/news${q(page)}`,
  article: (p: { primarySport: Sport; slug: string }) => `/${SPORTS[p.primarySport].path}/news/${p.slug}`,
  team: (schoolSlug: string) => `/teams/${schoolSlug}`,                                         // montana-state-bobcats
  teamSport: (schoolSlug: string, s: Sport, tab?: "news" | "rankings", page?: number) =>
    `/teams/${schoolSlug}/${SPORTS[s].teamPath}${tab ? `/${tab}` : ""}${q(page)}`,
  teamNews: (schoolSlug: string, page?: number) => `/teams/${schoolSlug}/news${q(page)}`,
  person: (slug: string, page?: number) => `/people/${slug}${q(page)}`,
  pollCurrent: (s: Sport, d: string) => `/${SPORTS[s].path}/rankings/${d}`,
  pollWeek: (s: Sport, d: string, y: number, w: Week) => `/${SPORTS[s].path}/rankings/${d}/${y}/${weekSeg(w)}`,
  ballots: (s: Sport, d: string, y: number, w: Week) => `${urls.pollWeek(s, d, y, w)}/ballots`,
  ballot: (s: Sport, d: string, y: number, w: Week, voter: string) => `${urls.ballots(s, d, y, w)}/${voter}`,
  portal: (s: Sport, page?: number) => `/${SPORTS[s].path}/transfer-portal${q(page)}`,
  portalTracker: (f: Partial<PortalFilters> = {}) => portalCanonical({ sport: "football", sort: "newest", page: 1, ...f } as PortalFilters),
  recruiting: (s: Sport, page?: number) => `/${SPORTS[s].path}/recruiting${q(page)}`,
  bracketDivision: (s: Sport, d: string) => `/${SPORTS[s].path}/bracket-challenge/${d}`,
  bracketEvent: (s: Sport, d: string, y: number) => `/${SPORTS[s].path}/bracket-challenge/${d}/${y}`,
  bracketEntry: (s: Sport, d: string, y: number, id: string) => `${urls.bracketEvent(s, d, y)}/entries/${id}`,
  bracketJoin: (s: Sport, d: string, y: number, code: string) => `${urls.bracketEvent(s, d, y)}/join/${code}`,
  voteInvite: (token: string) => `${process.env.NEXT_PUBLIC_VOTE_URL}/invite/${token}`,
  voteBallot: (poll: string, y: number, w: Week) => `${process.env.NEXT_PUBLIC_VOTE_URL}/ballot/${poll}/${y}/${weekSeg(w)}`,
};
```

### 17.9 Why these choices

| Decision | Reason |
|---|---|
| Static sport folders, no rewrites | Folders = URLs (James's rule); no internal paths to hide; simpler mental model for Cursor and for debugging |
| Route factory + codegen | One implementation per page type; three sport trees can't drift |
| Article `/{sport}/news/{slug}`, immutable | Short, keyword-rich; immutability removes slug-change redirects |
| Sport-agnostic `/teams/{school-nickname}` | On3-style single brand page per school; nickname disambiguates (e.g. two "Miami"s) and reads well; sport sections inside |
| `?page=n` | Matches SI/The Athletic; fewer folders; caching handled by `"use cache"` data functions (§17.6) |
| Bracket path `{division}/{year}` | One event per division per season; the URL is the key |
| Bracket division landing renders | "Latest year" without a redirect: shows the current event card and archive, links to `/{year}` |
| Voting on `vote.` | Separate high-trust audience; public `www` stays cacheable |


---

## 18. Rendering and caching strategy

### 18.1 Model

Use Next.js **Cache Components** (`"use cache"`, `cacheTag`, `cacheLife`) with **Partial Prerendering**: each page is a static shell prerendered at build or first request, with dynamic holes wrapped in `<Suspense>` (user menu, personalized "your teams", paywall state). Data functions are cached by tag and invalidated on events, not on timers, wherever an event exists.

```ts
// next.config.ts (apps/web)
import type { NextConfig } from "next";
const config: NextConfig = {
  cacheComponents: true,
  transpilePackages: ["@rs/ui", "@rs/db", "@rs/sanity", "@rs/polls", "@rs/brackets", "@rs/seo"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  experimental: { typedRoutes: true },
};
export default config;
```

> Check the current Next.js docs for the exact flag names (`cacheComponents`, `dynamicIO`, `ppr`) for your version; they changed between Next 15 and 16.

### 18.2 Cache tags

| Tag | Invalidated by |
|---|---|
| `post:<slug>`, `post:<id>` | Sanity webhook |
| `posts:list`, `posts:<sport>`, `posts:school:<schoolId>`, `posts:conf:<confId>`, `posts:person:<id>` | Sanity webhook (computed from projection) |
| `person:<id>`, `page:<slug>`, `pages:with-people` | Sanity webhook (person changes also expire pages with staff grids) |
| `school:<schoolId>`, `conference:<confId>` | Sanity webhook, admin |
| `homepage`, `settings` | Sanity webhook |
| `poll:<slug>`, `poll:<slug>:<year>`, `poll:<slug>:<year>:<week>` | Publish job |
| `team:<teamId>:rankings` | Poll publish job |
| `bracket:<sport>:<division>:<year>`, `…:leaderboard`, `…:group:<id>`, `…:entry:<id>` | Field set, lock, **admin result entry** (`setBracketGameResult`) |
| `redirects` | Admin edits in `/ops/legacy-redirects` (legacy 301s only) |

### 18.3 `cacheLife` profiles

```ts
// next.config.ts
cacheLife: {
  article: { stale: 300, revalidate: 3600, expire: 86400 * 30 },
  hub:     { stale: 60,  revalidate: 600,  expire: 86400 },
  bracket: { stale: 30,  revalidate: 60,   expire: 86400 },
  rankings:{ stale: 300, revalidate: 86400, expire: 86400 * 365 },
}
```

Tags do the real work; `revalidate` timers are a safety net in case a webhook is missed.

### 18.4 Sanity webhook → revalidate

```ts
// apps/web/app/api/revalidate/sanity/route.ts
import { revalidateTag } from "next/cache";
import { parseBody } from "next-sanity/webhook";

type Payload = { _id: string; _type: string; slug?: string; oldSlug?: string; schoolIds?: string[]; sport?: string };

export async function POST(req: Request) {
  const { isValidSignature, body } = await parseBody<Payload>(req, process.env.SANITY_REVALIDATE_SECRET);
  if (!isValidSignature || !body?._type) return new Response("invalid", { status: 401 });
  const tags = new Set<string>([`${body._type}:${body._id}`]);
  if (body.slug) tags.add(`${body._type}:${body.slug}`);
  if (body.oldSlug && body.oldSlug !== body.slug) tags.add(`${body._type}:${body.oldSlug}`);
  if (body._type === "post") {
    tags.add("posts:list");
    if (body.sport) tags.add(`posts:${body.sport}`);
    body.schoolIds?.forEach((id) => tags.add(`posts:school:${id}`));
    tags.add("sitemap:news");
  }
  if (body._type === "portalEntry") { tags.add("portal"); if (body.sport) tags.add(`portal:${body.sport}`); }
  if (body._type === "homepage" || body._type === "siteSettings") tags.add(body._type);
  for (const t of tags) revalidateTag(t, "max");   // stale-while-revalidate semantics in recent Next.js
  return Response.json({ revalidated: [...tags] });
}
```

Post `slug` and `primarySport` are read-only after first publish (custom Studio input + `readOnly: ({document}) => Boolean(document?.firstPublishedAt)`), so publishing never needs a redirect. In the rare legal/error case where a URL must change, an admin unpublishes and republishes under a new slug; the old URL 404s (or, if it was widely shared, an admin adds a manual one-time legacy 301 in `/ops/legacy-redirects`).

### 18.5 Cross-app revalidation

`apps/admin` and `apps/vote` cannot call `revalidateTag` on `apps/web` directly (separate deployments). They POST to `www…/api/revalidate/tags` with a bearer secret:

```ts
// packages/db/src/revalidate.ts (used by admin/vote after commits)
export async function revalidateWeb(tags: string[]) {
  await fetch(`${process.env.WEB_URL}/api/revalidate/tags`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.REVALIDATE_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ tags }),
  });
}

// apps/web/app/api/revalidate/tags/route.ts
import { revalidateTag } from "next/cache";
export async function POST(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.REVALIDATE_TOKEN}`) return new Response("no", { status: 401 });
  const { tags } = (await req.json()) as { tags: string[] };
  for (const t of tags.slice(0, 50)) revalidateTag(t, "max");
  return Response.json({ ok: true });
}
```

There is no live data. Bracket leaderboards use tag revalidation on result entry plus the 60 s `bracket` profile as a safety net.

### 18.6 Draft mode and visual editing

`/api/draft-mode/enable` validates Sanity's preview secret (via `defineEnableDraftMode`), sets draft mode, and pages fetch with `perspective: "drafts"` and stega for click-to-edit in the Presentation tool. Draft fetches bypass the cache.

### 18.7 Static generation scope

`generateStaticParams` for: top N recent articles, news pages 2–5 per sport, all division hubs, current-season poll weeks, current bracket events (four football divisions), all team hubs for the current season. Everything else renders on first request and is cached (ISR). Nothing on `www` reads `searchParams` except `/search` and `my-bracket?entry=`.

---

## 19. SEO and AEO

### 19.1 Technical SEO checklist

| Item | Implementation |
|---|---|
| Titles/descriptions | `generateMetadata` via `@rs/seo/metadata` builder; Sanity `seo` overrides; title ≤ ~60 chars, description ≤ ~155 |
| Canonicals | Always absolute, one canonical per piece; syndicated copies point to original |
| Robots | `noindex` for search, account, join links, pick editor, draft previews; `vote.` and `admin.` are `Disallow: /` |
| Sitemaps | Index at `/sitemap.xml` → `/sitemaps/posts/[n].xml` (≤ 50,000 URLs each), `/sitemaps/teams.xml`, `/sitemaps/rankings.xml`, `/sitemaps/brackets.xml`, `/sitemaps/pages.xml`, `/sitemaps/people.xml` |
| News sitemap | `/news-sitemap.xml` with only articles from the **last 48 hours** (Google News requirement), `<news:publication>` name + language, `<news:publication_date>`, `<news:title>` |
| Google News | Publisher Center listing, clear bylines linked to `/people/{slug}` profiles, dated articles, contact/about/editorial policy pages, no deceptive practices |
| Structured data | JSON-LD per page type (below), validated in CI with a schema test |
| Internal linking | Auto-link first mention of each tagged school to its hub; "More on {team}" modules; breadcrumbs everywhere |
| Pagination | `?page=n`, page 1 without param, self-canonical per page, no rel prev/next (§17.6) |
| Performance | Core Web Vitals budgets (§26) |
| Images | Descriptive alt, 1200 px+ wide images for Discover (max-image-preview:large meta) |
| Hreflang | Not needed (English, US) |
| Legacy URLs | 301 map (§27) |
| IndexNow | Optional ping for Bing on publish |

### 19.2 JSON-LD by page type

| Page | Types |
|---|---|
| Article | `NewsArticle` (or `AnalysisNewsArticle`, `OpinionNewsArticle`, `ReportageNewsArticle`) + `BreadcrumbList` + `Person` authors + `Organization` publisher with logo |
| Team hub | `SportsTeam` with `sport`, `memberOf` (conference `SportsOrganization`), `logo`, `sameAs` (official site from Sanity `links`) |
| Poll week | `ItemList` of `SportsTeam` entries in rank order + `Dataset` (optional) describing the ballots export |
| Person profile (`/people/{slug}`) | `ProfilePage` with `mainEntity` `Person` (`jobTitle`, `image`, `sameAs`, `worksFor` when staff) |
| Page-builder pages | `WebPage` / `AboutPage` / `ContactPage`, plus `FAQPage` from `faq` sections and `JobPosting` from `jobListings` |
| Podcast episode | `PodcastEpisode` |
| Video | `VideoObject` |
| Site-wide | `Organization`, `WebSite` with `SearchAction` |

```ts
// packages/seo/src/jsonld/article.ts
import type { NewsArticle, WithContext } from "schema-dts";
export function articleJsonLd(p: {
  url: string; headline: string; description: string; images: string[]; publishedAt: string; updatedAt: string;
  authors: { name: string; url: string }[]; section: string; isPremium: boolean; keywords: string[];
}): WithContext<NewsArticle> {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: p.url,
    headline: p.headline.slice(0, 110),
    description: p.description,
    image: p.images,                               // 16:9, 4:3, 1:1 crops via Sanity image URLs
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    author: p.authors.map((a) => ({ "@type": "Person", name: a.name, url: a.url })),
    publisher: { "@type": "Organization", name: "Redshirt Sports", logo: { "@type": "ImageObject", url: "https://www.redshirtsports.com/logo-600x60.png" } },
    articleSection: p.section,
    keywords: p.keywords.join(", "),
    isAccessibleForFree: !p.isPremium,
    ...(p.isPremium && { hasPart: { "@type": "WebPageElement", isAccessibleForFree: false, cssSelector: ".paywalled" } }),
  };
}
```

The `isAccessibleForFree` + `hasPart` markup is how Google recommends marking paywalled content so it isn't treated as cloaking.

### 19.3 News sitemap route

```ts
// apps/web/app/news-sitemap.xml/route.ts
import { client } from "@rs/sanity/client";
import { newsSitemapQuery } from "@rs/sanity/queries";
import { urls } from "@rs/seo/urls";

export async function GET() {
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const posts = await client.fetch(newsSitemapQuery, { since }, { next: { tags: ["sitemap:news"], revalidate: 300 } });
  const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${posts.map((p) => `<url><loc>https://www.redshirtsports.com${urls.article(p)}</loc>
<news:news><news:publication><news:name>Redshirt Sports</news:name><news:language>en</news:language></news:publication>
<news:publication_date>${p.publishedAt}</news:publication_date><news:title>${esc(p.title)}</news:title></news:news></url>`).join("\n")}
</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, s-maxage=300" } });
}
```

(`urls` comes from `@rs/seo/urls` (§17.7); the query must project `primarySport` and `"slug": slug.current`.)

### 19.4 OG images

- `opengraph-image.tsx` per route segment using `next/og` `ImageResponse` (1200×630): article (title, image, team logos, author), poll week (top 5 with movement), team "Ranked No. X" card, bracket entry (champion + final four).
- Fonts bundled from `packages/ui/fonts`; logos from Sanity as PNG (SVG support in `ImageResponse` is limited for complex SVGs).
- Cache by content hash; regenerate on revalidate.

### 19.5 AEO (answer-engine optimization)

AI answer engines and AI Overviews favor clear, citable, structured facts.

- **Answer-first ledes**: recaps and previews open with a one-paragraph factual summary (who, score, when, what it means).
- **Fact boxes**: game recaps include a structured "Key facts" block (final score, records after, next game) rendered as HTML lists (not images) and matched in JSON-LD.
- **Stable data pages**: poll pages, ballot pages and bracket pages are canonical sources of truth with dates; LLM crawlers and search engines can cite them.
- **Methodology and FAQ pages** (`FAQPage` markup where appropriate) for "How does the Redshirt FCS Top 25 work?", "How does the FCS playoff bracket work?".
- **Author authority**: `/people/{slug}` profiles with credentials and beats, linked from every byline.
- **`llms.txt`** (optional, emerging convention) listing key sections and data pages.
- **Robots policy for AI crawlers**: decide per crawler (e.g. allow search-oriented bots, consider blocking pure training crawlers); revisit as licensing options mature.
- **Freshness**: `dateModified` accurate; update recaps with final stats.

---

## 20. Monetization

### 20.1 Revenue streams by phase

| Stream | Phase | How | Notes |
|---|---|---|---|
| Programmatic display ads | P1 | Header bidding via an ad management partner (e.g. Raptive, Mediavine, Freestar, or Google Ad Manager directly once traffic qualifies) | Partner thresholds and revenue share vary; compare offers |
| Direct-sold sponsorships | P1 | Sponsored poll ("presented by"), sponsored bracket challenge, newsletter sponsorships, podcast reads | Highest margin for a niche audience (FCS, D-II, D-III communities, local businesses, sports betting where legal and brand-appropriate) |
| Subscriptions ("Redshirt+") | P2 | Monthly/annual plan: ad-free, premium articles, early poll access for members (not before public release; e.g. ballot analytics) | Clerk Billing or Stripe |
| Affiliate | P2 | Tickets, merchandise, streaming services | Clear disclosure |
| Data licensing | P3 | Poll data/API to partners | After poll credibility is established |
| Events | P3 | Awards (e.g. Redshirt All-America), streamed podcasts | |

### 20.2 Ads implementation

- `packages/ui` `AdSlot` component with **reserved dimensions** per breakpoint (prevents CLS), lazy-loaded below the fold, `data-slot` ids mapped in a config (`ads.config.ts`) per page type.
- Load the ad stack only after consent (CMP for GDPR/CCPA/US state laws; Google requires a certified CMP for EEA traffic) and after `requestIdleCallback`.
- No ads on account, ballot, pick editor; fewer ads for subscribers (`entitlements`).
- `ads.txt` served from `/ads.txt` (managed in Sanity `siteSettings` or a static file).
- Sponsored content uses `sponsor` reference → "Sponsored by X" label, `rel="sponsored"` on links, and is excluded from the Google News sitemap if it's advertorial.

### 20.3 Subscriptions: Clerk Billing vs Stripe

| Factor | Clerk Billing | Stripe Billing directly |
|---|---|---|
| Integration effort | Lowest: plans and pricing table components, entitlements on the session via `has({ plan })` / `has({ feature })` | Medium: Checkout, Customer Portal, webhooks, entitlement sync |
| Flexibility | Fewer knobs (check current support for coupons, trials, taxes, multiple currencies) | Everything: coupons, trials, metered, gift subs, group/team plans |
| Payments processor | Uses Stripe under the hood (check current details and fees) | Stripe |
| Data in Postgres | Mirror via Clerk billing webhooks | Mirror via Stripe webhooks |
| Recommendation | **Start here** for a simple "Redshirt+" plan | Move when you need gift subs, group/student pricing, complex promotions |

Either way, the app checks **one function**: `getEntitlements(userId)` from `@rs/billing`, which reads session claims first and falls back to the `entitlements` table.

### 20.4 Paywall metering (The Athletic-style)

Rules (configurable in Sanity `siteSettings.paywall`):
- `mode`: `off` | `metered` | `hard` (per article `isPremium` overrides).
- Anonymous: N free premium articles per 30 days, tracked in a signed, HttpOnly cookie (`rs_meter`, HMAC-signed list of content ids + period). Clearing cookies resets it; that's an accepted leak.
- Signed-in free users: M articles per month tracked in `meter_events` (more generous, encourages registration, which builds the email list).
- Subscribers: unlimited.
- Always free: breaking news, poll pages, bracket challenge, recaps (configurable); if you let search crawlers index premium text, mark it with the paywall structured data in §19.2 and verify crawlers by reverse DNS (user-agent strings alone are spoofable); otherwise index only the free preview.

Implementation: the article page's static shell renders the full article for crawlers and the first 3 paragraphs for everyone; a dynamic `<PaywallGate>` hole (inside Suspense) decides on the server, reading cookie/session, whether to stream the rest or show the offer. Do not ship the premium body to the client when the gate is closed.

```ts
// packages/billing/src/meter.ts
export type MeterDecision = { allowed: boolean; remaining: number; reason: "subscriber" | "free" | "metered" | "limit" };
export function decide(opts: { isPremium: boolean; mode: "off" | "metered" | "hard"; isSubscriber: boolean; viewedThisPeriod: string[]; contentId: string; limit: number }): MeterDecision {
  if (!opts.isPremium || opts.mode === "off") return { allowed: true, remaining: opts.limit, reason: "free" };
  if (opts.isSubscriber) return { allowed: true, remaining: Infinity, reason: "subscriber" };
  if (opts.mode === "hard") return { allowed: false, remaining: 0, reason: "limit" };
  const already = opts.viewedThisPeriod.includes(opts.contentId);
  const used = opts.viewedThisPeriod.length;
  if (already || used < opts.limit) return { allowed: true, remaining: Math.max(0, opts.limit - used - (already ? 0 : 1)), reason: "metered" };
  return { allowed: false, remaining: 0, reason: "limit" };
}
```

### 20.5 Sponsored brackets and contest law

- A free bracket challenge with **no prize** is the lowest-risk structure.
- Adding prizes turns it into a sweepstakes or skill contest: it needs official rules, eligibility (age, residency), no purchase necessary, void-where-prohibited, possibly bonding/registration in some states (historically New York and Florida for larger prize values), and sponsor agreements. **Get legal review before offering prizes.** Never charge entry fees.
- Sponsor deliverables: branded landing page (`bracketPromo`), logo on bracket and share images, sponsor-named system group, newsletter mentions, opt-in marketing checkbox (separate and unchecked) if the sponsor wants leads.

---

## 21. Notifications, newsletter, mobile and PWA

### 21.1 Notification matrix

| Trigger | Email | Web push | In-app |
|---|---|---|---|
| Breaking news about a favorite team | Optional digest | Yes (opt-in) | Badge |
| Poll published | Poll newsletter list | Topic `poll:<slug>` | Banner |
| Your team moved in the poll | Weekly digest | Yes | |
| Voter: invite (and reminder 3 days before expiry), window opened / closing in 12 h / 2 h / ballot received, roster renewal | Yes (transactional) | Yes | Admin app banner |
| Bracket: event opens, lock in 24 h / 1 h, group invite accepted, daily recap of your standing | Yes | Yes | |
| New article about a followed team | My Teams digest | Yes (opt-in, max 2/day) | |
| Subscription receipts/renewals | Yes (billing) | No | |

Retention strategy, newsletter lineup, push topics and metrics are specified in §31. User preferences live in a `notification_prefs` table (`user_id`, `channel`, `topic`, `enabled`), editable at `/account/notifications`. Every email has one-click unsubscribe (`List-Unsubscribe` + `List-Unsubscribe-Post` headers, required by major mailbox providers for bulk senders).

### 21.2 Newsletter with Resend

- Domain: send from a subdomain (`news.redshirtsports.com` for marketing, `mail.redshirtsports.com` for transactional) with SPF, DKIM, DMARC (`p=quarantine` once aligned) to protect the root domain's reputation.
- Lists: `daily` (top stories), `fcs-weekly`, `fbs-weekly`, `d2-d3-weekly`, `hoops-weekly`, `poll-alerts`, `bracket-challenge`, and per-team lists generated on demand (`team:<id>`).
- Double opt-in for marketing lists: signup action writes `pending` + hashed token, sends confirm email; confirm route flips to `active` and syncs to the Resend audience/segment.
- Templates in `packages/emails` (React Email) with shared header/footer; preview with `email dev`.
- Digest generation: a cron route on `apps/admin` queries Sanity for the last 24 h/7 d per list, renders, and sends a broadcast via the Resend API; logs to `newsletter_sends`.
- Webhooks from Resend (bounced, complained, delivered, opened if enabled) update `newsletter_subscriptions.status`.

```ts
// apps/web/app/(site)/newsletters/actions.ts
"use server";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { adminDb } from "@rs/db";
import { newsletterSubscriptions } from "@rs/db/schema";
import { sql } from "drizzle-orm";
import { ConfirmEmail } from "@rs/emails/confirm";
import { ratelimit } from "@/server/ratelimit";
import { headers } from "next/headers";

const schema = z.object({ email: z.email(), lists: z.array(z.string()).min(1).max(10), source: z.string().max(40) });
const resend = new Resend(process.env.RESEND_API_KEY);

export async function subscribe(input: unknown) {
  const { email, lists, source } = schema.parse(input);
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success } = await ratelimit.limit(`newsletter:${ip}`);
  if (!success) return { ok: false, error: "Too many requests" };
  const token = randomBytes(24).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  await adminDb.insert(newsletterSubscriptions)
    .values(lists.map((listId) => ({ email, listId, source, status: "pending" as const, confirmTokenHash: hash })))
    .onConflictDoUpdate({
      target: [newsletterSubscriptions.email, newsletterSubscriptions.listId],
      set: { confirmTokenHash: hash },
      setWhere: sql`${newsletterSubscriptions.status} in ('pending','unsubscribed')`,   // don't touch active or bounced rows
    });
  await resend.emails.send({
    from: "Redshirt Sports <newsletters@news.redshirtsports.com>",
    to: email,
    subject: "Confirm your Redshirt Sports newsletter",
    react: ConfirmEmail({ url: `https://www.redshirtsports.com/newsletters/confirm?t=${token}` }),
  });
  return { ok: true };
}
```

### 21.3 Mobile and PWA

- **PWA first**: `app/manifest.ts` (name, icons 192/512 maskable, theme color, `display: standalone`, shortcuts to Rankings, My Bracket, Latest News), a service worker (Serwist) for offline shell + cached last-viewed articles and the user's bracket, and Web Push (VAPID) via `push_subscriptions`. iOS supports web push for installed home-screen web apps (iOS 16.4+).
- **Native apps later (P3)**: Expo (React Native) app in `apps/mobile` reusing `@rs/brackets`, `@rs/polls`, `@rs/db` types, Sanity queries and Clerk Expo SDK. Only justified once push/engagement data shows demand.
- **Mobile UX priorities**: bottom nav (Home, Rankings, Brackets, Me), thumb-friendly pick buttons ≥ 44×44 px, no interstitial ads.

---

## 22. Observability

### 22.1 Sentry

- `@sentry/nextjs` in web, vote and admin (client, server, edge configs via `instrumentation.ts` and `instrumentation-client.ts`).
- Source maps uploaded in CI (Vercel integration or `withSentryConfig`), release = git SHA.
- Tags: `app`, `route`, `sport`, `division`, `poll_week_id`, `bracket_event`. User context = Clerk id only (no email).
- **Cron monitors** (Sentry Crons) for every scheduled job: `poll-tick` (open/close/tabulate/publish), `invite-expire`, `reminders`, `role-reconcile`, `newsletter-daily`. Missed or failed check-ins page someone.
- Alert rules: error rate spike on `/api/webhooks/*`; any `BRACKET_LOCKED` errors spiking right before lock (expected) vs after (bug); tabulation failure (critical).
- Sample rates: errors 100%, traces 5–10% normally, 100% on ballot/bracket actions (low volume, high value). Session replay only on the admin app and pick editor at low sample, with masking.

### 22.2 PostHog

- Product analytics through PostHog's **managed reverse proxy** on a first-party subdomain (e.g. `t.redshirtsports.com` CNAME, configured in PostHog + DNS) to reduce ad-blocker loss, **not** a Next.js rewrite; respect consent.
- Event naming `object_action` in `@rs/analytics/events.ts`: `article_viewed`, `paywall_shown`, `paywall_converted`, `newsletter_subscribed`, `ballot_saved`, `ballot_submitted`, `bracket_entry_created`, `bracket_pick_made`, `bracket_completed`, `group_created`, `group_joined`, `share_clicked`, `push_opted_in`.
- Funnels: bracket landing → sign-up → entry complete → group join; article → newsletter signup; metered wall → subscribe.
- Feature flags for staged rollouts (paywall, new bracket UI), experiments (headline tests on homepage modules only, not SEO titles).
- Web analytics dashboard for traffic by sport/division/team; group analytics by `school` to see which fan bases engage.
- Server-side capture for authoritative events (`ballot_submitted`, `bracket_completed`) from server actions.

### 22.3 Logs and metrics

- Structured JSON logs (pino) with request id; Vercel log drains to a log store (Axiom, Better Stack or Datadog) if needed.
- Supabase: enable `pg_stat_statements`, review slow queries weekly in season; use Supabase advisors (security and performance lints) in CI.
- Uptime checks on `/`, `/college-football/rankings/fcs`, `/api/health` (checks DB, Sanity reachability).
- Business dashboards: ballots submitted per week vs voters, bracket entries per hour near lock, newsletter growth.

---

## 23. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Pure engines | Vitest | `@rs/polls` tabulation (ties, cutoff ties, movement, dropped), `@rs/brackets` formats (game counts, every slot used once, every game reachable, byes), resolve/validate/cascade, scoring maxima (720/800/640/760), tiebreak order |
| Property tests | fast-check | Random ballots: TS tabulation == SQL tabulation; random picks: score ≤ max_possible, monotonic as results arrive |
| SQL | pgTAP via `supabase test db` | RLS visibility matrix (anon, user A, user B, voter, admin), lock enforcement (submit after close → error), uniqueness, triggers, tabulation function golden tests |
| Integration | Vitest + local Supabase + Drizzle | Server actions with mocked Clerk `auth()`; webhook handlers with signed fixtures (svix, Sanity); `withRls` visibility; transaction-per-test with rollback |
| Invites | Vitest | Token tampering, expiry, reuse (second accept fails), revoked invite, resend invalidates the old link, email mismatch vs `allow_any_email`, concurrent double-accept, role sync and reconcile |
| Migrations | drizzle-kit `check` + drift check in CI | Schema and generated SQL never diverge |
| Components | Testing Library + happy-dom | PollTable, BracketGrid keyboard nav, ballot editor reorder |
| E2E | Playwright | Voter submits ballot; window closes; results publish; reader fills FCS bracket, creates group, friend joins with code; lock prevents edits; scores update leaderboard |
| Visual | Playwright screenshots (or Chromatic) | Bracket rendering for each format at mobile/desktop |
| Accessibility | axe-core in Playwright | Every key template; zero serious/critical violations |
| Performance | Lighthouse CI on preview deploys | Budgets in §26 |
| Load | k6 | Bracket lock surge (many saves in the last hour), leaderboard reads after a final, poll publish spike |
| Time travel | Fake timers + a `now()` override in SQL tests (`set local app.now = ...` read by a `app.now()` helper used instead of `now()` in lock checks) | Lock and window logic around boundaries |

**Golden fixtures**: store historical real brackets and ballots (anonymized) in `packages/testing/fixtures` and assert the engine reproduces published results exactly.

---

## 24. Security

| Area | Control |
|---|---|
| AuthN | Clerk; MFA required for staff and voters; session lifetime shorter for admin app |
| AuthZ | Role checks in middleware (coarse) + every server action/route (`requireRole`, `requireVoter(pollId)`) + RLS + security-definer functions with `search_path` pinned |
| Voter invites | HMAC-signed tokens (`VOTER_INVITE_SECRET`, rotatable; rotation invalidates outstanding links), only hashes stored, single-use and expiring, bound to verified email, admin-only creation with audit |
| Database roles | Runtime uses `rs_server` (DML only, `BYPASSRLS`); migrations use `postgres` from CI only; `withRls` uses transaction-local settings safe for Supavisor transaction mode |
| Secrets | Vercel env vars per environment; Supabase secret key only in server code (`server-only`); Vault for secrets used by pg_cron; rotate on staff departure |
| Webhooks | Verify signatures (svix for Clerk/Resend, Sanity signature, Stripe signature); reject replay via `webhook_events` dedupe; return 2xx only after processing |
| Cron endpoints | `Authorization: Bearer` with constant-time compare; Vercel Cron `CRON_SECRET` |
| Input validation | zod on every action; DB constraints as last line |
| Rate limiting | Upstash Ratelimit (or Postgres-based) on ballots, picks, joins, newsletter, search, invite acceptance, contact forms |
| Bots | Clerk bot protection on sign-up; Cloudflare Turnstile on public forms; Vercel Firewall / BotID rules for abusive patterns |
| Headers | CSP with nonces (Next.js middleware), `frame-ancestors 'none'` except Sanity Presentation origin for draft mode, HSTS preload, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` minimal |
| XSS | Portable Text renderer only (no raw HTML); embeds via allow-listed components; sanitize any user text (group names, bracket names) on output (React escapes by default) |
| CSRF | Server actions have built-in origin checks; route handlers that mutate check `Origin` |
| Data privacy | Minimal PII; IPs stored as salted hashes; data export/delete requests via `/account/privacy`; DPA with vendors; privacy policy covering Clerk, Supabase, Sanity, PostHog, Sentry, Resend, ad partners |
| Minors | Recruiting coverage of minors: no contact details, publish only public info; account sign-ups: Terms set a minimum age; delete accounts known to be under 13 (COPPA) |
| Supabase | Network restrictions on the DB, SSL enforced, PITR backups enabled, `anon` has no grants on private tables, Supabase security advisor clean |
| Sanity | Least-privilege tokens (read-only token for web, write token only if an admin job needs it), CORS origins limited, dataset private for drafts |
| Audit | Poll and bracket audit logs append-only; admin role changes logged |
| Incident response | Runbook: rotate keys, revoke sessions (Clerk), freeze poll week, communicate on the poll page |
| Dependencies | Renovate with grouped updates; `pnpm audit` in CI; lockfile-only installs |

---

## 25. Accessibility

Target **WCAG 2.2 AA**.

- Semantic HTML: `<article>`, `<nav>`, headings in order, `<table>` with `<caption>`, `scope` for poll and standings tables.
- Color: team colors pass contrast checks automatically (fallback to neutral); movement arrows also have text ("Up 3") not color only.
- Keyboard: ballot reordering with buttons and "move to rank" input (drag-and-drop is an enhancement); bracket picks are buttons in round lists; visible focus rings; skip links.
- Screen readers: countdown announces only at thresholds; images have alt text (Sanity required field); logos `alt="Montana State Bobcats logo"` only when meaningful, otherwise empty alt next to visible name.
- Motion: respect `prefers-reduced-motion` for bracket animations and confetti.
- Forms: labels, error messages tied with `aria-describedby`; Clerk components are accessible but check them with axe.
- Media: captions for video, transcripts for podcasts (also good for SEO/AEO).
- Testing: axe in CI, manual screen reader pass (VoiceOver + NVDA) on ballot editor and bracket editor before each season.

---

## 26. Performance budgets and image rules

### 26.1 Budgets (mobile, 75th percentile field data)

| Metric | Budget | Notes |
|---|---|---|
| LCP | ≤ 2.0 s (good threshold 2.5 s) | Article hero image is LCP: `priority`, preloaded, AVIF |
| INP | ≤ 150 ms (good threshold 200 ms) | Bracket pick clicks must stay under this; avoid re-rendering whole bracket |
| CLS | ≤ 0.05 (good 0.1) | Reserved ad slots, image dimensions, font `size-adjust` |
| TTFB | ≤ 400 ms cached | Static shell from edge |
| JS (first load, article) | ≤ 120 KB gzip excluding ads | Server Components by default; no client-side Sanity client on public pages |
| JS (bracket editor) | ≤ 200 KB gzip | Engine is small; lazy-load share/OG features |
| CSS | ≤ 50 KB gzip | Tailwind purges |
| Fonts | ≤ 2 families, variable, `woff2`, subset, `font-display: swap` via `next/font` | |
| Third-party | Ads after consent and idle; analytics via proxy; no blocking tags | |
| Images per article above fold | 1 | |

Enforce with Lighthouse CI budgets on previews and `@next/bundle-analyzer` reports; track field data via Vercel Speed Insights or PostHog web vitals.

### 26.2 Image rules and the `sanity-image` library

| Rule | Value |
|---|---|
| Featured image source size | **1920×1080 (16:9)** minimum; validated in Sanity (§12.3) |
| Delivery | Sanity Image CDN via **`sanity-image`** (`SanityImage` from the `sanity-image` package) |
| Formats | **AVIF / WebP via `auto=format`** (default in `sanity-image`) |
| Delivered weight | Target **under 200 KB** for the largest rendered featured image; quality default ~75, override with `queryParams={{ q: 70 }}` when needed |
| Hotspot / crop | Pass Studio `hotspot` and `crop` through to `SanityImage` so focal points survive aspect changes |
| Dimensions | Always pass `width` and/or `height` so the library sets accurate `width`/`height` attributes (CLS) and builds `srcSet` |
| Alt text | Required; credit via `credit` / `creditPerson` |
| LQIP | Pass `preview={asset.metadata.lqip}` for blur-up |
| Logos | SVG preferred (SVGO); PNG fallback for OG |

**Chosen approach: `sanity-image` (not a custom `next/image` loader).**

Why:

- One `<img>` (no wrapper nesting), hotspot/crop-aware, never upscales, tiny bundle (~2 KB gzipped), sets width/height for you, LQIP support, works with Server Components when you pass serializable props.
- Serves directly from `cdn.sanity.io`, so you avoid Vercel Image Optimization bandwidth/cost on Sanity assets.

```tsx
// packages/ui/src/components/sanity-image.tsx
import { SanityImage as Base } from "sanity-image";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

type Props = {
  id: string;                 // image asset _id, e.g. image-abc-1920x1080-jpg
  alt: string;
  width?: number;
  height?: number;
  mode?: "cover" | "contain";
  hotspot?: { x: number; y: number } | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  preview?: string | null;    // lqip
  className?: string;
  sizes?: string;
  priority?: boolean;         // maps to loading="eager" + fetchPriority
};

export function SanityImage({ id, alt, width, height, mode = "cover", hotspot, crop, preview, className, sizes, priority }: Props) {
  return (
    <Base
      id={id}
      projectId={projectId}
      dataset={dataset}
      alt={alt}
      width={width}
      height={height}
      mode={mode}
      hotspot={hotspot ?? undefined}
      crop={crop ?? undefined}
      preview={preview ?? undefined}
      className={className}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      // @ts-expect-error fetchPriority is valid on img
      fetchPriority={priority ? "high" : undefined}
      queryParams={{ q: 75 }}
    />
  );
}
```

GROQ must project the asset id and metadata the component needs:

```groq
mainImage{
  ...,
  hotspot, crop,
  asset->{ _id, url, metadata{ lqip, dimensions } }
}
// then: <SanityImage id={mainImage.asset._id} hotspot={mainImage.hotspot} crop={mainImage.crop} preview={mainImage.asset.metadata.lqip} width={1200} height={675} sizes="(max-width:768px) 100vw, 768px" priority alt={mainImage.alt} />
```

**Alternative: `next-sanity`'s image helpers / a `next/image` loader.** If you prefer the Next.js `<Image>` component (placeholder blur integration, stricter layout props), use the loader pattern documented by `next-sanity` / `@sanity/image-url` and point `images.remotePatterns` at `cdn.sanity.io`. Do **not** also run those URLs through Vercel Image Optimization if Sanity is already transforming them — pick one optimizer. This blueprint standardizes on `sanity-image` so the choice is consistent across web, vote and admin.

**OG images** still use `next/og` `ImageResponse` (server-generated PNG/JPEG), not `sanity-image`.

**Batch tooling** for non-Sanity uploads (sponsor logos, social cards) can still use `sharp` as in earlier drafts; Sanity-hosted assets rely on the CDN.


---

## 27. Legacy redirects from the current site (optional, one-time 301s)

The new site does not keep the old URL scheme. Migration is (a) importing content and poll history and (b) **optionally** 301-redirecting the old Redshirt URLs that actually carry traffic or links. These are the **only redirects in the system**: the app never redirects its own URLs, and there are no rewrites anywhere (§17).

### 27.1 Legacy map (keep it small)

| Old pattern (current site) | New URL | Mechanism |
|---|---|---|
| `/college/football/rankings/{fbs\|fcs}/{year}/{week}` | `/college-football/rankings/{division}/{year}/week-{week}` (`preseason`/`final` where applicable) | `next.config` `redirects()` pattern, `permanent: true` |
| `/college/football/rankings/{fbs\|fcs}` | `/college-football/rankings/{division}` | `next.config` pattern |
| Root-level article URLs (`/{slug}`) | `/{primarySport}/news/{slug}` | `redirects` table, read by the root catch-all only when no Sanity page matches |
| Old author / school pages that have links or traffic | `/people/{slug}`, `/teams/{school-nickname}` | `redirects` table (top pages only) |
| Everything else | Real 404 (never 301 everything to `/`) | — |

### 27.2 How

1. Pull the old sitemap(s) plus the top ~2,000 URLs by traffic/backlinks; map only those (and every article, since that's mechanical).
2. The content import writes `redirects` rows with `upsertRedirect(source, dest, "legacy")` (§10.7a). Article slugs are carried over unchanged, so the mapping is `/{slug}` → `/{primarySport}/news/{slug}`.
3. Poll history import maps old results onto the new tables and re-tabulates every week; compare before launch.
4. Two layers, both legacy-only:
   - **Patterns** in `apps/web/next.config.ts` `redirects()` (no middleware).
   - **Exact lookups** in the root catch-all fallback (`lookupLegacyRedirect`, cached under tag `redirects`).
5. After launch: watch Search Console 404s for ~8 weeks, add rows for real misses, keep the 301s permanently. No new redirect types may be added later (Appendix D "refuse to build").

```ts
// apps/web/next.config.ts (excerpt) — legacy patterns only; there is no rewrites() key
export default {
  async redirects() {
    return [
      { source: "/college/football/rankings/:div(fbs|fcs)/:year(\\d{4})/:week(\\d+)", destination: "/college-football/rankings/:div/:year/week-:week", permanent: true },
      { source: "/college/football/rankings/:div(fbs|fcs)", destination: "/college-football/rankings/:div", permanent: true },
    ];
  },
} satisfies import("next").NextConfig;
```

(Map old week `0`/`1` to `preseason` with explicit entries if the old site numbered preseason. `permanent: true` emits 308 in Next.js; set `statusCode: 301` per entry if you want a literal 301. Either is a permanent redirect for search engines.)

---

## 28. Phased roadmap and effort

Effort is in **engineer-weeks for one senior full-stack engineer with AI coding assistance**. All numbers are **estimates**; adjust after Phase 0. Appendix D is the Cursor-ready task list with acceptance criteria.

### 28.1 Phases

```mermaid
gantt
  title Roadmap v1.2 (estimate)
  dateFormat  YYYY-MM-DD
  axisFormat  %b
  section Phase 0
  Foundations                 :p0, 2026-11-02, 2w
  section Phase 1 MVP
  Design system + newsroom    :p1a, after p0, 4w
  Polls + vote app            :p1b, after p0, 3w
  FCS bracket + manual results:p1c, after p1b, 2w
  Retention MVP               :p1e, after p1c, 1w
  Launch + redirects          :p1d, after p1a, 1w
  section Phase 2 Season one
  CFP / D-II / D-III brackets :p2b, after p1d, 2w
  Engagement + retention      :p2c, after p1d, 3w
  Ads + sponsorships          :p2d, after p2c, 1w
  Basketball polls + hubs     :p2e, after p2d, 2w
  section Phase 3 Later
  Subscriptions + metering    :p3b, after p2e, 3w
  NCAA basketball bracket     :p3c, after p3b, 3w
```

Illustrative dates; slide them to the season calendar (FCS bracket ready before the selection show; basketball polls before Tipoff).

### 28.2 Milestones

| Phase | Milestone | Scope | Exit criteria | Effort (est.) |
|---|---|---|---|---|
| 0 | Foundations | Turborepo, apps web/vote/admin/studio, `packages/db` (Drizzle + RLS + `rs_server` + `withRls`), CI, Clerk shared sessions + authorizedParties, users webhook, Sanity project + schemas v1, `SanityImage`, `@rs/seo/urls`, design tokens | Signed-in user in Postgres; Sanity post renders on a preview via `/{sport}/news/{slug}` | 2 wk |
| 1a | Newsroom | Design system (§32: tokens, fonts, shadcn inventory, custom components), route manifest + factory + `routes:gen` (no rewrites, §17.3), articles, people, page builder + catch-all + Presentation, sport/division hubs and news indexes with `?page=n`, sport-agnostic team hubs `/teams/{school-nickname}`, **Transfer Portal and Recruiting hubs** (storylines, tracker preview), **Portal Tracker** at `/transfer-portal` (`portalEntry`, filters, named-grid `PortalRow`), homepage, sitemaps, JSON-LD, OG, draft mode, revalidation, legacy-redirect table | Lighthouse budgets; Rich Results; editors publish without dev help; screens match §32 mockups; zero rewrites | 5.5 wk |
| 1e | Retention MVP | Follows + onboarding picker + For you, related/next modules, Poll Release newsletter, OG share cards, PostHog event schema + Activation funnel (§31) | Activation funnel live; follow → For you works end to end | 1 wk |
| 1b | Polls + vote app | Invites, accept on `vote.`, ballot editor, tick cron, tabulation, transparency incl. **Voter Ballot Breakdown** (matrix, outliers, filter, distribution), history import, MFA | One weekly cycle in staging with real voters; recomputed history matches | 3.5 wk |
| 1c | FCS bracket | `fcs24`, pick editor, **bracket view with matchup panel** (§32.12), groups, lock, **manual results + rescore**, leaderboards (MV), share images | Simulated tournament scores correctly; unique (sport,division,season) enforced | 2.5 wk |
| 1d | Launch | Content import, optional legacy 301 import, Search Console, monitoring | Top legacy URLs 301 once; no other redirects or rewrites exist | 1 wk |
| 2b | More brackets | `cfp12` (division `fbs`), `d2_28`, `d3_32` | Each format passes engine tests + dry run with staff results | 2 wk |
| 2c | Engagement + retention | Daily/My Teams newsletters, web push, saved articles, infinite next article, bracket reminders, PWA install card, retention dashboard (§31.13) | Digest on schedule; push on Android/desktop and installed iOS; D1/D7/D30 dashboard populated | 2.5 wk |
| 2d | Revenue v1 | Ad slots + CMP, sponsor models | CLS within budget with ads | 1 wk |
| 2e | Basketball | MBB/WBB seasons, polls, hubs | First basketball poll published | 2 wk |
| 3b | Subscriptions | Clerk Billing or Stripe, entitlements, metering | Paid test; paywall markup valid | 3 wk |
| 3c | `ncaab68` | First Four, regions, mass leaderboards | Load test with large entry count | 3 wk |

**Rough total**: MVP (0–1) about **12.5–15.5 engineer-weeks**; season-one (through 2) about **20–24** (v1.5: +0.5 wk portal tracker, −0.5 wk fan vote and build-your-own removed from 2c); later (3) about **6+**. **Estimate.** v1.4 adds route codegen + sport-agnostic team hubs (+0.5 wk), portal and recruiting hubs (+0.5–1 wk), ballot breakdown (+0.5 wk) and the bracket view (+0.5 wk). v1.3 added the design system (+1 wk), retention MVP (+1 wk) and expanded engagement (+1 wk). Removed vs 1.1: sports-data ingestion (~4 wk), portal (~4), recruiting (~6+).

### 28.3 Sequencing advice

- Ship the newsroom and polls first; they carry the existing audience and weekly cadence.
- Build the bracket engine in parallel once foundations exist; results entry is a small admin UI, not a data pipeline.
- Do **not** invent a scores product, live blogs, rosters or recruiting DBs — they are out of scope (§3, §15, §16).
- Treat basketball as "configuration plus calendars"; if 2e exceeds ~2 weeks, the abstractions are leaking.
- Follow Appendix D milestone by milestone when handing this to Cursor.

---

## 29. Cost estimates

All figures are **estimates in USD per month**, based on vendors' published list prices checked in October 2026 where noted. Usage-based lines depend on traffic. Verify before budgeting.

### 29.1 Platform services

| Service | Plan | MVP (estimate) | Growth (estimate) | Notes |
|---|---|---|---|---|
| Vercel | Pro (per member) + usage | $20–80 | $150–600+ | Four projects (web, vote, admin, studio). Sanity CDN via `sanity-image` avoids Vercel Image Optimization on editorial assets |
| Supabase | Pro ($25) + compute | $25–40 | $135–250 | Small/Medium/Large published list prices as before |
| Sanity | Growth ($15/seat) | $45–150 (3–10 seats) | $150–450 + add-ons | |
| Clerk | Pro ($25, or $20 annual) | $25 | $25 + $0.02/MRU over 50k | Shared sessions across subdomains; no extra satellite fee |
| Resend | Pro / Marketing | $20–40 | $80–300 | |
| Sentry | Team | $0–26 | $26–100 | |
| PostHog | Free tier → paid | $0 | $0–450 | |
| Upstash Redis (rate limits) | Pay-as-you-go | $0–10 | $10–30 | |
| Vercel Edge Config | Included tiers | $0 | $0–20 | Optional hot redirect mirror |
| Domain, DNS, email for staff | | $10–30 | $10–30 | |
| **Platform subtotal** | | **≈ $145–400** | **≈ $580–2,200+** | No sports-data feeds, no workers host |

### 29.2 Sports data

**None.** Schedules, scores and rosters are outbound links (§15). Bracket results and optional poll W-L records are staff-entered. If a future major version adds a feed, budget then — do not pre-pay.

### 29.3 One-time and people

| Item | Estimate |
|---|---|
| Build (Phases 0–2) | ~20–24 engineer-weeks (§28) |
| Design (brand, components, bracket UI) | §32 direction + mockups reduce this to ~1–2 designer-weeks of polish, or template-based |
| Legal (terms, privacy, contest rules for sponsored brackets) | At least one review before prizes or subscriptions |
| Photo licensing | Per image or wire/photo subscription |

### 29.4 Cost controls

- Tag-based revalidation over short timers.
- Serve editorial images from Sanity CDN with `sanity-image` (no double optimization).
- Skip Realtime until a group-page UX needs it.
- Use Supabase branching only for PRs that touch migrations.
- Turn PostHog session replay on only for specific flows.

---

## 30. Open decisions and risks

| # | Decision / risk | Options | Recommendation |
|---|---|---|---|
| 1 | Writes via user-scoped client (RLS) vs server DB | RLS-first vs server-first | Server-first writes via `adminDb` + zod + role checks; RLS for optional browser reads |
| 2 | ORM | **Decided: Drizzle** | Schema, policies, migrations, queries |
| 3 | Incomplete brackets at lock | Score as-is vs exclude | Score as-is; label "Incomplete" |
| 4 | Poll ties at No. 25 | Include all tied vs tiebreak to 25 | Include all tied (T-25) and document it |
| 5 | Paywall timing | Metering on vs off at launch | Build in Phase 3, launch with `mode=off` |
| 6 | Sports data product | Link-out (current) vs build later | **Decided: link-out.** Revisit only as a new major version |
| 7 | Community (comments/forums) | Build vs third-party vs none | None until moderation capacity exists |
| 8 | Prizes for bracket challenge | None vs sweepstakes | None without legal review |
| 9 | Sanity document quota | Growth add-on vs Enterprise | Measure after import |
| 10 | Risk: lock-time surge | | Load test; static shell; queue scoring after result entry |
| 11 | Risk: poll credibility challenges | | Transparency, CSV + hash, methodology, disclosures |
| 12 | Risk: URL change hurts search | | Complete redirect map, Search Console, keep redirects permanently |
| 13 | Risk: staff miss a result entry | | Admin checklist + Slack/email reminder when a `starts_at` has passed with `status=pending` |
| 14 | Risk: Clerk subdomain cookie issues in local/preview | | Document Allowed Subdomains; use shared preview hostnames or accept re-login across ports |
| 15 | Image delivery | `sanity-image` vs next-sanity loader | **Decided: `sanity-image`**; next-sanity loader is the documented alternative (§26) |
| 16 | **Portal tracker: must every entry link a Redshirt story?** (under review) | (a) required, as in v1.5: no story, no row; (b) optional: rows without a story show no Story link; (c) optional, but story-less rows are hidden from the public list until a story exists | **Open.** Built as (b) for now: `story` is optional with a Studio warning. If James picks (a), restore `r.required()` and the `defined(story->slug.current)` filter; if (c), add the filter back to the public query only |
| 17 | **Portal tracker UI redesign** | Redesign before build vs ship the v1.5 mockup | **Open: redesign first.** Build schema, GROQ, route and `searchParams` plumbing now; build `PortalRow`, filters and summary cards only after the new design is approved |
| 18 | URL migration for the existing site | Keep today's `/college/{sport}/…`, `/college/teams/{slug}` and root article slugs, vs move to §17 URLs | Decide per section in Milestone 0; every moved URL gets one permanent legacy 301 (§27) and stays live until then |
| 19 | Voting location | Keep `/vote/…` inside `apps/web` vs `apps/vote` on `vote.redshirtsports.com` | Target is `vote.`; migrate after Milestone 0 with a legacy 301 for `/vote/*` |

---

## 31. User retention strategy

Retention goal: turn a search or social visitor into someone who **comes back every week** (poll release day, game-week coverage, bracket season). Redshirt's weekly heartbeat already exists (the Top 25 release). Retention design hangs every feature off that heartbeat and off **who the reader follows**.

### 31.1 Principles

1. **Value before asks.** Anonymous readers get the full newsroom, polls, ballots and bracket viewing. Sign-in unlocks *personal* value: follows, saved articles, bracket entries, alerts. No paywall early (§20).
2. **Light, non-annoying prompts.** At most **one** sign-in prompt per session, never a modal on first article view, never on a reader's first visit from search. Prompts are contextual: tapping "Follow", "Save", "Make picks", "Notify me" is the moment to ask.
3. **Every account feature is gated behind Clerk sign-in** (`<SignedIn>` / `<SignedOut>`; server actions call `requireUserId()`). Anonymous state that matters (a draft bracket, a half-built Top 25, team picks in onboarding) is kept in `localStorage` and **merged into the account on sign-up** so nothing is lost.
4. **The weekly loop beats the daily habit.** College sports interest is weekly and seasonal; optimize for W1/W4 return and poll-day reach, not daily streaks.
5. **Measure everything with one event schema** (§31.10). Every retention feature has a funnel and a target.

### 31.2 Prompt rules (what triggers a sign-in ask)

| Trigger | Prompt | Frequency cap |
|---|---|---|
| Click Follow / Save / Notify / Make picks / Build your Top 25 | Clerk `<SignIn>` in a shadcn `Dialog` (or `Drawer` on mobile), with the intent remembered and completed after sign-in | Unlimited (user-initiated) |
| 3rd article in a session, never 1st/2nd | Inline card at article end: "Follow {primary team} for a personalized feed" | 1 per session, 1 per 7 days after dismiss |
| Home page, returning visitor (2+ visits in 14 days) | Dismissible "Follow your teams" bar (see home mockup) | Hidden for 30 days after dismiss; never for signed-in users with follows |
| Poll page on release day | "Notify me when next week's poll drops" button (no auto-popup) | — |
| PWA install | Custom install card after the 2nd session that included a poll or bracket view, only on supported browsers | 1 per 30 days |
| Push permission | Only after an explicit "Notify me" tap (never on load) | Browser-level |

Implementation: a `usePromptBudget()` hook in `packages/ui` reads `localStorage` (`rs.prompts.v1`) and a PostHog feature flag (`retention-prompts`) so prompt intensity can be tuned without deploys.

### 31.3 Follows and personalization

**Follow targets**: schools (all sports, from the sport-agnostic team hub `/teams/{school-nickname}`), a school's single sport (e.g. Montana State football only), conferences, divisions (e.g. "FCS"), and people (writers). Data:

```sql
-- Same DDL as §10.2 (v1.3 replaced the v1.2 user_favorites table; no data migration needed for a fresh build).
create table user_follows (
  user_id text not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('school','team','conference','division','person')),
  target_id text not null,                     -- school uuid (all sports), team uuid (school+sport), conference id, 'cfb:fcs', Sanity person _id
  notify_push boolean not null default false,
  notify_email boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index on user_follows (target_type, target_id);   -- fan-out for alerts
-- RLS: own rows only (select/insert/delete using user_id = app.uid())
```

```ts
// packages/db/src/queries/follows.ts
export async function toggleFollow(userId: string, t: { type: FollowType; id: string }, on: boolean) {
  if (on) await adminDb.insert(userFollows).values({ userId, targetType: t.type, targetId: t.id }).onConflictDoNothing();
  else await adminDb.delete(userFollows).where(and(eq(userFollows.userId, userId), eq(userFollows.targetType, t.type), eq(userFollows.targetId, t.id)));
  // PostHog server event, cache tag for the user's feed
  capture(userId, on ? "follow_added" : "follow_removed", { target_type: t.type, target_id: t.id });
}
```

#### What following does (plain-language, shown in the Follow dialog and `/account/follows`)

Following is the one action that makes Redshirt yours. It never costs anything and never unlocks a paywall. When you follow something:

| You follow | What changes | Default | Where you control it |
|---|---|---|---|
| A school (e.g. Montana State Bobcats, all sports) | Its stories from every sport are boosted in **For you** on the home page; its badge appears in your header menu and mobile "Your teams" row; it's in your **My Teams** weekly email | Feed on, email on, push off | Follow button on the team hub; `/account/follows` |
| One sport of a school (e.g. Bobcats football) | Same as above for that sport only; poll-movement alerts for that team when its poll publishes | Feed on, email on, push off | Sport tab on the team hub |
| A division (e.g. FCS) | Division stories in For you; the rankings widget and bracket CTA default to that division; **poll-release** alert for that division | Feed on, poll-release email on | Division hub; onboarding |
| A conference | Conference stories in For you; conference roundups in My Teams | Feed on | Conference hub |
| A writer | Their new stories in For you; optional "new from {writer}" email | Feed on, email off | Byline Follow chip |

What following does **not** do: it doesn't make your follows public, doesn't change what voters see or the poll, doesn't affect bracket scoring, and doesn't send push notifications unless you turn push on per follow. Anonymous readers can follow too (stored in the browser); signing in syncs those follows to your account.

**Personalized home ("For you" tab):**

- The home shell stays static (PPR). A `<Suspense>` hole renders "For you" for signed-in users with follows: GROQ `*[_type=="post" && (references($schoolDocIds) || $division in divisions || references($personIds))] | order(publishedAt desc)[0...30]`, cached per user with a short `cacheLife` (or `"use cache: private"`), tag `feed:user:<id>`.
- Ranking: recency first, boost followed-team matches ×2, editor-pinned "Top stories" always first. No ML in v1.
- The rankings widget defaults to the user's first followed division; the bracket CTA to the division they follow.
- Anonymous readers: "All" tab plus a localStorage-only follow list (so onboarding works before sign-up) that drives the same query via a client fetch to a cached route handler.

**Onboarding picker** (first sign-in, or the "Follow teams" button):

1. Step 1 "Which levels do you follow?": division chips (FBS, FCS, D-II, D-III, MBB, WBB).
2. Step 2 "Pick your teams": searchable list (shadcn `Command`), grouped by conference, multi-select, suggestions from geolocation-free signals (the article that brought them in, last viewed hubs).
3. Step 3 "How should we keep you posted?": newsletter toggles (Daily, Poll release, My teams) and "Enable push for poll releases" (requests permission only if toggled).
4. Done → land on "For you". Skip is always visible; the whole thing is a shadcn `Dialog` on desktop and a full-height `Drawer` on mobile.

### 31.4 Newsletters (Resend)

| List | Cadence | Content | Audience |
|---|---|---|---|
| **The Redshirt Daily** | Weekdays 6:00 AM PT | Top stories + editor note; 6–8 links | Opt-in |
| **Poll Release** | Weekly, at poll publish (in-season) | Top 10 for each followed division, biggest movers, link to ballots | Opt-in; default on in onboarding |
| **My Teams** | Weekly (Thu) + breaking only if the user opts in | Articles tagged with followed teams/conferences in the past 7 days; skipped if empty | Auto for users with follows + email opt-in |
| **Bracket Challenge** | Event-driven | Opens, lock in 24 h, daily standing recap during the event | Entrants only |

- Built with React Email (`packages/emails`), sent with Resend (Broadcasts for list sends, batch API for personalized My Teams). Double opt-in for anonymous signups; signed-in users with verified Clerk emails can opt in with one click.
- Every link carries `utm_source=newsletter&utm_medium=email&utm_campaign=<list>-<yyyy-mm-dd>`; the web app captures UTMs to PostHog so newsletter CTR and downstream sessions join in one funnel.
- Resend webhooks (`email.delivered`, `email.opened` if enabled, `email.clicked`, `email.bounced`, `email.complained`) write to `newsletter_events` for CTR and list health; complaints auto-unsubscribe.

### 31.5 Web push (followed teams + poll releases)

- Service worker from the PWA (§21), VAPID keys, `push_subscriptions` table (exists). Sends via `web-push` from an admin cron route or right after the poll publish job.
- Topics: `poll:<slug>` (release), `team:<id>` (new article about a followed team, max 2/day per user, quiet hours 10 PM–7 AM user local), `bracket:<event>` (lock reminders, result-entry recap).
- iOS: works only for installed PWAs (Home Screen) on supported iOS versions; the install card explains this on iOS Safari.
- Permission is requested only after an explicit tap (§31.2). Each notification has a "Manage" link to `/account/notifications`.

### 31.6 Bracket challenge retention

- **Groups are the retention engine**: creating a group and inviting friends gives a reason to return daily during the event. Prompt "Create a group" immediately after saving a bracket; group invite links have rich OG cards.
- Reminders: 24 h and 1 h before lock for incomplete entries (email + push); "Your standing after Round 1" recaps after staff enter results (§14.9).
- After the event: "Follow the champion's coverage" and "Get next season's bracket alert" (adds a `bracket:<division>` topic follow).

### 31.7 Poll engagement

- **Notify me** on poll pages → `poll:<slug>` topic follow (email and/or push).
- **Ballot transparency as content**: "Biggest outlier ballot this week", "Voter consensus" modules link to individual ballots (credibility + shareability).

No fan vote and no fan-built rankings (removed in v1.5): the only Top 25 on Redshirt is the voters' poll, which keeps the poll page unambiguous and removes a moderation and data-retention surface.

### 31.8 Reading features

| Feature | Decision | Notes |
|---|---|---|
| **Saved articles** | Yes (P1) | `saved_items(user_id, sanity_id, saved_at)`; bookmark icon on cards and article header; `/account/saved` |
| **Related / next article** | Yes (P0) | End-of-article "More on {team}" (same school refs) and "Up next" (editor-picked or same sport latest) |
| **Infinite next article** | Yes (P1), max 3 deep | When the reader reaches the end, the next article loads below (Server Component fetched via a route handler). `history.replaceState` updates the URL; each article fires its own `$pageview` and has its own ad slots with reserved heights. The canonical stays per-article; crawlers see a normal "Up next" link |
| **Reading streaks** | Maybe (P3) | Weekly streaks ("4 poll weeks in a row") fit the cadence better than daily streaks. Only shown in the account page, never as a nag. Ship only if W4 retention stalls |
| **Recently viewed hubs** | Yes (P1) | localStorage; powers onboarding suggestions |

### 31.9 Comments: recommendation

**Do not launch comments in 2026–27.** Reasons: moderation cost and liability, low signal on small-college coverage, CLS/performance cost of third-party widgets, and the brand risk around voter ballots (harassment of named voters). Instead:

- Point conversation to Redshirt's X accounts and newsletters (reply-to-email reaches writers).
- Offer structured participation that can't turn toxic: bracket groups.
- Revisit in 2027 with a moderated, signed-in-only option (Clerk identity, rate limits, keyword filters, "voter pages excluded"). If you do, prefer a third-party with moderation tooling over building it.

### 31.10 Share cards and PWA

- **OG cards** (`next/og`) for every shareable object: article, poll week (top 5 + movers), team rank card ("No. 2 in the Redshirt FCS Top 25"), bracket entry (champion + final four), group invite. All use the brand tokens and the Barlow Condensed display face.
- Share buttons use the Web Share API on mobile with a copy-link fallback; every share fires `share_clicked` with `{object_type, channel}`.
- **PWA**: manifest with shortcuts (Rankings, My Bracket, For you), offline fallback page, custom install card (§31.2). Track `pwa_install_prompted`, `pwa_installed` (via `appinstalled`), and display-mode on each session.

### 31.11 Account value without a paywall

What a free account gets (shown on the sign-up dialog and `/account`): follow teams/conferences/writers, personalized "For you" feed, saved articles, bracket entries and groups, newsletter and push preferences, dark mode sync across devices (stored in Clerk `unsafeMetadata` or Postgres). Later (P2+): premium tier adds ad-light and early newsletters (§20), never paywalled polls or ballots.

### 31.12 Metrics, PostHog events and funnels

**Event schema** (snake_case, defined once in `packages/analytics/events.ts`; server events use the Clerk user id as `distinct_id` after `identify`):

| Event | Key properties | Fired from |
|---|---|---|
| `$pageview` | `page_type` (home/article/hub/poll/bracket/ballot/page), `sport`, `division`, `article_id`, `utm_*` | client (auto) |
| `article_read` | `article_id`, `percent` (25/50/75/100), `seconds` | client scroll observer |
| `next_article_loaded` | `from_id`, `to_id`, `depth` | client |
| `signin_prompt_shown` / `signin_prompt_clicked` / `signin_prompt_dismissed` | `trigger`, `surface` | client |
| `signed_up` / `signed_in` | `method`, `intent` (follow/save/bracket) | Clerk webhook (server) |
| `onboarding_started` / `onboarding_step_completed` / `onboarding_completed` / `onboarding_skipped` | `step`, `follows_count` | client |
| `follow_added` / `follow_removed` | `target_type`, `target_id` | server |
| `article_saved` | `article_id` | server |
| `newsletter_subscribed` / `newsletter_confirmed` / `newsletter_unsubscribed` | `list` | server |
| `newsletter_clicked` | `list`, `campaign` | landing pageview with `utm_medium=email` |
| `push_permission_requested` / `push_subscribed` / `push_clicked` | `topic` | client/server |
| `poll_viewed` / `ballots_viewed` / `notify_me_clicked` | `poll`, `week` | client |
| `bracket_started` / `bracket_saved` / `bracket_completed` / `group_created` / `group_joined` | `event`, `picks_count` | server |
| `share_clicked` | `object_type`, `channel` | client |
| `pwa_install_prompted` / `pwa_installed` | — | client |

**Funnels (PostHog Funnels insights, saved in a "Retention" dashboard):**

1. **Activation**: `$pageview` (first visit) → `signin_prompt_clicked` → `signed_up` → `onboarding_completed` → `follow_added` (≥ 1). Conversion window 7 days.
2. **Newsletter**: `newsletter_subscribed` → `newsletter_confirmed` → `newsletter_clicked` (within 14 days).
3. **Bracket**: `bracket_started` → `bracket_completed` → `group_created` or `group_joined` → return session during event.
4. **Poll engagement**: `poll_viewed` → `ballots_viewed` → `poll_shared` (or `poll_notify_on`).
5. **Article depth**: `$pageview` (article) → `article_read` 75% → `next_article_loaded`.

**Cohort retention definitions (PostHog Retention insight):**

| Metric | Definition | Target (estimate) |
|---|---|---|
| **D1 retention** | % of users (new `distinct_id` that performed `$pageview`) who return with any `$pageview` on day 1 after first seen | Anonymous 8–12%; signed-in 25–35% |
| **D7 retention** | Return with `$pageview` on any of days 6–8 (smoothed window) | Anonymous 5–8%; signed-in 30–40% |
| **D30 retention** | Return on any of days 27–33 | Anonymous 3–5%; signed-in 20–30% |
| **W1 / W4 (weekly)** | Return in week 1 / week 4 after signup (more useful for weekly cadence) | Signed-in W4 ≥ 35% in-season |
| **Signed-in rate** | Signed-in weekly actives ÷ all weekly actives | 5% at launch → 12% by end of season one |
| **Follows per account** | Median follows after onboarding | ≥ 2 |
| **Onboarding completion** | `onboarding_completed` ÷ `onboarding_started` | ≥ 60% |
| **Newsletter CTR** | Unique clickers ÷ delivered, per send (Resend `email.clicked` / `email.delivered`) | Daily 8–15%; Poll Release 15–25%; My Teams 10–20% |
| **Newsletter confirm rate** | Confirmed ÷ subscribed (double opt-in) | ≥ 70% |
| **Push CTR** | `push_clicked` ÷ sent | 4–10% |
| **Bracket group rate** | Entrants in ≥ 1 non-national group ÷ entrants | ≥ 40% |
| **Bracket return** | Entrants with ≥ 2 sessions during the event | ≥ 60% |
| **Poll-day reach** | Users with `poll_viewed` within 24 h of publish ÷ prior 4-week WAU | ≥ 30% |

All targets are **estimates** for planning, not benchmarks from the reference sites. Revisit after the first 8 in-season weeks.

**Dashboards**: "Retention" (the table above, weekly), "Poll day" (release-day traffic by source, newsletter vs. push vs. organic), "Bracket" (funnel + concurrency at lock). PostHog cohorts: `signed_in_with_follows`, `newsletter_daily_active` (clicked in last 30 days), `bracket_entrants_<event>`, `lapsed_30d` (for win-back emails).

### 31.13 Retention roadmap

| Phase | Items |
|---|---|
| MVP (Phase 1) | Follow button + `user_follows`, onboarding picker, "For you" tab, related/next modules, Poll Release newsletter, OG cards, event schema + Activation funnel |
| Season one (Phase 2) | Daily + My Teams newsletters, web push, saved articles, infinite next article, bracket reminders/recaps, PWA install card, retention dashboard |
| Later | Weekly streaks (if needed), win-back emails for `lapsed_30d`, comments decision revisit, premium tier |


---

## 32. UI/UX direction and design system

**Direction in one line:** the *density and confidence* of traditional college sports news sites (ESPN's sport/division nav, On3/247 team-first hubs, SI and The Athletic's typography, Bleacher Report's share-first cards) with a *modern, calm* product layer: Tailwind v4 + shadcn/ui, generous whitespace, one accent color, fast pages, no clutter. Scores are deliberately absent; the poll and top stories take the ticker's place.

All mockups below are static HTML built with the same tokens and shadcn component markup the apps will use. They live in `docs/mockups/` (open any `.html` file in a browser; append `?dark` for dark mode, `?mega-open` for the mega nav, `?menu-open` for the mobile sheet). Content is placeholder: school names are examples only, logos are neutral placeholders, and all numbers are example data, not real rankings, records or stats.

### 32.1 Design principles

1. **Headlines first.** Condensed, uppercase display type for headlines and section labels gives the "sports page" feel; everything else is quiet.
2. **One accent.** Redshirt red marks the brand, primary actions, kickers and the active state. Movement colors (up/down/new) are the only other hues.
3. **Information density where it earns it** (rankings tables, brackets, ballots), whitespace everywhere else (articles, hubs).
4. **Everything is a shadcn component or composed from them**, using the same tokens, radius and spacing, so custom sports components (bracket, ballot, rankings table, ticker) look native.
5. **No layout shift.** Every image, ad slot, embed and lazy module has reserved dimensions (§32.15).
6. **Mobile is the primary canvas**: bottom navigation, thumb-reachable actions, sticky progress bars in the bracket and ballot.
7. **Accessible by default**: WCAG 2.2 AA contrast in both themes, keyboard-complete bracket and ballot, visible focus rings (§25).
8. **Personal, not pushy**: follow prompts are inline and dismissible (§31.2).

### 32.2 Typography (open fonts, self-hosted)

| Role | Font | License | Use |
|---|---|---|---|
| Display | **Barlow Condensed** 500–800 | SIL OFL | Headlines, kickers, section titles, rank numbers, card titles, wordmark. Uppercase for H1/section labels, sentence case allowed for river headlines |
| UI / body sans | **Inter** (variable) | SIL OFL | Navigation, buttons, tables, metadata, mobile body, forms |
| Article body / deks | **Source Serif 4** (variable) | SIL OFL | Long-form article body and deks (The Athletic/SI feel), 1.15 rem / 1.7 line height, ~68 ch measure |

- Load with `next/font/local` (or `next/font/google`) in `packages/ui/fonts`, exposing CSS variables consumed by the `@theme` block. Subset to Latin; `display: swap`; preload only Barlow Condensed 700/800 and Inter.
- Scale tokens: `text-kicker` (0.75 rem, 0.08 em tracking), `text-headline-sm` (1.375 rem / 1.1), `text-headline` (2 rem / 1.05), `text-headline-lg` (3.25 rem / 1.0).
- Tabular numerals (`tabular` utility) for ranks, points and records.

### 32.3 Color, light/dark and tokens

- **Brand red** `--primary: oklch(0.505 0.19 27)` (light) / `oklch(0.64 0.2 25)` (dark), tuned for ≥ 4.5:1 against the respective foregrounds on buttons and ≥ 3:1 for large kickers.
- **Ink** (`--ink`) is a near-black for the ticker, footer and hero promo cards (sports-page masthead feel).
- **Paper** background (warm off-white) in light mode; deep blue-gray in dark mode (not pure black, to reduce halation).
- **Semantic sports tokens**: `--up` (green), `--down` (red-orange), `--new` (blue), `--gold` (first-place votes, champion), `--live` (an *open voting window*, never live scores).
- Dark mode via `.dark` class (`next-themes`, `attribute="class"`), default `system`. All components read semantic tokens only; no raw hex values in components.

### 32.4 The theme token file (Tailwind v4, CSS-first, no `tailwind.config.js`)

`packages/ui/src/styles/globals.css` is the single source of truth, imported by `apps/web`, `apps/vote`, `apps/admin` (and used by `components.json` for shadcn). The mockups compile the identical file (`docs/mockups/src/app.css`); in production the `@font-face` blocks are replaced by `next/font` variables, and `@source` points at the monorepo packages.

```css
/* packages/ui/src/styles/globals.css — Redshirt theme (Tailwind v4, CSS-first, shadcn/ui tokens)
   Mockup copy: identical tokens to the production file described in §32.4. */
@import "tailwindcss";
@source "../*.html";

@custom-variant dark (&:where(.dark, .dark *));

/* ---------- Fonts (self-hosted, OFL) ---------- */
@font-face { font-family: "Barlow Condensed"; font-weight: 500; font-display: swap; src: url("../fonts/barlow-condensed-latin-500-normal.woff2") format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 600; font-display: swap; src: url("../fonts/barlow-condensed-latin-600-normal.woff2") format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 700; font-display: swap; src: url("../fonts/barlow-condensed-latin-700-normal.woff2") format("woff2"); }
@font-face { font-family: "Barlow Condensed"; font-weight: 800; font-display: swap; src: url("../fonts/barlow-condensed-latin-800-normal.woff2") format("woff2"); }
@font-face { font-family: "Inter Variable"; font-weight: 100 900; font-display: swap; src: url("../fonts/inter-latin-wght-normal.woff2") format("woff2"); }
@font-face { font-family: "Source Serif 4 Variable"; font-weight: 200 900; font-display: swap; src: url("../fonts/source-serif-4-latin-wght-normal.woff2") format("woff2"); }
@font-face { font-family: "Source Serif 4 Variable"; font-style: italic; font-weight: 200 900; font-display: swap; src: url("../fonts/source-serif-4-latin-wght-italic.woff2") format("woff2"); }

/* ---------- Semantic tokens (shadcn naming) ---------- */
:root {
  --radius: 0.5rem;

  --background: oklch(0.992 0.002 75);          /* warm paper white */
  --foreground: oklch(0.18 0.01 260);           /* ink */
  --card: oklch(1 0 0);
  --card-foreground: var(--foreground);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--foreground);

  --primary: oklch(0.505 0.19 27);              /* Redshirt red */
  --primary-foreground: oklch(0.985 0.005 27);
  --secondary: oklch(0.955 0.004 260);
  --secondary-foreground: oklch(0.22 0.01 260);
  --muted: oklch(0.962 0.003 260);
  --muted-foreground: oklch(0.48 0.012 260);
  --accent: oklch(0.955 0.012 27);              /* faint red wash for hovers/selected */
  --accent-foreground: oklch(0.38 0.15 27);
  --destructive: oklch(0.577 0.245 27.3);
  --border: oklch(0.91 0.004 260);
  --input: oklch(0.89 0.004 260);
  --ring: oklch(0.505 0.19 27);

  /* Brand extensions */
  --ink: oklch(0.16 0.012 260);                 /* masthead / ticker bar */
  --ink-foreground: oklch(0.97 0.003 260);
  --up: oklch(0.56 0.15 150);                   /* rank moved up */
  --down: oklch(0.55 0.19 25);                  /* rank moved down */
  --new: oklch(0.55 0.14 250);                  /* newly ranked */
  --gold: oklch(0.78 0.14 85);                  /* first-place votes, champion */
  --live: oklch(0.63 0.2 145);                  /* "open" voting windows, not live scores */

  --chart-1: oklch(0.505 0.19 27);
  --chart-2: oklch(0.55 0.14 250);
  --chart-3: oklch(0.56 0.15 150);
  --chart-4: oklch(0.78 0.14 85);
  --chart-5: oklch(0.48 0.012 260);

  --sidebar: oklch(0.985 0.002 260);
  --sidebar-foreground: var(--foreground);
  --sidebar-primary: var(--primary);
  --sidebar-primary-foreground: var(--primary-foreground);
  --sidebar-accent: var(--accent);
  --sidebar-accent-foreground: var(--accent-foreground);
  --sidebar-border: var(--border);
  --sidebar-ring: var(--ring);
}

.dark {
  --background: oklch(0.16 0.008 260);
  --foreground: oklch(0.96 0.004 260);
  --card: oklch(0.2 0.009 260);
  --card-foreground: var(--foreground);
  --popover: oklch(0.2 0.009 260);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.64 0.2 25);
  --primary-foreground: oklch(0.16 0.02 25);
  --secondary: oklch(0.26 0.01 260);
  --secondary-foreground: var(--foreground);
  --muted: oklch(0.25 0.01 260);
  --muted-foreground: oklch(0.7 0.012 260);
  --accent: oklch(0.28 0.05 25);
  --accent-foreground: oklch(0.9 0.05 25);
  --destructive: oklch(0.704 0.191 22.2);
  --border: oklch(1 0 0 / 11%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.64 0.2 25);
  --ink: oklch(0.12 0.008 260);
  --ink-foreground: oklch(0.96 0.004 260);
  --up: oklch(0.72 0.16 150);
  --down: oklch(0.7 0.17 25);
  --new: oklch(0.72 0.12 250);
  --gold: oklch(0.82 0.14 85);
}

/* ---------- Map tokens to Tailwind utilities ---------- */
@theme inline {
  --font-display: "Barlow Condensed", "Arial Narrow", ui-sans-serif, sans-serif;
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Source Serif 4 Variable", Georgia, ui-serif, serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ink: var(--ink);
  --color-ink-foreground: var(--ink-foreground);
  --color-up: var(--up);
  --color-down: var(--down);
  --color-new: var(--new);
  --color-gold: var(--gold);
  --color-live: var(--live);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Editorial type scale (display uses Barlow Condensed, tight leading) */
  --text-kicker: 0.75rem;
  --text-kicker--letter-spacing: 0.08em;
  --text-headline-sm: 1.375rem;
  --text-headline-sm--line-height: 1.1;
  --text-headline: 2rem;
  --text-headline--line-height: 1.05;
  --text-headline-lg: 3.25rem;
  --text-headline-lg--line-height: 1;
  --container-prose: 42rem;
  --container-site: 82rem;
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground font-sans antialiased; font-feature-settings: "cv11", "ss01"; }
  h1, h2, h3, .font-display { font-family: var(--font-display); }
  :focus-visible { @apply outline-2 outline-offset-2 outline-ring; }
}

/* ---------- Small utilities used by custom components ---------- */
@utility kicker { @apply font-display text-kicker uppercase font-bold tracking-[0.08em]; }
@utility tabular { font-variant-numeric: tabular-nums; }
@utility ph-photo {
  background:
    repeating-linear-gradient(135deg, oklch(0.5 0 0 / 0.06) 0 12px, transparent 12px 24px),
    linear-gradient(135deg, var(--muted), var(--secondary));
}
@utility ad-slot {
  background: repeating-linear-gradient(45deg, oklch(0.5 0 0 / 0.04) 0 8px, transparent 8px 16px), var(--muted);
}
```

`packages/ui/components.json` (shadcn CLI config; with Tailwind v4 the `config` field stays empty):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles/globals.css", "baseColor": "neutral", "cssVariables": true },
  "iconLibrary": "lucide",
  "aliases": { "components": "@rs/ui/components", "ui": "@rs/ui/components/ui", "utils": "@rs/ui/lib/utils", "hooks": "@rs/ui/hooks", "lib": "@rs/ui/lib" }
}
```

```css
/* apps/web/app/globals.css — each app imports the shared theme and tells Tailwind where classes live */
@import "@rs/ui/styles/globals.css";
@source "../../../packages/ui/src";
@source "../app";
@source "../components";
```

Notes:

- Tailwind v4 reads design tokens from `@theme` (here `@theme inline` so utilities reference the runtime CSS variables and dark mode just swaps variables). `bg-primary`, `text-muted-foreground`, `border-border`, `rounded-lg`, `font-display`, `text-up` etc. all come from this file.
- Add shadcn components with `pnpm dlx shadcn@latest add button card ...` from `packages/ui`; they land in `packages/ui/src/components/ui` and already use these token names.
- Radius: `--radius: 0.5rem` (slightly tighter than shadcn's default for a newsier look); `rounded-md` for buttons/inputs, `rounded-xl` for cards.

### 32.5 Component inventory

**shadcn/ui components used as-is** (installed into `packages/ui/src/components/ui`):

| shadcn component | Where it's used |
|---|---|
| `button` | Everywhere (variants: default, secondary, outline, ghost, link; custom `ink` variant added via `cva`) |
| `badge` | Kickers on cards (outline), status ("Window open"), "Following", record chips |
| `card` | Rail widgets, newsletter, groups, poll history, entry summary |
| `navigation-menu` | Desktop sport/division mega nav |
| `sheet` | Mobile menu (left), filters (bottom) |
| `drawer` (vaul) | Mobile onboarding, sign-in prompt, share sheet |
| `dialog` | Desktop onboarding, sign-in prompt (wrapping Clerk `<SignIn>`), confirm submit ballot |
| `command` | Team search in onboarding, ballot eligible teams, global search (`⌘K`) |
| `tabs` | Rankings division switcher, river filters, bracket rounds (mobile), ballot/teams (mobile) |
| `table` | Rankings table, ballots grid, leaderboards, admin lists |
| `select` | Season/week pickers |
| `input`, `label`, `textarea`, `form` (react-hook-form + zod) | Newsletter, tiebreaker, voter profile, admin |
| `checkbox`, `switch`, `radio-group`, `toggle-group` | Newsletter lists, reminders, bracket pick (radio semantics), theme |
| `alert` | Ballot validation, bracket missing picks, poll window notices |
| `progress` | Bracket picks progress, ballot completeness |
| `avatar` | Bylines, voters, groups |
| `separator`, `scroll-area`, `skeleton` | Layout, horizontal rails, loading states with reserved size |
| `tooltip`, `hover-card` | Movement explanation, voter hover cards on ballots |
| `popover`, `dropdown-menu` | Share menu, account menu, entry switcher |
| `breadcrumb` | Article and hub breadcrumbs |
| `pagination` | `?page=n` archives (real `<a>` links; page 1 has no param; §17.6) |
| `sonner` (toast) | "Saved", "Followed", "Ballot submitted" |
| `chart` (Recharts) | Poll history line, ballot share bars |
| `carousel` (Embla) | Mobile top stories rail, podcast rail |
| `accordion`, `collapsible` | Methodology, FAQ page-builder section, others receiving votes on mobile |
| `sidebar` | `apps/admin` shell |

**Custom components (built only from the primitives above + tokens):**

| Component | Built on | Notes |
|---|---|---|
| `Masthead` / `SiteHeader` | `navigation-menu`, `button`, `sheet` | Sticky, 64 px desktop / 56 px mobile; wordmark, sport mega nav, search, theme, Follow, Clerk `<UserButton>` |
| `TopTicker` | `button`, `badge`, tokens `bg-ink` | Poll + top stories ticker (§32.7) |
| `StoryCard` (lead, secondary, river, compact) | `card` patterns, `badge`, `avatar`, `SanityImage` | One component, four size variants via `cva` |
| `RankingsTable`, `RankRow`, `MovementIndicator` | `table`, `badge`, `tooltip` | Tabular numerals, up/down/new tokens with text labels |
| `PortalRow`, `PortalRowHead` | `avatar`, `badge` + `portal-row` / `portal-row-head` `@utility` (named grid areas) | Tracker row: mobile card ↔ desktop row via `grid-template-areas` (§16.1) |
| `PortalFilters`, `PortalSummary` | `select`, `input`, `badge`, `sheet`, `card` | GET form + `router.replace`, removable chips, mobile sheet; status counts |
| `RankingsWidget` | `card`, `tabs`, `RankRow` | Rail/top-10 |
| `BallotGrid` | `table`, `hover-card`, `avatar` | Ballot transparency matrix |
| `BracketBoard` (desktop) | `card`, `toggle-group` per game, CSS grid | Horizontal tree, connectors via CSS borders |
| `BracketRounds` (mobile) | `tabs`, `BracketGame`, `progress` | Round-by-round with sticky progress + Save |
| `BracketGame` | `toggle-group` (single) + `badge` | Two team rows; picked state uses `bg-accent` |
| `BallotEditor` | `@dnd-kit/sortable` + `button`, `alert`, `progress`, `command` | Drag to rank, keyboard move up/down, validation |
| `TeamMark` | `avatar` | Logo with neutral fallback (placeholder pattern in mockups) |
| `FollowButton` | `button`, `dialog`/`drawer` (sign-in) | Optimistic toggle; remembers intent through sign-in |
| `OnboardingPicker` | `dialog`/`drawer`, `command`, `toggle-group`, `switch` | §31.3 |
| `OutboundLinkCard` | `card`, `button` | "Opens on {host}" (§15) |
| `AdSlot` | `skeleton`-like reserved box | Fixed min-height per breakpoint (§32.15) |
| `ShareMenu` | `dropdown-menu`, Web Share API | Fires `share_clicked` |
| `PageBuilder` sections | `card`, `accordion`, `button`, `SanityImage` | Hero, rich text, staff grid, FAQ, CTA, job listings (§12.8) |
| `SanityImage` | `sanity-image` | §26 |

### 32.6 Grid and spacing

- Container `max-w-site` (82 rem ≈ 1312 px) with 16 px (mobile) / 24 px (≥ lg) gutters.
- **Desktop home/hub/article**: 12-column mental model implemented as `grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` (main + rail) with `gap-8`; article uses `minmax(0,1fr)_300px` so the rail fits a 300×250 ad exactly.
- Article text column `max-w-prose` (42 rem). Rankings/bracket use full container width.
- Spacing scale is Tailwind's default (4 px base). Section rhythm: 24 px between related blocks, 32–48 px between sections.
- Breakpoints: Tailwind defaults (`sm 40rem`, `md 48rem`, `lg 64rem`, `xl 80rem`). Bottom nav below `lg`.

### 32.7 Header, mega nav and the score-less ticker

- **Ticker** (ink bar, 36 px): "Top 25 & Top Stories" label, rotating links (poll releases, bracket status, ballot deadline for voters, top headlines), prev/pause/next controls. Respects `prefers-reduced-motion` (no auto-scroll; manual arrows only). Content comes from a Sanity `siteSettings.ticker[]` plus automatic poll-release items. This replaces the scores strip of ESPN-style sites.
- **Header**: wordmark, sport triggers (College Football, Men's Basketball, Women's Basketball) with `navigation-menu` mega panels listing divisions and section shortcuts plus a featured promo, then Rankings, Bracket Challenge, Podcasts (hidden below `xl`), search, theme toggle, Follow teams, Sign in/UserButton.
- **Mobile**: hamburger opens a left `sheet` with search, "Your teams" chips, sports → divisions grid, secondary links. A fixed bottom nav (Home, Rankings, Brackets, Following, Me) mirrors the app pattern of ESPN/B/R.

![Home, desktop (1440×900)](../mockups/screenshots/home-desktop.png)

![Mega nav open (1440×900)](../mockups/screenshots/nav-mega-desktop.png)

<p class="shots"><img src="mockups/screenshots/home-mobile.png" alt="Home, mobile (390×844)"><img src="mockups/screenshots/nav-sheet-mobile.png" alt="Mobile menu sheet (390×844)"><img src="mockups/screenshots/article-mobile.png" alt="Article, mobile (390×844)"></p>

*Above: home (mobile), mobile menu sheet, article (mobile), all at 390×844.*

### 32.8 Home layout

1. Ticker → header → optional dismissible "Follow your teams" bar (returning anonymous visitors, §31.2).
2. **Lead story** (2/3): 2:1 photo, kicker, uppercase display headline, dek, byline. **Top stories** (1/3): five compact cards with thumbnails.
3. Leaderboard ad (970×90 / 320×100 mobile, reserved).
4. **River** (2/3) with tabs: For you (signed-in), All, FCS, D-II, D-III, Hoops; "Load more" (progressive enhancement over `?page=2` links for crawlers).
5. **Rail** (1/3): Rankings widget (Top 10 with movement; division tabs), Bracket Challenge CTA (ink card), 300×250 ad, newsletter signup with list checkboxes.

Dark mode uses the same layout with token swaps:

![Home, dark mode (1440×900)](../mockups/screenshots/home-desktop-dark.png)

### 32.9 Sport hub, news indexes, team hub, portal and recruiting hubs

- **Sport/division hub** = home layout scoped to the sport/division, with the division's poll widget, bracket CTA, conference chips and an "Official sources" link card (NCAA.com scoreboard/bracket).
- **News index** (`/college-football/news`): breadcrumb, display H1, Follow, **division chips that are links** to `/college-football/{division}/news` (not filters), lead + three secondaries, reserved leaderboard ad, river with "Load more" (progressive enhancement) over shadcn `Pagination` links (`?page=n`, page 1 without a parameter), rail with Most read, rankings widget, ad, newsletter.
- **Division news** (`/college-football/fcs/news?page=2`): division band with path tabs (Home, News, Rankings, Bracket Challenge, Transfer Portal, Conferences: each a real URL), conference chips linking to conference hubs, a paginated river showing the page number and range, and the canonical note (`…/news?page=2`).
- **Team hub (sport-agnostic, `/teams/montana-state-bobcats`)**: header band with neutral placeholder mark, conference + city kicker, **school + nickname** in display type, per-sport rank/record chips, Follow + alert bell. **Sport tabs are paths**: Overview, Football (`/football`), Men's Basketball (`/mens-basketball`), Women's Basketball (`/womens-basketball`), All news (`/news`); only sports the school plays render. Inside a sport, a secondary chip row (Overview, News, Rankings) maps to `/teams/{slug}/{sport}`, `/news`, `/rankings`. Body: lead story + poll history chart, river with pagination; rail with **official outbound links** for that sport, "Other Bobcats sports" card, ad, bracket history.
- **Transfer Portal hub** (`/college-football/transfer-portal`, §16): dark `ink` band with Follow-style "Portal alerts", filter tabs (All, FCS, D-II, D-III are client filters on the same list; Storylines and Tracker are in-page anchors), lead story, **storyline cards** (Sanity `storyline`), **tracker preview** (latest four `PortalRow`s and a "Full tracker" link to `/transfer-portal`, §16.1), river + pagination; rail: "Your teams in the portal" (from follows), editor-entered key dates, ad, newsletter.
- **Recruiting hub** (`/college-football/recruiting`): commitments coverage cards (photo, school mark, "Example Recruit commits to …", position, high school; each card is an article), signing-day package banner, storylines, optional curated commits list, river; rail with Most read and a Follow nudge.

![Team hub, sport section, desktop (1440×900)](../mockups/screenshots/team-hub-desktop.png)

![College football news index, desktop (1440×900)](../mockups/screenshots/news-desktop.png)

![FCS division news, page 2, desktop (1440×900)](../mockups/screenshots/division-news-desktop.png)

![Transfer Portal hub, desktop full page](../mockups/screenshots/transfer-portal-desktop-full.png)

![Recruiting hub, desktop (1440×900)](../mockups/screenshots/recruiting-desktop.png)

<p class="shots"><img src="mockups/screenshots/team-hub-mobile.png" alt="Team hub mobile"><img src="mockups/screenshots/news-mobile.png" alt="News index mobile"><img src="mockups/screenshots/division-news-mobile.png" alt="Division news mobile"></p>

<p class="shots"><img src="mockups/screenshots/transfer-portal-mobile.png" alt="Transfer portal mobile"><img src="mockups/screenshots/recruiting-mobile.png" alt="Recruiting mobile"></p>

*Above: team hub, news index, division news, Transfer Portal and Recruiting on mobile (390×844).*

### 32.10 Article page

- Breadcrumb, kicker, display headline (uppercase, up to ~3 lines), serif dek, byline row with avatar, Follow (writer), timestamp/read time, Save and Share icon buttons.
- 16:9 hero via `SanityImage` (priority, LQIP), caption + credit.
- Serif body at ~68 ch; subheads in display type; inline poll embed card; in-article ad between paragraphs with reserved 250 px height; topic chips; "Follow {team}" card; **Up next** block (infinite next article, §31.8).
- Sticky rail (desktop): 300×250, rankings top 5, "More from {writer}".

![Article, desktop (1440×900)](../mockups/screenshots/article-desktop.png)

### 32.11 Rankings page (movement + ballot transparency)

- Header: "FCS Top 25 · Week 7", season/week `select`s, Share, **Notify me**; release metadata and methodology link.
- Underline tabs: Poll, Ballots, Voters, History, Methodology.
- `RankingsTable`: rank (display numerals), movement indicator (▲ green / ▼ red-orange / NEW blue / — unchanged, each with an `aria-label` and legend), team mark + name + first-place votes in parentheses, record (admin-entered), conference, points, previous rank, ballot-share bar. Followed teams get a subtle highlight and "Following" badge. Others receiving votes in a muted block; legend below.
- Rail: **Ballot grid** (voters × ranks, links to every ballot), **Biggest movers** (largest rises/falls this week), **Notify me** card (poll-release alert), ad.

![Rankings, desktop (1440×900)](../mockups/screenshots/rankings-desktop.png)

<p class="shots"><img src="mockups/screenshots/rankings-mobile.png" alt="Rankings, mobile"><img src="mockups/screenshots/ballots-mobile.png" alt="Ballot breakdown, mobile"></p>

*Above: rankings (mobile) and the ballot breakdown (mobile, by-voter view). On mobile the table collapses record/conference into the team cell and hides previous rank and share bars.*

```tsx
// packages/ui/src/components/rank-row.tsx (sketch)
import { TableRow, TableCell } from "@rs/ui/components/ui/table";
import { Badge } from "@rs/ui/components/ui/badge";
import { MovementIndicator } from "./movement-indicator";
import { TeamMark } from "./team-mark";

export function RankRow({ r, followed }: { r: PollResultRow; followed: boolean }) {
  return (
    <TableRow data-followed={followed} className="data-[followed=true]:bg-accent/30">
      <TableCell className="pl-4 text-right font-display text-xl font-bold tabular">{r.tie ? `T-${r.rank}` : r.rank}</TableCell>
      <TableCell className="w-12"><MovementIndicator prev={r.previousRank} curr={r.rank} /></TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <TeamMark school={r.school} className="size-8" />
          <a href={urls.teamSport(r.school.slug, "cfb")} className="font-semibold hover:underline">{r.school.name}</a>
          {r.firstPlaceVotes > 0 && <span className="text-xs text-muted-foreground">({r.firstPlaceVotes})</span>}
          {followed && <Badge variant="outline" className="border-primary/40 text-primary">Following</Badge>}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-muted-foreground">{r.record ?? "—"}</TableCell>
      <TableCell className="text-right font-semibold tabular">{r.points.toLocaleString()}</TableCell>
    </TableRow>
  );
}
```

#### 32.11a Voter Ballot Breakdown (`/{sport}/rankings/{division}/{year}/{week}/ballots`)

Published with the poll (never before). One page per poll week; `…/ballots/{voter}` is the single-voter view.

- **Teams × voters matrix** (`BallotMatrix`, shadcn `Table` in a horizontal `ScrollArea`; sticky rank/team columns): rows are teams in published order, then others receiving votes below a divider (RV); columns are voters (vertical labels); each cell is the rank that voter gave (or "–"). Cell shading is a 5-step ramp of `--primary` (1–5 darkest … 21–25 lightest) with the numeral always printed, so it's readable without color. Pts and first-place votes sit next to the team.
- **Outliers** get `ring-2 ring-inset ring-gold` and are listed in a "Biggest outliers" card. Rule (documented on the methodology page): |voter rank − published rank| ≥ 7, or a voter omits a team ranked in the top 15, or ranks a non-Top-25 team 18th or better. Thresholds are config, not code.
- **Voter filter** (`Command` in a `Popover` + chips): highlight or restrict columns; "Outliers only" and "Show RV" switches; sort columns by ballot order or name. Filters write `?voters=07,12`; the canonical stays the base URL and the page is still prerendered (the filter is a client-side view over the cached data).
- **Per-team vote distribution** (`Card` + small bar chart): ranks received on all ballots for the selected team, with consensus, median, high and low. Team picker is a `Select`.
- **Each voter's full ballot** (`Card`, five columns on desktop): rank, team, ▲/▼ vs consensus when ≥ 3 spots, optional voter note.
- **Mobile**: default to **By voter** (voter `Select` with previous/next buttons, full 25-team list, outlier rows tinted `bg-gold/10` with an "Outlier" badge), then the distribution and outliers cards; the matrix is still available as a tab (horizontal scroll).
- Data: one cached query per poll week (`"use cache"`, tags `poll:<weekId>` and `ballots:<weekId>`): `ballot_entries` joined to `ballots` (locked, published week) and `poll_results`; outlier flags and distributions are computed in TypeScript from that one result set. CSV download and the reproducibility hash link to §13.

![Voter Ballot Breakdown, desktop full page](../mockups/screenshots/ballots-desktop-full.png)

### 32.12 Bracket Challenge UI

Two separate screens, two URLs: the **bracket view** (`/college-football/bracket-challenge/fcs/2026`, everyone, after lock it's the main page) and the **pick editor** (`…/2026/my-bracket`, the signed-in entry).

#### Studied: MarchArena (marcharena.com)

I fetched and screenshotted marcharena.com (desktop 1440×900 and mobile 390×844). It's a March Madness bracket viewer with almost no chrome: a light grey canvas, four regions laid out as two halves that converge on a centred Final Four and Championship, small white matchup cards (seed, logo, short name, score, winner row tinted), thin connector lines, a blue ring on the selected game, and a **persistent matchup panel on the right** (both teams large with seed badges and score, a comparison table, a history bar and notes). On mobile the bracket sits in a fixed-height pane you pan inside, with the matchup panel stacked below.

*(MarchArena reference screenshot not included in the handoff: it shows third-party content.)*

**What we borrowed (and what we changed)**

| MarchArena element | Redshirt version |
|---|---|
| Two halves converging on a centred final | FCS 24: top half (seeds 1, 8, 4, 5) left, bottom half (2, 7, 3, 6) right, semifinals and championship on the centre line, champion card below. `cfp12` uses the same layout; `d2_28`/`d3_32` add a column |
| Compact matchup cards with seed + short name, winner row tinted | `BracketGame` (`Card` + two rows): seed, condensed short name (Barlow Condensed so names fit), **pick share %** instead of scores (we don't run scores); winner row `bg-up/10` + bold once staff enter results; loser muted |
| Thin connector lines on a grey canvas | SVG elbows in `stroke-border` on `bg-muted/50`; cards `bg-card shadow-xs rounded-md` |
| Selected game ring | `ring-2 ring-primary` (Redshirt red instead of blue) |
| Persistent right-hand matchup panel | `MatchupPanel` (320 px, `ScrollArea`): both teams large with seed `Badge`, conference, admin-entered record, Redshirt poll rank; **pick distribution** bar (our entries' data); your pick and its point value; **Redshirt coverage** links (previews); your group's top three. No KenPom-style stats, no history claims: only Redshirt data |
| Minimal chrome | Slim sub-header (title, Bracket / My picks / Leaderboard / Groups / Rules, a "Viewing" segmented control: Results + my picks, Most picked, Actual only) |
| Mobile: pannable fixed-height bracket pane, panel below | Same, plus half/final `Tabs` to jump, and the pick editor stays a round-by-round list (better for thumbs) |
| Not borrowed | Region names, external stats tables, historical seed-win percentages (we would have to source them), ads inside the canvas |

**Your-pick overlay.** A 2 px `bg-primary` bar on the left of rows you picked; after results, correct picks keep the winner tint and wrong ones show the loser style (strikethrough only in the editor). The legend sits above the canvas.

![Bracket view (MarchArena-inspired), desktop (1440×900)](../mockups/screenshots/bracket-desktop.png)

#### Pick editor (`…/my-bracket`)

- **Desktop** (`BracketBoard`): horizontal tree, one column per round (First round → Second round → Quarterfinals → Semifinals → Final → Champion card with the tiebreaker input). Each `BracketGame` has a header (round · game, date "TBD"/admin-entered) and two `toggle-group` items; the picked team uses `bg-accent text-accent-foreground` with a check. Byes are explicit: seeded teams appear first in round two. Above the board: entry progress + Save, groups summary, lock reminders switch. Lock countdown shows ET and the user's zone.
- **Mobile** (`BracketRounds`): round `tabs` with per-round completion ("R2 8/8"), a vertical list of games, a **sticky footer** with progress ("20 of 23 picks"), lock countdown and Save above the bottom nav. Picking a winner auto-advances; changing a pick clears dependent picks with a toast.
- Keyboard: arrow keys move between games, Space/Enter picks; each game is a `radiogroup` labelled "Second round, game 3". On the view, games are buttons that update the matchup panel (`aria-controls`).

![Pick editor, desktop (1440×900)](../mockups/screenshots/bracket-picks-desktop.png)

<p class="shots"><img src="mockups/screenshots/bracket-mobile.png" alt="Bracket view, mobile"><img src="mockups/screenshots/bracket-picks-mobile.png" alt="Pick editor, mobile round-by-round"><img src="mockups/screenshots/ballot-vote-mobile.png" alt="Ballot on vote., mobile"></p>

*Above: bracket view (mobile, pannable pane + matchup panel), pick editor round-by-round (mobile), and the voter ballot on vote.redshirtsports.com (mobile).*

### 32.13 Ballot UI on vote.redshirtsports.com

- Distinct, minimal app shell ("Redshirt Vote" mark, vote. hostname badge, Ballots/History/Profile, voter avatar), same tokens so it's recognizably Redshirt.
- Status badges (Window open · poll · week), deadline in ET and voter's local time, autosave indicator.
- **Validation** with `alert`: hard rule (25 unique teams required to submit) and soft, optional nudges (e.g. "You moved No. 13 eight spots from last week; add a short note for the transparency page"). No game-result-based warnings (there is no games data).
- **Ranking list** (`BallotEditor`): `@dnd-kit/sortable` drag handles (pointer + touch), keyboard up/down buttons on desktop and `KeyboardSensor` for accessibility, remove buttons, dashed empty slots. The dragged row lifts (ring + shadow).
- **Eligible teams** panel (desktop rail / mobile tab): `command` search, conference filter chips, "On ballot" state, add buttons.
- **Sticky submit bar**: progress "23 of 25 ranked", Preview, Submit (disabled until valid; confirm `dialog` before final submit).

![Ballot on vote.redshirtsports.com, desktop (1440×900)](../mockups/screenshots/ballot-vote-desktop.png)

```tsx
// apps/vote/app/ballot/[poll]/[year]/[week]/ballot-editor.tsx (sketch)
"use client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export function BallotEditor({ initial, size = 25, onSave }: Props) {
  const [ids, setIds] = useState<string[]>(initial);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const issues = validateBallot(ids, size);          // from @rs/polls (pure)
  useAutosave(ids, onSave);                          // debounced server action, Sonner toast on error
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]}
      onDragEnd={({ active, over }) => over && active.id !== over.id &&
        setIds((x) => arrayMove(x, x.indexOf(String(active.id)), x.indexOf(String(over.id))))}
      accessibility={{ announcements: ballotAnnouncements }}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ol className="grid gap-1.5">{ids.map((id, i) => <BallotRow key={id} id={id} rank={i + 1} />)}</ol>
      </SortableContext>
      <BallotSubmitBar count={ids.length} size={size} issues={issues} />
    </DndContext>
  );
}
```

`BallotEditor` is used only on `vote.` by invited voters; there is no public ranking builder (fan vote removed in v1.5).

### 32.14 People profiles and page-builder pages

- **People profile** (`/people/{slug}`): header with circular portrait (`SanityImage`, 1:1 crop), name in display type, role/beat badges, social links, Follow (writer) button; bio (serif); tabs "Latest" (river), "Ballots" (if a voter: links to every public ballot), "Podcasts". JSON-LD `ProfilePage` (§19).
- **Page-builder pages** (`/about`, `/staff`, `/advertise`, …): sections render as shadcn compositions: `hero` (display headline + dek + optional image), `richText` (serif prose), `staffGrid` (cards with avatar/role/Follow), `faq` (`accordion`), `cta` (ink card with primary button), `jobListings` (cards with `badge` for location/type), `contactForm` (`form` + `input` + `textarea`). Section spacing and container widths come from the same tokens, so editor-built pages match app pages. Visual editing overlays (Presentation tool) work on each section (§12.8).

### 32.15 Ad slots without wrecking layout (CLS)

- Every slot is an `AdSlot` with a **fixed min-height per breakpoint** (`min-h-[90px] md:min-h-[90px]` for 970×90/728×90; `min-h-[250px]` for 300×250; `min-h-[100px]` for 320×100 mobile) and centered content; the reserved box shows a subtle "Advertisement" label when empty or collapsed (never collapse to zero after render).
- Slots: home leaderboard after the lead package, rail 300×250 (sticky on article), in-article after paragraph 3 and every ~6 paragraphs, river after every 6th item. None above the H1 on mobile; no interstitials; no sticky bottom ads on mobile (bottom nav lives there).
- Load ads after consent (CMP) and after LCP (`requestIdleCallback`), lazy-load below-the-fold slots with an `IntersectionObserver` 1 viewport ahead. Infinite next articles create their own slots with the same reserved sizes.
- Budget: CLS ≤ 0.05 on article and home with ads on (§26). Lighthouse CI fails the build if exceeded.

### 32.16 Accessibility specifics

- Contrast: all token pairs checked at AA in both themes (CI test computes contrast from the OKLCH tokens with `culori`).
- Focus: shadcn `focus-visible:ring-[3px] ring-ring/50` everywhere; skip link to main content; `aria-current="page"` on nav.
- Movement indicators always have text ("Up 2") not just color/arrow; rank tables have `<caption>` and `scope`.
- Bracket and ballot fully operable by keyboard with live-region announcements (dnd-kit announcements; "Picked Montana State to win Second round game 3").
- Ticker: pausable, no auto-motion with `prefers-reduced-motion`, links reachable by tab.
- Touch targets ≥ 44×44 px on mobile (bracket rows are 44 px tall in production; the mockup is denser for overview).
- Dark mode respects `prefers-color-scheme`; user choice persists.

### 32.17 Mockup files and screenshots

Every mockup shows its public URL in the top ribbon so the folder ↔ URL mapping (§17) is visible.

| File | Screen (URL) | Screenshots |
|---|---|---|
| `docs/mockups/index.html` | Home `/` (light/dark, mega nav, mobile sheet) | `home-desktop.png`, `home-desktop-full.png`, `home-mobile.png`, `home-desktop-dark.png`, `nav-mega-desktop.png`, `nav-sheet-mobile.png` |
| `docs/mockups/article.html` | Article `/college-football/news/{slug}` | `article-desktop.png`, `article-desktop-full.png`, `article-mobile.png` |
| `docs/mockups/news.html` | **News index** `/college-football/news` | `news-desktop.png`, `news-desktop-full.png`, `news-mobile.png` |
| `docs/mockups/division-news.html` | **Division news** `/college-football/fcs/news?page=2` | `division-news-desktop.png`, `division-news-desktop-full.png`, `division-news-mobile.png` |
| `docs/mockups/rankings.html` | Rankings `/college-football/rankings/fcs` | `rankings-desktop.png`, `rankings-desktop-full.png`, `rankings-mobile.png` |
| `docs/mockups/ballots.html` | **Voter Ballot Breakdown** `/college-football/rankings/fcs/2026/week-7/ballots` | `ballots-desktop.png`, `ballots-desktop-full.png`, `ballots-desktop-dark.png`, `ballots-mobile.png` |
| `docs/mockups/bracket.html` | **Bracket view (MarchArena-inspired)** `/college-football/bracket-challenge/fcs/2026` | `bracket-desktop.png`, `bracket-mobile.png` |
| `docs/mockups/bracket-picks.html` | Pick editor `…/fcs/2026/my-bracket` | `bracket-picks-desktop.png`, `bracket-picks-mobile.png` |
| `docs/mockups/ballot.html` | Ballot on `vote.redshirtsports.com/ballot/fcs/2026/week-7` | `ballot-vote-desktop.png`, `ballot-vote-mobile.png` |
| `docs/mockups/team.html` | **Team hub, sport section** `/teams/montana-state-bobcats/football` | `team-hub-desktop.png`, `team-hub-desktop-full.png`, `team-hub-mobile.png` |
| `docs/mockups/transfer-portal.html` | **Transfer Portal hub** `/college-football/transfer-portal` | `transfer-portal-desktop.png`, `transfer-portal-desktop-full.png`, `transfer-portal-mobile.png` |
| `docs/mockups/portal-tracker.html` | **Portal Tracker** `/transfer-portal?division=fcs` | `portal-tracker-desktop.png`, `portal-tracker-desktop-full.png`, `portal-tracker-mobile.png` |
| `docs/mockups/recruiting.html` | **Recruiting hub** `/college-football/recruiting` | `recruiting-desktop.png`, `recruiting-desktop-full.png`, `recruiting-mobile.png` |
| (reference, not included) | marcharena.com, studied for §32.12 | Not in the handoff (third-party content) |
| (reference, not included) | on3.com Transfer Portal Wire, studied for §16.1 | Not in the handoff: real On3 data, study only |

- Source: `docs/mockups/src/app.css` (theme tokens), `docs/mockups/gen/*.py` (`pages.py` v1.3 screens, `pages2.py` v1.4 screens, `pages3.py` v1.5 portal tracker; shadcn-equivalent helpers in `ui.py`, including `pagination()`), compiled CSS `docs/mockups/css/app.css` (Tailwind v4 CLI), fonts in `docs/mockups/fonts/`.
- Rebuild: `cd docs/mockups && python3 gen/build.py && npx @tailwindcss/cli -i src/app.css -o css/app.css && python shoot.py` (Playwright + Chrome; desktop 1440×900 at 1×, mobile 390×844 at 2×). `shoot.py news ballots` reshoots a subset.
- When building the real apps, port the markup to the React shadcn components named in §32.5; class strings mirror the shadcn defaults.

## Appendix A: Bracket templates

### A.1 FCS 24 (`fcs24`): 24 teams, 23 games, 8 byes

```mermaid
flowchart LR
  U1[U1] --> R1G1
  U2[U2] --> R1G1
  U3[U3] --> R1G2
  U4[U4] --> R1G2
  R1G1 --> R2G1
  S1[No. 1 seed - bye] --> R2G1
  R1G2 --> R2G2
  S8[No. 8 seed - bye] --> R2G2
  R2G1 --> QF1
  R2G2 --> QF1
  QF1 --> SF1
  QF2[QF2: S4/S5 side] --> SF1
  SF1 --> F[Championship]
  SF2[SF2: S3/S6, S2/S7 sides] --> F
```

| Round | Games | Standard points | Round total |
|---|---|---|---|
| First round | 8 | 10 | 80 |
| Second round (seeds enter) | 8 | 20 | 160 |
| Quarterfinals | 4 | 40 | 160 |
| Semifinals | 2 | 80 | 160 |
| Championship | 1 | 160 | 160 |
| **Total** | **23** | | **720** |

### A.2 CFP 12 (`cfp12`): 12 teams, 11 games, 4 byes

```mermaid
flowchart LR
  S8[8] --> G1[R1: 8 v 9]
  S9[9] --> G1
  S5[5] --> G2[R1: 5 v 12]
  S12[12] --> G2
  S6[6] --> G3[R1: 6 v 11]
  S11[11] --> G3
  S7[7] --> G4[R1: 7 v 10]
  S10[10] --> G4
  S1[1 - bye] --> Q1[QF1]
  G1 --> Q1
  S4[4 - bye] --> Q2[QF2]
  G2 --> Q2
  S3[3 - bye] --> Q3[QF3]
  G3 --> Q3
  S2[2 - bye] --> Q4[QF4]
  G4 --> Q4
  Q1 --> SF1
  Q2 --> SF1
  Q3 --> SF2
  Q4 --> SF2
  SF1 --> F[National Championship]
  SF2 --> F
```

| Round | Games | Balanced points | Round total |
|---|---|---|---|
| First round | 4 | 40 | 160 |
| Quarterfinals | 4 | 40 | 160 |
| Semifinals | 2 | 80 | 160 |
| Championship | 1 | 160 | 160 |
| **Total** | **11** | | **640** |

### A.3 D-II 28 (`d2_28`): 4 super regions × 7, 27 games, 4 byes

Per region: 4v5, 3v6, 2v7 in round 1; No. 1 plays the 4/5 winner and the 2/7 winner plays the 3/6 winner in round 2; regional final is the national quarterfinal.

| Round | Games | Standard points | Round total |
|---|---|---|---|
| First round | 12 | 10 | 120 |
| Second round | 8 | 20 | 160 |
| Quarterfinals (regional finals) | 4 | 40 | 160 |
| Semifinals | 2 | 80 | 160 |
| Championship | 1 | 160 | 160 |
| **Total** | **27** | | **760** |

### A.4 D-III 32 (`d3_32`): 32 teams, 31 games, no byes

| Round | Games | Standard points | Round total |
|---|---|---|---|
| First round | 16 | 10 | 160 |
| Second round | 8 | 20 | 160 |
| Quarterfinals | 4 | 40 | 160 |
| Semifinals | 2 | 80 | 160 |
| Stagg Bowl | 1 | 160 | 160 |
| **Total** | **31** | | **800** |

### A.5 NCAA basketball 68 (`ncaab68`): First Four + 64

| Round | Games | Suggested points | Round total |
|---|---|---|---|
| First Four (optional, default unscored) | 4 | 0 | 0 |
| Round of 64 | 32 | 10 | 320 |
| Round of 32 | 16 | 20 | 320 |
| Sweet 16 | 8 | 40 | 320 |
| Elite Eight | 4 | 80 | 320 |
| Final Four | 2 | 160 | 320 |
| Championship | 1 | 320 | 320 |
| **Total** | **67** | | **1,920** |

### A.6 Engine invariants (tested for every format)

1. `games.length === team_count - 1` (single elimination).
2. Every slot feeds exactly one game; every non-final game feeds exactly one later game.
3. Following `winnerOf` links from any game reaches `finalGame`.
4. Round numbers strictly increase along feeds.
5. Seeded byes appear only as `slot` sides in round 2 (FCS, CFP, D-II).
6. Max score equals the table above for its default scoring config.

---

## Appendix B: Environment variables

| Variable | Apps | Secret |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | web, vote, admin | secret yes (except publishable) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | web, vote, admin | No |
| `SUPABASE_SECRET_KEY` | web/vote/admin (server) | Yes |
| `DATABASE_URL` (Supavisor transaction, 6543, `rs_server`, `?pgbouncer=true`) | web, vote, admin | Yes |
| `DATABASE_URL_SESSION` (5432, `rs_server`) | migrate/seed scripts, CI | Yes |
| `DB_POOL_MAX` | web, vote, admin | No |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | web, studio | No |
| `SANITY_API_READ_TOKEN`, `SANITY_REVALIDATE_SECRET`, `SANITY_PREVIEW_SECRET` | web (and studio for preview) | Yes |
| `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` | web, vote, admin | Yes |
| `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | all Next apps | DSN no / auth yes |
| `NEXT_PUBLIC_POSTHOG_KEY` | web | No |
| `CRON_SECRET`, `REVALIDATE_TOKEN` | admin → web | Yes |
| `VOTER_INVITE_SECRET` | admin, vote | Yes |
| `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_VOTE_URL`, `NEXT_PUBLIC_ADMIN_URL` | all | No |
| `WEB_URL` (server absolute, for revalidate calls) | admin, vote | No |

Removed vs 1.1: `CFBD_API_KEY`, workers-only vars, `SANITY_API_WRITE_TOKEN` (not needed without ingestion workers).

---

## Appendix C: Glossary

| Term | Meaning |
|---|---|
| AEO | Answer-engine optimization: making content easy for AI answer systems to cite accurately |
| Bye | A seeded team that skips the first round and enters in round 2 |
| Cache tag | A label attached to cached data so it can be invalidated by event (`revalidateTag`) |
| First-place votes | Number of ballots ranking a team No. 1 |
| Drizzle | TypeScript ORM used for the schema, migrations (drizzle-kit) and typed queries |
| Invite token | Signed, single-use, expiring link that turns an invited person into a voter for one poll and season |
| ISR | Incremental Static Regeneration: static pages regenerated after a time or on demand |
| MRU | Monthly retained user (Clerk's billing unit) |
| Others receiving votes | Teams with points that fall outside the Top 25 |
| PPR | Partial Prerendering: a static shell with streamed dynamic holes |
| Page builder | A Sanity `page` document assembled from typed sections, served by a catch-all route |
| Person | The Sanity document for any credited human; bylines reference it |
| RLS | Row Level Security in Postgres |
| Supavisor | Supabase's connection pooler (transaction mode on 6543, session mode on 5432) |
| Security definer | A Postgres function that runs with its owner's privileges, used to enforce write rules |
| Third-party auth | Supabase trusting JWTs issued by another provider (Clerk) |
| Tiebreaker | Rule that orders entries with equal scores (championship total / margin) |
| Manual result | Staff-entered winner (and optional scores) for a `bracket_games` row |
| Outbound link | Hub card that opens an external authoritative source (schedule, roster, NCAA) |
| Vote app | `apps/vote` at `vote.redshirtsports.com` for invited voters |

*End of blueprint.*

## Appendix D: Build order for Cursor

Hand this appendix to Cursor as the execution plan. One milestone = one PR against `main` (or your default branch). Do not skip acceptance criteria. Prefer implementing packages before apps that consume them.

### D.0 Conventions for the coding agent

- Work on feature branches; open PRs; never push straight to `main`.
- After each milestone: `pnpm lint`, `pnpm typecheck`, relevant `pnpm test`, and for DB milestones `supabase test db`.
- Do not invent sports-data ingestion, live blogs, rosters, player pages, or `apps/workers`.
- All URLs go through `@rs/seo/urls`. All DB writes go through `@rs/db` query functions.
- Pin dependency versions in the pnpm catalog when scaffolding.

---

### Milestone 0 — Monorepo skeleton

**Do:** Turborepo + pnpm workspaces; `apps/web`, `apps/vote`, `apps/admin`, `apps/studio` (empty Next shells); `packages/{ui,config,env,db,auth,sanity,polls,brackets,seo,emails,analytics,observability,testing}`; Biome; root scripts; Vercel project stubs; Clerk apps wired with `AUTHORIZED_PARTIES`; Supabase local `config.toml`.

**Accept when:**
- [ ] `pnpm i && pnpm dev` starts web:3000, vote:3001, admin:3002, studio:3333
- [ ] Each app renders a stub page and shares one button from `@rs/ui`
- [ ] Clerk sign-in works on web; `authorizedParties` listed
- [ ] CI workflow runs lint + typecheck on the PR

---

### Milestone 1 — Drizzle schema + migrations (core tables)

**Do:** Implement `packages/db` schema for users, roles, sports, schools, teams, conferences, seasons, weeks, team_seasons, polls/voters/invites/ballots/results, bracket_* (with `unique(sport,division,season_id)`), engagement (newsletter, contact). RLS policies. `adminDb` + `withRls`. `rs_server` role custom migration. Seed. pgTAP smoke tests for RLS deny-by-default on invites.

**Accept when:**
- [ ] `pnpm db:migrate` + `pnpm db:seed` on a fresh `supabase start`
- [ ] `drizzle-kit generate` produces no drift on CI
- [ ] Inserting a second `bracket_events` row for the same sport/division/season fails
- [ ] `withRls` test: user A cannot select user B's `bracket_entries` before lock

---

### Milestone 2 — Clerk webhook + auth helpers

**Do:** `upsertUserFromClerk`, soft delete, role mirror; webhook route on `apps/web` (or a tiny shared route package); `requireUserId` / `requireRole`; admin middleware staff gate; vote middleware protect.

**Accept when:**
- [ ] Creating a Clerk user produces a `users` row within one webhook delivery
- [ ] Non-staff visiting `admin.` get a 403 "Staff only" page linking to `vote.` (no redirect)
- [ ] Signed-out visitor hitting `/ballot` on vote. is sent to sign-in

---

### Milestone 3 — Sanity schemas + Studio + `sanity-image`

**Do:** `post`, `person`, `school`, `conference`, `category`, `tag`, `page` + sections, `podcast*`, `video`, `homepage`, `siteSettings`, `pollRelease`, `bracketPromo`, `jobPosting`. Studio structure. Reserved paths. Presentation tool pointed at web preview. `SanityImage` wrapper. Webhook → `revalidateTag`.

**Accept when:**
- [ ] Editor can publish a post with a 1920×1080 image and a byline `person`
- [ ] Featured image under 1920×1080 fails validation
- [ ] Page builder page at `/about` renders via catch-all
- [ ] Visual editing click-to-edit works on a page section in draft mode
- [ ] Article hero uses `SanityImage` with hotspot and LQIP

---

### Milestone 3b — Design system (§32)

**Do:** `packages/ui/src/styles/globals.css` exactly as §32.4 (Tailwind v4 `@theme inline`, oklch tokens, light/dark); `next/font` for Barlow Condensed, Inter, Source Serif 4; `components.json`; add the shadcn components listed in §32.5; build custom components (`SiteHeader` with mega nav, `TopTicker`, `StoryCard` variants, `RankingsTable`/`RankRow`/`MovementIndicator`, `TeamMark`, `AdSlot`, `FollowButton`, `OutboundLinkCard`); `next-themes`; a `/design` route (dev only) showing every component in both themes.

**Accept when:**
- [ ] No `tailwind.config.js` exists; all tokens come from `globals.css`
- [ ] `/design` renders all components in light and dark; contrast test passes AA for every token pair
- [ ] Header, ticker and story cards visually match `docs/mockups/screenshots/home-desktop.png` and `home-mobile.png` (side-by-side review)
- [ ] `AdSlot` reserves height at each breakpoint (Playwright CLS check ≤ 0.05 on a test page)
- [ ] `Pagination` renders real `<a href="?page=n">` links; page 1 link has no parameter

---

### Milestone 4 — Public newsroom routes

**Do:** Route manifest + factory + `pnpm routes:gen` (§17.3); sport hubs, division hubs, news index and division news with `?page=n`, article `/{sport}/news/{slug}`, sport-agnostic team hubs `/teams/{school-nickname}` with sport sections, conference hubs, portal and recruiting hubs (§16), people pages, `@rs/seo` metadata + JSON-LD + news sitemap + OG. Legacy-redirect table stub. **No rewrites.**

**Accept when:**
- [ ] `/college-football/news/{slug}` returns 200 with NewsArticle JSON-LD
- [ ] `rg -n "rewrites|NextResponse.rewrite" apps packages` returns nothing; every `page.tsx` path under `app/(site)` equals its public URL
- [ ] `pnpm routes:gen && git diff --exit-code` passes (stubs are up to date)
- [ ] `/college-football/news?page=2` renders with canonical `…/news?page=2`; `?page=1` canonicalizes to `/college-football/news` without redirecting; `?page=0`, `?page=abc` and past the last page return 404
- [ ] The news shell is prerendered (PPR); only the river is dynamic and its data comes from a `"use cache"` function keyed by page
- [ ] `/teams/montana-state-bobcats/football` renders; `/teams/montana-state-bobcats/hockey` and `/college-football/xyz` return 404
- [ ] Editing a published post's slug is impossible in Studio (read-only)
- [ ] `/transfer-portal?division=fcs&status=committed&position=qb&sort=name&page=2` filters correctly, canonicalizes to `/transfer-portal?division=fcs&page=2` with `noindex, follow`; `?division=bogus` drops the filter (noindex), `?page=abc` 404s; no redirects
- [ ] **Blocked on the tracker UI redesign:** `PortalRow` uses a named-`grid-template-areas` `@utility` that restacks below `lg`, and matches the *approved redesign* (the v1.5 `portal-tracker-*.png` shots are layout reference only)
- [ ] Studio refuses to publish a committed `portalEntry` without `newSchool` and `committedOn`; an entry without a `story` shows a warning but publishes (story optional pending §30 #16); publishing expires `portal:<sport>`
- [ ] Root `/about` is a page-builder page; root `/some-old-article-slug` 301s when mapped
- [ ] Lighthouse CI budgets for an article page meet §26 (or are recorded with a follow-up issue if fonts pending)
- [ ] Team hub shows outbound schedule/roster link cards when URLs exist

---

### Milestone 5 — Polls domain + vote app

**Do:** Invite create/resend/revoke (admin); accept invite (vote); ballot editor; soft-validation warnings; `submitBallot`; poll tick cron (open/close/tabulate/publish); transparency pages on web; CSV export; MFA gate for voters; seasonal roster builder.

**Accept when:**
- [ ] Admin invites a user; invite email arrives; acceptance creates `voters` + Clerk `voter` role
- [ ] Second use of the same token fails; revoked token fails; wrong email fails
- [ ] Voter submits a 25-team ballot on `vote.`; after close it is locked
- [ ] Tick publishes on `publish_at`; web rankings page updates via tags without redeploy
- [ ] Public ballots page lists every locked ballot after publish; CSV hash matches `poll_week_summaries.computed_hash`
- [ ] `/college-football/rankings/fcs/2026/week-7/ballots` shows the teams × voters matrix, flags outliers per the configured rule, filters voters via `?voters=` without changing the canonical, and shows a per-team distribution (matches `ballots-desktop.png`, `ballots-mobile.png`)
- [ ] Property test: TS `tabulate` ≡ SQL variant on 50 random ballots

---

### Milestone 6 — Bracket engine + FCS event

**Do:** `@rs/brackets` formats + tests (Appendix A invariants); admin create event for `cfb/fcs/{year}` (unique); set field; public landing + pick editor on web; groups/invites; lock job; **manual results UI + `setBracketGameResult` + rescore**; leaderboards; share OG.

**Accept when:**
- [ ] Engine tests green for `fcs24` (23 games, 8 byes, max score 720)
- [ ] Creating two FCS events for the same season fails at the DB
- [ ] URL `/college-football/bracket-challenge/fcs/2026` resolves the unique event; `/college-football/bracket-challenge/fcs` renders a landing page (200, no redirect) linking to the current year
- [ ] Bracket view matches `bracket-desktop.png` / `bracket-mobile.png`: two halves converge on a centred final, selected game drives the `MatchupPanel`, pick share % comes from our entries only
- [ ] After lock, saves return `BRACKET_LOCKED`
- [ ] Staff sets R1 winners → entry scores and group standings update; clearing a result re-scores
- [ ] Incomplete entries at lock remain and score only picked games

---

### Milestone 7 — Remaining football brackets + polish

**Do:** `cfp12` (division `fbs`), `d2_28`, `d3_32`; newsletters (double opt-in + one digest); ads slots + CMP; Sentry crons; PostHog funnels; PWA manifest; full redirect import from current site; Search Console checklist.

**Accept when:**
- [ ] Each format passes engine invariants and a dry-run admin tournament
- [ ] Newsletter confirm → active → appears in Resend audience
- [ ] Poll tick and invite-expire crons checked in Sentry
- [ ] Old `/college/football/rankings/fcs/{year}/{week}` 301s to new poll URL
- [ ] Root legacy article slugs 301 to `/{sport}/news/{slug}`

---

### Milestone 7b — Retention (§31)

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

**Do:** `mbb` / `wbb` seasons, divisions, hubs, Top 25 polls, voter invites for basketball panels. No basketball bracket yet unless time remains (then `ncaab68` as Milestone 9).

**Accept when:**
- [ ] `/mens-college-basketball/rankings/d1` publishes a week
- [ ] Same poll engine code paths; no sport-specific forks beyond calendar config

---

### Explicit non-goals: refuse to build (reject if Cursor proposes them)

- Games/scores/standings ingestion or `/scores` / `/games` routes
- Live blogs or `*/live/*`
- Rosters or `/players/*`
- Recruiting/portal databases, feeds or scrapers (the portal tracker is Sanity `portalEntry` docs maintained by editors; the story link is optional pending §30 #16)
- Player photos, star ratings, grades, NIL valuations or prediction percentages in the tracker
- A fan vote or fan-built rankings (removed in v1.5)
- `apps/workers` or Sportradar/CFBD clients
- Moving voting back onto `admin.`
- **Any rewrite**: no `rewrites()` in any `next.config`, no `NextResponse.rewrite` in middleware, no proxy routes. App Router folders must map 1:1 to public URLs (§17)
- **Any redirect other than one-time legacy 301s** from old Redshirt URLs (§27): no slug-change, sport-change, "latest year", current→archive, `?page=1`, internal-path, case-normalization or role-based redirects. Render in place, set a canonical, or 404
- An internal `sports/[sport]` folder or a root `[sport]` dynamic segment (use the generated static sport folders, §17.3)
- Path-based `/page/n` pagination (use `?page=n`, §17.6)
- Sport-scoped team URLs like `/college-football/teams/{school}` as hubs (team hubs are `/teams/{school-nickname}`)
- Custom `next/image` Sanity loader (use `sanity-image` unless James reverses this)
- A `tailwind.config.js` or hard-coded hex colors in components (tokens only, §32.4)
- Comments/forums in 2026–27 (§31.9)
- Sign-in modals on page load or first article view (§31.2)


