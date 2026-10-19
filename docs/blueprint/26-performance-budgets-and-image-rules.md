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
