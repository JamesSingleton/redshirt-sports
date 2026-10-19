## 17. Route map and URL structure (designed from scratch)

This route map is designed fresh; old Redshirt URLs get optional one-time 301s (§27). Two hard rules from James (v1.4):

1. **Zero rewrites.** No `rewrites()` in any `next.config`, no middleware rewrites, no proxy routing. **App Router folders map 1:1 to public URLs**: if a URL is `/college/football/fcs/news`, the file is `app/(site)/college/football/[division]/news/page.tsx` (route groups like `(site)` don't appear in URLs by definition).
2. **No routing redirects**, except two permanent cases: **one-time 301s from legacy Redshirt URLs** (§27) and **automatic 301s from Sanity `auto-redirect` when a slug changes**. No "current → archive", no "latest year", no internal-path, no `?page=1` redirects. Everything else renders in place with a correct canonical, or returns 404.

### 17.1 What the reference sites teach about URLs

These are observed URL *patterns*, described generally. Exact paths change over time.

| Site | Pattern style | Good | Avoid |
|---|---|---|---|
| ESPN | Sport-first paths (`/college/football/...`), sections like rankings; some entity pages use opaque `/_/id/<number>/` segments | Short, keyword-rich sport segment; each view has its own path | Opaque id segments and filters in path params are hard to read and share |
| The Athletic | Sport and team landing pages; articles carry an id plus slug | Stable article URLs | Long numeric ids add nothing for readers |
| 247Sports | Team sites as sub-sites; season-scoped pages | Season in path for rankings | Deep, inconsistent nesting between sections |
| On3 | Sport-agnostic team pages (school + nickname) with sport sections inside | One brand page per school; nickname makes the slug unambiguous and readable | Mixing URL schemes between sections |
| Bleacher Report | Short team "stream" pages | Short team URLs | Ambiguous without a nickname or sport section |
| SI | Team sites under one domain plus sport sections | Shared domain authority | Many sub-brands with different structures |

### 17.0 URL rationale: level, then sport (`/college/football/…`)

**Decision (James, v1.6):** the first path segment is the **competition level**, the second is the **sport**:

| Level | Sport sections | Status |
|---|---|---|
| `/college` | `/college/football`, `/college/mens-basketball`, `/college/womens-basketball` | Sport sections are built. **`/college` itself has no page and returns 404** (it was never a live URL, so it is not a legacy redirect). `/college/news` stays |
| `/high-school` | `/high-school/football` (first candidate) | **Future level, not built.** The segment is reserved now (`RESERVED_ROOT_SEGMENTS`) so no page-builder page can take it |

Why this shape:

| Choice | Example | Verdict |
|---|---|---|
| **Chosen: level + sport** | `/college/football/…`, `/college/mens-basketball/…`, `/high-school/football/…` later | Leaves room for a second level without renaming anything; the sport segment is the same word everywhere (`football`, `mens-basketball`, `womens-basketball`), matching the team-hub sport sections (`/teams/{school}/football`); breadcrumbs read naturally (College › Football › FCS); and it is the **shape the current Redshirt site already uses** (`/college/{sport}/…`), so many existing URLs survive unchanged and need no legacy redirect (§27) |
| Replaced (v1.0–1.5) | One keyword segment per sport, e.g. a combined “college + football” segment (exact old paths are listed in the Changes in 1.6 note) | One keyword segment, but it bakes the level into the sport name: a high-school section would need a parallel `/high-school-football/` scheme, and every current `/college/…` URL would have needed a 301 |
| Rejected | `/football/…` with level as a tab or query | Ambiguous across levels; breaks the folders-equal-URLs rule if level becomes a filter |
| Rejected | `/cfb/…`, `/ncaaf/…` | Cryptic; weaker for SEO and for editors linking in Sanity |

Rules that follow from it:
- `LEVELS` and `SPORTS` in the route manifest (§17.3) are the **single place** these strings are defined; `urls` (§17.8) builds every path as `/{level}/{sport}/…`.
- Basketball stays gendered (`mens-basketball`, `womens-basketball`). No unisex `/college/basketball/` alias.
- Search intent ("college football rankings") is served by titles, H1s, breadcrumbs and structured data (`College Football Rankings`), not by cramming the phrase into one segment.
- Adding high school later = one `LEVELS` entry + its `SPORTS` rows + `pnpm routes:gen`. Team hubs (`/teams/{school-nickname}`) are for colleges; how high-school teams are addressed is decided when that level is designed (out of scope now).

### 17.2 Design rules

1. **Level first, sport second** (§17.0): `/college/football`, `/college/mens-basketball`, `/college/womens-basketball`. `/college` itself returns 404. `/high-school/…` is a reserved future level.
2. **Section third, scope fourth, time last**: `/{level}/{sport}/{section}/{division}/{season}/{week}`, e.g. `/college/football/rankings/fcs/2026/week-7`. (Below, `/{sport}/…` is shorthand for `/{level}/{sport}/…`.)
3. **Readable time segments**: `2026`, `week-7`, `preseason`, `final`. Basketball seasons use the starting year (`2026` = 2026-27).
4. **"Current" URLs have no time segment** and render the latest (`/college/football/rankings/fcs`); archive URLs have it. Both self-canonicalize. No redirect between them.
5. **Articles live at `/{sport}/news/{slug}`**, no id suffix. Slugs are **globally unique** and **editable**. Changing `slug` or `primarySport` creates a permanent 301 from the old URL to the new one via Sanity `auto-redirect` (keep that function's paths in sync with `urls`). A request whose sport segment doesn't match the article's `primarySport` returns 404 (we never link to it); the old sport URL is the redirect, not a second render.
6. **The site root is reserved for page-builder pages** (`/about`, `/privacy`, …) via `app/(site)/[...slug]`. Its only extra job: if no Sanity page matches, look up the legacy-redirect table (one-time 301s from old Redshirt root URLs), else 404.
7. **Team hubs are sport-agnostic, On3-style**: `/teams/{school-slug-nickname}` (e.g. `/teams/montana-state-bobcats`) with sport sections inside: `/teams/montana-state-bobcats/football`, `/mens-basketball`, `/womens-basketball` (§17.5).
8. **Pagination uses `?page=n`** (SI / The Athletic pattern), page 1 has no parameter (§17.6).
9. **Tabs are path segments** (`/news`, `/rankings`, `/football`); **query strings are only for pagination and view filters** (`?page=`, `?voters=` on the ballot breakdown).
10. **Lowercase, hyphens, no trailing slash, no file extensions** (except feeds and sitemaps). We never generate other forms; we add no normalization middleware. (Next.js's built-in trailing-slash normalization is framework behavior, not app routing; leave the default.)
11. **Signed-out visits to personal pages render in place**: `/account/*`, `/onboarding`, `…/my-bracket` show an inline Clerk `<SignIn />` card (with `forceRedirectUrl` set to the current path, which is a client navigation after sign-in, not an HTTP redirect) instead of bouncing to `/sign-in`. Middleware does not call `auth.protect()` on `www`.
12. **Personal and interactive URLs are `noindex`**: account, onboarding, pick editor, group join links, search, all of `vote.` and `admin.`.

### 17.3 Folder strategy: explicit level + sport folders + a route-config factory

**Decision:** there is **no** `app/(site)/college/page.tsx`. `/college` returns 404. `/college/news` stays (`app/(site)/college/news/page.tsx`). Sport sections are `app/(site)/college/football/…`, `app/(site)/college/mens-basketball/…`, and `app/(site)/college/womens-basketball/…`, or the repo's existing `college/[sport]` dynamic segment with `generateStaticParams` + `dynamicParams = false` (the accepted alternative; Milestone 0 keeps the dynamic segment). The page files inside are **two-line stubs** that bind a sport to a shared route module created by a factory in `apps/web/src/routes/`. The stubs are **generated** from a route manifest (sports × templates) so the sport trees can't drift, and a future `app/(site)/high-school/football/…` is one manifest entry away. Do not add a `urls.level()` helper; there is no `/college` page to link.

Why this approach:

| Option | URL ↔ folder 1:1 | Rewrites/redirects | Verdict |
|---|---|---|---|
| Internal `sports/[sport]` + `beforeFiles` rewrites (v1.3) | No (folder says `/sports/`) | Rewrite + 308 for the internal path | **Rejected** (violates both rules) |
| Root `[sport]` dynamic segment | Yes | None | **Rejected**: Next.js can't have `[sport]` and the page-builder `[...slug]` as different dynamic siblings at the root; it would also make every unknown root path ambiguous |
| Middleware routing | No | Rewrites | **Rejected** |
| `college/[sport]` dynamic segment + `generateStaticParams` + `dynamicParams = false` | Yes | None | **Acceptable alternative** since v1.6: under the static `college/` folder a `[sport]` segment no longer competes with the root `[...slug]` (this is also how the current repo is built). Codegen stays the default because per-sport layouts, metadata and division params differ |
| **Explicit static level + sport folders + route factory + codegen stubs** | **Yes** | **None** | **Chosen**: static segments always win over the root catch-all, so `/college/football/...` never collides with page-builder pages; each folder is exactly the URL; shared logic lives once in `src/routes/*`; adding a sport is one manifest line + `pnpm routes:gen` |

How it works:

```ts
// apps/web/src/routes/manifest.ts — single source of truth for levels and sport sections
export const LEVELS = {
  college: { path: "college", label: "College" },
  // "high-school": { path: "high-school", label: "High School" },   // FUTURE level (§17.0): reserved, not built
} as const;
export type Level = keyof typeof LEVELS;

export const SPORTS = {
  cfb: { level: "college", path: "football",          label: "College Football",          teamPath: "football",          divisions: ["fbs", "fcs", "d2", "d3", "naia"] },
  mbb: { level: "college", path: "mens-basketball",   label: "Men's College Basketball",  teamPath: "mens-basketball",   divisions: ["d1", "d2", "d3"] },
  wbb: { level: "college", path: "womens-basketball", label: "Women's College Basketball", teamPath: "womens-basketball", divisions: ["d1", "d2", "d3"] },
  // hsfb: { level: "high-school", path: "football", label: "High School Football", ... }  // future
} as const satisfies Record<string, { level: Level; path: string; label: string; teamPath: string; divisions: readonly string[] }>;
export type Sport = keyof typeof SPORTS;

/** `/college/football` — the only place a sport's base path is assembled */
export const sportBase = (s: Sport) => `/${LEVELS[SPORTS[s].level].path}/${SPORTS[s].path}`;

// Templates under every level folder: app/(site)/{level}/…
export const LEVEL_TEMPLATES = [
  ["page.tsx", "levelHub"],                             // /college: every college sport, latest college news, poll snapshots
  ["news/page.tsx", "levelNews"],                       // /college/news?page=n (all college news)
] as const;

// Templates that exist under every sport folder: app/(site)/{level}/{sport}/… (relative path → route module export)
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
  ["rankings/[division]/history/page.tsx", "pollHistory"],          // v1.7: static "history" beats [year]
  ["rankings/[division]/history/[year]/page.tsx", "pollHistorySeason"],
  ["rankings/[division]/[year]/[week]/page.tsx", "pollWeek"],
  ["rankings/[division]/[year]/[week]/ballots/page.tsx", "ballotBreakdown"],
  ["rankings/[division]/[year]/[week]/ballots/by-voter/page.tsx", "ballotsByVoter"],  // static beats [voter]; "by-voter" is a reserved voter slug
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
import { SPORTS, sportBase, type Sport } from "./manifest";

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
    return pageMetadata({ base: `${sportBase(sport)}/news`, page, title: `${SPORTS[sport].label} News` });
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
// apps/web/app/(site)/college/football/news/page.tsx — GENERATED by `pnpm routes:gen`, do not edit
import { sportNews } from "@/routes/sport-news";
const r = sportNews("cfb");
export default r.Page;
export const generateMetadata = r.generateMetadata;
```

```tsx
// apps/web/app/(site)/college/football/[division]/page.tsx — GENERATED
import { divisionHub } from "@/routes/division-hub";
const r = divisionHub("cfb");
export default r.Page;
export const generateMetadata = r.generateMetadata;
export const generateStaticParams = r.generateStaticParams;   // [{division:"fbs"},{division:"fcs"},…]
export const dynamicParams = false;                            // any other value → 404, no catch-all fallthrough
```

`scripts/routes-gen.ts` writes every stub from `LEVELS × LEVEL_TEMPLATES` (into `app/(site)/{level}/`) and `SPORTS × SPORT_TEMPLATES` (into `app/(site)/{level}/{sport}/`), plus the non-sport routes, and deletes stale ones; CI runs it and fails on `git diff --exit-code`. Shared layouts (`layout.tsx` with sport theming and sub-nav) are stubs too. If James prefers zero codegen, the stubs can be hand-written; the manifest + factory still prevents logic drift.

**Why static siblings are safe:** under `college/`, the static `news` folder and the three static sport folders are the only children, so `/college/news` is the level news index and `/college/anything-else` matches no `college/*` route; it falls to the root `[...slug]`, which 404s immediately because `college` is a reserved root segment. Under `college/football/`, static folders (`news`, `rankings`, `conferences`, `teams`, `transfer-portal`, `recruiting`, `bracket-challenge`) always match before the dynamic `[division]`; `[division]` uses `dynamicParams = false`, so `/college/football/anything-else` is a 404 rather than an accidental division page. At the root, `college/` and the other static folders win over `[...slug]`. `/high-school/…` 404s until that level exists.

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
│       ├── college/                                 # LEVEL folder (static); high-school/ is a future sibling, not built
│       │   ├── (no page.tsx)                        # /college returns 404 (never a live URL)
│       │   ├── news/page.tsx                        # /college/news?page=n (all college news)
│       │   ├── football/                            # ← GENERATED stubs (same tree for mens-basketball/, womens-basketball/)
│       │   │   ├── layout.tsx                       # sport sub-nav
│       │   │   ├── page.tsx                         # /college/football
│       │   │   ├── feed.xml/route.ts
│       │   │   ├── news/
│       │   │   │   ├── page.tsx                     # /college/football/news?page=n
│       │   │   │   └── [slug]/page.tsx              # /college/football/news/{slug}
│       │   │   ├── [division]/
│       │   │   │   ├── page.tsx                     # /college/football/fcs
│       │   │   │   └── news/page.tsx                # /college/football/fcs/news?page=n
│       │   │   ├── conferences/
│       │   │   │   ├── page.tsx
│       │   │   │   └── [conf]/page.tsx
│       │   │   ├── teams/page.tsx                   # directory → links to /teams/{slug}/football
│       │   │   ├── rankings/
│       │   │   │   ├── page.tsx
│       │   │   │   ├── methodology/page.tsx
│       │   │   │   └── [division]/
│       │   │   │       ├── page.tsx                 # current poll
│       │   │   │       ├── voters/page.tsx
│       │   │   │       ├── voters/[voter]/page.tsx
│       │   │   │       ├── history/page.tsx         # v1.7 poll history (current season)
│       │   │   │       ├── history/[year]/page.tsx  # past seasons
│       │   │   │       └── [year]/[week]/
│       │   │   │           ├── page.tsx             # archive poll week
│       │   │   │           └── ballots/
│       │   │   │               ├── page.tsx         # Voter Ballot Breakdown, all ballots (§13, §32)
│       │   │   │               ├── by-voter/page.tsx # v1.7 by-voter view
│       │   │   │               └── [voter]/page.tsx
│       │   │   ├── transfer-portal/page.tsx         # article-driven hub ?page=n
│       │   │   ├── recruiting/page.tsx              # article-driven hub ?page=n
│       │   │   └── bracket-challenge/
│       │   │       ├── page.tsx
│       │   │       └── [division]/
│       │   │           ├── page.tsx                 # division landing (current + archive), no redirect
│       │   │           └── [year]/
│       │   │               ├── layout.tsx           # loads THE event (sport, division, year) or 404
│       │   │               ├── page.tsx             # event landing / bracket view
│       │   │               ├── opengraph-image.tsx
│       │   │               ├── my-bracket/page.tsx
│       │   │               ├── leaderboard/page.tsx # ?page=n
│       │   │               ├── entries/[entryId]/page.tsx
│       │   │               ├── entries/[entryId]/opengraph-image.tsx
│       │   │               ├── groups/page.tsx
│       │   │               ├── groups/[groupId]/page.tsx
│       │   │               └── join/[code]/page.tsx
│       │   ├── mens-basketball/                     # same generated tree (divisions d1|d2|d3)
│       │   └── womens-basketball/                   # same generated tree
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
/college                                  LEVEL hub: every college sport, latest college news, poll snapshots
/college/news                             All college news (?page=n)
/college/football                         Sport hub (news, rankings, bracket CTAs, external links)
/college/mens-basketball                  Sport hub
/college/womens-basketball                Sport hub
/high-school/...                          FUTURE level (reserved, 404 until built)
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
| `/college` | **404** | No page. Not a legacy URL, so do not 301 it. Child routes `/college/news` and `/college/{sport}` stay. Omit it from the sitemap, breadcrumbs, and nav. Breadcrumbs go Home → College Football |
| `/college/news` (`?page=n`) | All college news | §17.6 |
| `/college/football` | Sport hub | |
| `/college/football/{fbs\|fcs\|d2\|d3\|naia}` | Division hub | News, poll, bracket CTA, outbound links |
| `/college/football/news` (`?page=n`) | All CFB news | §17.6 |
| `/college/football/news/{slug}` | **Article** | Renders by slug; unknown slug 404s. Old slugs are handled by `redirects()` |
| `/college/football/fcs/news` (`?page=n`) | Division news | |
| `/college/football/conferences`, `/conferences/{conf}` | Conference index / hub | |
| `/college/football/teams` | Sport directory | Each row links to `/teams/{slug}/football` |
| `/college/football/rankings` | Rankings landing | |
| `/college/football/rankings/fcs` | **Current FCS Top 25** | |
| `/college/football/rankings/fcs/2026/week-7` | Archive poll week | |
| `/college/football/rankings/fcs/2026/week-7/ballots` | **Voter Ballot Breakdown** (all ballots) | Unfiltered matrix of all voters by default, outliers; `?voters=a,b` highlights only (canonical to base) |
| `/college/football/rankings/fcs/2026/week-7/ballots/by-voter` | **Ballots by voter** (v1.7) | Card per voter, full ballot + diff vs consensus; `?q=`, `?sort=` (noindex when set), `?page=n` |
| `/college/football/rankings/fcs/2026/week-7/ballots/{voter}` | One voter's ballot | |
| `/college/football/rankings/fcs/voters`, `/voters/{voter}` | Voter panel / profile | Roster links each voter to their ballot and `/people/{slug}` |
| `/college/football/rankings/fcs/history`, `/history/{year}` | **Poll history** (v1.7) | Chart, week-by-week table, No. 1 history |
| `/college/football/rankings/methodology` | Methodology | |
| `/college/football/transfer-portal` (`?page=n`) | **Portal hub** (article-driven) | §16 |
| `/transfer-portal` (`?division=fcs…`) | **Portal Tracker** (all sports, `portalEntry` rows) | Filters are query params; only sport/division/page are indexable (§16.1) |
| `/college/football/recruiting` (`?page=n`) | **Recruiting hub** (article-driven) | §16 |
| `/college/football/bracket-challenge` | Football bracket hub | |
| `/college/football/bracket-challenge/fcs` | Division landing | Current year card + past years; **renders, never redirects** |
| `/college/football/bracket-challenge/fcs/2026` | **Event** (rules/countdown before lock; bracket view after) | |
| `…/fcs/2026/my-bracket`, `/leaderboard?page=n`, `/entries/{id}`, `/groups`, `/groups/{id}`, `/join/{code}` | Bracket sub-pages | |
| `/teams/montana-state-bobcats` | **Team hub** (all sports) | Sport tabs + overview |
| `/teams/montana-state-bobcats/football` | Football section | News, poll history, bracket history, outbound links |
| `/teams/montana-state-bobcats/football/news` (`?page=n`) | Football news for the team | |
| `/teams/montana-state-bobcats/football/rankings` | Poll history | |
| `/teams/montana-state-bobcats/mens-basketball`, `/womens-basketball` | Basketball sections | Same sub-pages |
| `/teams/montana-state-bobcats/news` (`?page=n`) | All-sport team news | |

The `college-desktop.png` mockup is not a route. `/college` returns 404.

**Team slug rules.** `schools.slug` is the public hub slug `{school}-{nickname}` (lowercase, hyphenated): `montana-state-bobcats`, `north-dakota-state-bison`, `villanova-wildcats`. A school with no nickname, such as Hollins, keeps a single-token slug (`hollins`). Slugs are editable. A change is covered by Sanity `auto-redirect` (permanent 301). There is no `schools.slug` immutability trigger. `schools.short_slug` (`montana-state`) is kept for internal lookups and display, never in URLs.

Basketball mirrors the sport map, e.g. `/college/mens-basketball/rankings/d1/2026/week-9`, `/college/womens-basketball/news/{slug}`. A future level reuses the same templates: `/high-school/football/news`, `/high-school/football/rankings/…`.

### 17.6 Pagination: `?page=n` (SI / The Athletic pattern)

Every list page paginates with a query parameter: `/college/football/news?page=2`, `/college/football/fcs/news?page=3`, `/teams/montana-state-bobcats/news?page=2`, `/topics/{slug}?page=2`, `…/leaderboard?page=4`.

| Rule | Implementation |
|---|---|
| Page 1 | No parameter. `/college/football/news` is page 1 and its canonical. |
| `?page=1` | Renders page 1 with canonical **without** the parameter (no redirect). |
| Page n ≥ 2 | **Self-referencing canonical** including the param: `https://www.redshirtsports.com/college/football/news?page=2`. Title/description get " – Page 2". |
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
    if (!post || post.primarySport !== sport) notFound(); // unknown slug 404s; old slugs are handled by redirects()
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
import { LEVELS, SPORTS, sportBase, type Level, type Sport } from "@rs/web-routes/manifest";   // or a copy in @rs/seo
type Week = number | "preseason" | "final";
const weekSeg = (w: Week) => (typeof w === "number" ? `week-${w}` : w);
const q = (page?: number) => (page && page > 1 ? `?page=${page}` : "");

export const urls = {
  // No level() helper: /college has no page and must 404.
  levelNews: (l: Level, page?: number) => `/${LEVELS[l].path}/news${q(page)}`,                // /college/news
  sport: (s: Sport) => `${sportBase(s)}`,
  division: (s: Sport, d: string) => `${sportBase(s)}/${d}`,
  news: (s: Sport, page?: number) => `${sportBase(s)}/news${q(page)}`,
  divisionNews: (s: Sport, d: string, page?: number) => `${sportBase(s)}/${d}/news${q(page)}`,
  article: (p: { primarySport: Sport; slug: string }) => `${sportBase(p.primarySport)}/news/${p.slug}`,
  team: (schoolSlug: string) => `/teams/${schoolSlug}`,                                         // montana-state-bobcats
  teamSport: (schoolSlug: string, s: Sport, tab?: "news" | "rankings", page?: number) =>
    `/teams/${schoolSlug}/${SPORTS[s].teamPath}${tab ? `/${tab}` : ""}${q(page)}`,
  teamNews: (schoolSlug: string, page?: number) => `/teams/${schoolSlug}/news${q(page)}`,
  person: (slug: string, page?: number) => `/people/${slug}${q(page)}`,
  pollCurrent: (s: Sport, d: string) => `${sportBase(s)}/rankings/${d}`,
  pollWeek: (s: Sport, d: string, y: number, w: Week) => `${sportBase(s)}/rankings/${d}/${y}/${weekSeg(w)}`,
  ballots: (s: Sport, d: string, y: number, w: Week) => `${urls.pollWeek(s, d, y, w)}/ballots`,
  ballot: (s: Sport, d: string, y: number, w: Week, voter: string) => `${urls.ballots(s, d, y, w)}/${voter}`,
  ballotsByVoter: (s: Sport, d: string, y: number, w: Week, page?: number) => `${urls.ballots(s, d, y, w)}/by-voter${q(page)}`,
  voterPanel: (s: Sport, d: string) => `${sportBase(s)}/rankings/${d}/voters`,
  pollHistory: (s: Sport, d: string, year?: number) => `${sportBase(s)}/rankings/${d}/history${year ? `/${year}` : ""}`,
  methodology: (s: Sport) => `${sportBase(s)}/rankings/methodology`,
  portal: (s: Sport, page?: number) => `${sportBase(s)}/transfer-portal${q(page)}`,
  portalTracker: (f: Partial<PortalFilters> = {}) => portalCanonical({ sport: "football", sort: "newest", page: 1, ...f } as PortalFilters),
  recruiting: (s: Sport, page?: number) => `${sportBase(s)}/recruiting${q(page)}`,
  bracketDivision: (s: Sport, d: string) => `${sportBase(s)}/bracket-challenge/${d}`,
  bracketEvent: (s: Sport, d: string, y: number) => `${sportBase(s)}/bracket-challenge/${d}/${y}`,
  bracketEntry: (s: Sport, d: string, y: number, id: string) => `${urls.bracketEvent(s, d, y)}/entries/${id}`,
  bracketJoin: (s: Sport, d: string, y: number, code: string) => `${urls.bracketEvent(s, d, y)}/join/${code}`,
  voteInvite: (token: string) => `${process.env.NEXT_PUBLIC_VOTE_URL}/invite/${token}`,
  voteBallot: (poll: string, y: number, w: Week) => `${process.env.NEXT_PUBLIC_VOTE_URL}/ballot/${poll}/${y}/${weekSeg(w)}`,
};
```

### 17.9 Why these choices

| Decision | Reason |
|---|---|
| Level + sport folders (`/college/football`) | Room for `/high-school/…`; same sport words as team hubs; matches the current site, so fewer legacy 301s (§17.0, §27) |
| Static level/sport folders, no rewrites | Folders = URLs (James's rule); no internal paths to hide; simpler mental model for Cursor and for debugging |
| Route factory + codegen | One implementation per page type; sport trees (and a future level) can't drift |
| Article `/{sport}/news/{slug}`, editable slug | Short, keyword-rich; a slug change writes a permanent 301 via `auto-redirect`, and the route 404s on an unknown slug |
| Sport-agnostic `/teams/{school-nickname}` | On3-style single brand page per school; nickname disambiguates (e.g. two "Miami"s) and reads well; sport sections inside |
| `?page=n` | Matches SI/The Athletic; fewer folders; caching handled by `"use cache"` data functions (§17.6) |
| Bracket path `{division}/{year}` | One event per division per season; the URL is the key |
| Bracket division landing renders | "Latest year" without a redirect: shows the current event card and archive, links to `/{year}` |
| Voting on `vote.` | Separate high-trust audience; public `www` stays cacheable |
