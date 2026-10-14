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
