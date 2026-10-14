## 27. Legacy redirects from the current site (optional, one-time 301s)

v1.6 keeps the current site's `/college/{sport}/…` shape, so far fewer URLs move than in earlier versions. Migration is (a) importing content and poll history and (b) **optionally** 301-redirecting the old Redshirt URLs that actually carry traffic or links. **These and the automatic slug-change 301s are the only redirects.** There are no rewrites anywhere (§17). `/college` itself stays a 404: it was never a live URL, so a 301 from it would not be a legacy redirect.

### 27.1 Legacy map (keep it small; v1.6 reassessed)

The v1.6 level/sport structure (`/college/{sport}/…`, §17.0) is the **same shape as the current site**, so most sport URLs no longer need a redirect at all. Reassessed against today's routes (`/college/[sport]/news[/division[/conference]]`, `/college/[sport]/rankings/[division]/[year]/[week]`, `/college/teams/[slug]`, `/college/news`, root `/[slug]`, `/authors/[slug]`):

| Old URL (current site) | New URL | Redirect? |
|---|---|---|
| `/college/football/news`, `/college/mens-basketball/news`, `/college/womens-basketball/news` | Same | **None**: identical path, served by the new folder |
| `/college/news` | Same (`/college/news`, all college news) | **None** |
| `/college/football` (if linked) | Same (sport hub) | **None** |
| `/college/{sport}/rankings/{division}/{year}/{week}` with a numeric week, `0` or `final-rankings` | `/college/{sport}/rankings/{division}/{year}/week-{n}`, `/preseason`, `/final` | **3 patterns**, shipped with the new rankings routes (Decision #18). `7` → `week-7`, `0` → `preseason`, `final-rankings` → `final` |
| `/college/{sport}/news/{division}` | `/college/{sport}/{division}/news` | **1 pattern**, with `:division` constrained to the known division/browse-scope slugs (so it can never catch an article slug; Studio also reserves those slugs) |
| `/college/{sport}/news/{division}/{conference}` | `/college/{sport}/conferences/{conference}` | **1 pattern** (same constraint) |
| `/college/teams/{slug}` | `/teams/{school-nickname}` | `redirects` table rows (slug map), only for schools with traffic/links |
| Root-level article URLs (`/{slug}`) | `/college/{primarySport}/news/{slug}` | `redirects` table, read by the root catch-all only when no Sanity page matches |
| `/authors/{slug}` | `/people/{slug}` | 1 pattern |
| `/vote/…` on www | `vote.redshirtsports.com/…` | 1 pattern once `apps/vote` ships |
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
      // Rankings: only the week segment changed (v1.6). Sport/division paths are already identical.
      { source: "/college/:sport(football|mens-basketball|womens-basketball)/rankings/:div/:year(\\d{4})/0", destination: "/college/:sport/rankings/:div/:year/preseason", permanent: true },
      { source: "/college/:sport(football|mens-basketball|womens-basketball)/rankings/:div/:year(\\d{4})/final-rankings", destination: "/college/:sport/rankings/:div/:year/final", permanent: true },
      { source: "/college/:sport(football|mens-basketball|womens-basketball)/rankings/:div/:year(\\d{4})/:week(\\d{1,2})", destination: "/college/:sport/rankings/:div/:year/week-:week", permanent: true },
      // Division / conference news moved from news/{division} to {division}/news. DIVS = generated from the manifest.
      { source: `/college/:sport/news/:div(${DIVS})`, destination: "/college/:sport/:div/news", permanent: true },
      { source: `/college/:sport/news/:div(${DIVS})/:conf`, destination: "/college/:sport/conferences/:conf", permanent: true },
      { source: "/authors/:slug", destination: "/people/:slug", permanent: true },
    ];
  },
} satisfies import("next").NextConfig;
```

(Order matters: the `0` and `final-rankings` entries come before the numeric one. Current legacy week segments are documented in the repo's `docs/poll-weeks.md`. `permanent: true` emits 308 in Next.js; set `statusCode: 301` per entry if you want a literal 301. Either is a permanent redirect for search engines.)
