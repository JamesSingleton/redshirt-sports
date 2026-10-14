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
