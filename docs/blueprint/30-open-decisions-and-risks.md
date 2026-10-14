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
