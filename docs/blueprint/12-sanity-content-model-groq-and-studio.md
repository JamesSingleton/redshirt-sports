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
- **Voters**: the poll transparency pages (`/college/football/rankings/fcs/voters/{voter}`) are Postgres data pages and always exist for active voters. If the voter also has a `person` doc with a profile (linked through `voterIds`), the voter page links to it and the person page shows a "Poll ballots" section (pulled from Postgres).

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
  "college", "high-school" /* future level, reserved now */, "teams", "people", "transfer-portal",
  "topics", "podcasts", "video", "bracket-challenge", "newsletters", "onboarding", "account", "search", "sign-in", "sign-up", "api", "studio",
  "sitemap.xml", "news-sitemap.xml", "sitemaps", "robots.txt", "feed.xml", "ads.txt", "manifest.webmanifest", "_next",
];
```

#### Catch-all route

Levels and sport sections are real static folders (`app/(site)/college/…`, `app/(site)/college/football/…`, §17.3). Static segments always match before the root catch-all, so `[...slug]` only sees paths no folder claims. `RESERVED_ROOT_SEGMENTS` is generated from the route manifest, so editors can't create a page whose slug shadows a section. No rewrites are involved.

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
