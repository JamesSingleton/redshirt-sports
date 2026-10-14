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
