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
